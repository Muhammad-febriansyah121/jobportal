<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OptimizedImageStorage
{
    public static function store(
        UploadedFile $file,
        string $directory,
        int $maxWidth,
        int $maxHeight,
        int $quality = 82,
        string $disk = 'public',
    ): string {
        if (! function_exists('imagewebp')) {
            return $file->store($directory, $disk);
        }

        $contents = $file->get();
        $source = imagecreatefromstring($contents);

        if ($source === false) {
            return $file->store($directory, $disk);
        }

        $width = imagesx($source);
        $height = imagesy($source);
        $scale = min(1, $maxWidth / $width, $maxHeight / $height);
        $targetWidth = max(1, (int) round($width * $scale));
        $targetHeight = max(1, (int) round($height * $scale));
        $target = imagecreatetruecolor($targetWidth, $targetHeight);

        imagealphablending($target, false);
        imagesavealpha($target, true);
        imagecopyresampled($target, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        ob_start();
        $encoded = imagewebp($target, null, $quality);
        $contents = ob_get_clean();

        imagedestroy($target);

        if (! $encoded || $contents === false || $contents === '') {
            return $file->store($directory, $disk);
        }

        $path = trim($directory, '/').'/'.Str::uuid()->toString().'.webp';
        Storage::disk($disk)->put($path, $contents, 'public');

        return $path;
    }

    public static function publicPathFromUrl(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH) ?: $url;

        if (str_starts_with($path, '/storage/')) {
            return ltrim(substr($path, strlen('/storage/')), '/');
        }

        return str_starts_with($path, 'storage/')
            ? substr($path, strlen('storage/'))
            : null;
    }
}

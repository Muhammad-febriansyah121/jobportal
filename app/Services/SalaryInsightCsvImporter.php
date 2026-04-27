<?php

namespace App\Services;

use App\Models\Industry;
use App\Models\SalaryInsight;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use SplFileObject;

class SalaryInsightCsvImporter
{
    /**
     * @return array{total_rows:int,valid_rows:int,skipped_rows:int,aggregated_rows:int,created:int,updated:int,dry_run:bool}
     */
    public function import(
        string $filePath,
        bool $publish = false,
        bool $dryRun = false,
        ?string $sourceName = null,
        ?string $datasetDate = null,
    ): array {
        if (! is_readable($filePath)) {
            throw new InvalidArgumentException('File CSV tidak ditemukan atau tidak bisa dibaca.');
        }

        if ($datasetDate !== null && ! $this->isValidDate($datasetDate)) {
            throw new InvalidArgumentException('Format dataset date harus YYYY-MM-DD.');
        }

        $industryIdsByName = Industry::query()
            ->select(['id', 'name'])
            ->get()
            ->mapWithKeys(fn (Industry $industry): array => [
                Str::lower(trim($industry->name)) => $industry->id,
            ])
            ->all();

        $rows = $this->readRows($filePath, $industryIdsByName);
        $groups = $this->aggregate($rows['valid_rows']);

        $summary = [
            'total_rows' => $rows['total_rows'],
            'valid_rows' => count($rows['valid_rows']),
            'skipped_rows' => $rows['skipped_rows'],
            'aggregated_rows' => count($groups),
            'created' => 0,
            'updated' => 0,
            'dry_run' => $dryRun,
        ];

        if ($dryRun || $groups === []) {
            return $summary;
        }

        $publishedAt = $publish ? now() : null;

        DB::transaction(function () use (&$summary, $datasetDate, $groups, $publishedAt, $sourceName): void {
            foreach ($groups as $group) {
                $existing = SalaryInsight::query()
                    ->whereNull('company_id')
                    ->where('job_title', $group['job_title'])
                    ->where('location_city', $group['location_city'])
                    ->where('industry_id', $group['industry_id'])
                    ->first();

                $payload = [
                    'industry_id' => $group['industry_id'],
                    'job_title' => $group['job_title'],
                    'location_city' => $group['location_city'],
                    'source_name' => $sourceName,
                    'dataset_date' => $datasetDate,
                    'salary_min' => $group['salary_min'],
                    'salary_median' => $group['salary_median'],
                    'salary_max' => $group['salary_max'],
                    'source_count' => $group['source_count'],
                ];

                if ($existing instanceof SalaryInsight) {
                    if ($publishedAt !== null) {
                        $payload['published_at'] = $publishedAt;
                    }

                    $existing->update($payload);
                    $summary['updated']++;

                    continue;
                }

                SalaryInsight::query()->create([
                    ...$payload,
                    'company_id' => null,
                    'published_at' => $publishedAt,
                ]);

                $summary['created']++;
            }
        });

        return $summary;
    }

    /**
     * @param  array<string, int>  $industryIdsByName
     * @return array{total_rows:int,skipped_rows:int,valid_rows:array<int, array{job_title:string,location_city:?string,industry_id:?int,salary_min:int,salary_median:int,salary_max:int,source_count:int}>}
     */
    private function readRows(string $filePath, array &$industryIdsByName): array
    {
        $handle = fopen($filePath, 'r');
        $firstLine = $handle === false ? '' : (string) (fgets($handle) ?: '');

        if (is_resource($handle)) {
            fclose($handle);
        }

        $delimiter = $this->detectDelimiter($firstLine);

        $file = new SplFileObject($filePath);
        $file->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY);
        $file->setCsvControl($delimiter);

        $headers = null;
        $totalRows = 0;
        $skippedRows = 0;
        $validRows = [];

        foreach ($file as $row) {
            if (! is_array($row) || $row === [null]) {
                continue;
            }

            if ($headers === null) {
                $headers = array_map(fn ($value): string => $this->normalizeHeader((string) $value), $row);

                continue;
            }

            $totalRows++;
            $record = $this->mapRowToRecord($headers, $row, $industryIdsByName);

            if ($record === null) {
                $skippedRows++;

                continue;
            }

            $validRows[] = $record;
        }

        return [
            'total_rows' => $totalRows,
            'skipped_rows' => $skippedRows,
            'valid_rows' => $validRows,
        ];
    }

    private function detectDelimiter(string $headerLine): string
    {
        return substr_count($headerLine, ';') > substr_count($headerLine, ',') ? ';' : ',';
    }

    private function normalizeHeader(string $header): string
    {
        return Str::of($header)
            ->trim()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->toString();
    }

    /**
     * @param  array<int, string>  $headers
     * @param  array<int, mixed>  $row
     * @param  array<string, int>  $industryIdsByName
     * @return array{job_title:string,location_city:?string,industry_id:?int,salary_min:int,salary_median:int,salary_max:int,source_count:int}|null
     */
    private function mapRowToRecord(array $headers, array $row, array &$industryIdsByName): ?array
    {
        $row = array_pad($row, count($headers), null);
        $assoc = array_combine($headers, $row);

        if (! is_array($assoc)) {
            return null;
        }

        $jobTitle = $this->cleanText($this->pick($assoc, ['job_title', 'job_name', 'title', 'position', 'profession', 'nama_profesi']));

        if ($jobTitle === null) {
            return null;
        }

        $locationCity = $this->cleanText($this->pick($assoc, ['location_city', 'location', 'lokasi', 'city', 'kota']));

        [$rangeMin, $rangeMax] = $this->parseSalaryRange($this->pick($assoc, ['gaji', 'salary_range']));

        $salaryMin = $this->parseMoney($this->pick($assoc, ['salary_min', 'min_salary', 'gaji_min'])) ?? $rangeMin;
        $salaryMedian = $this->parseMoney($this->pick($assoc, ['salary_median', 'median_salary', 'gaji_median', 'median_gaji']));
        $salaryMax = $this->parseMoney($this->pick($assoc, ['salary_max', 'max_salary', 'gaji_max'])) ?? $rangeMax;

        if ($salaryMin === null && $salaryMedian === null && $salaryMax === null) {
            return null;
        }

        $salaryMin ??= $salaryMedian ?? $salaryMax;
        $salaryMax ??= $salaryMedian ?? $salaryMin;

        if ($salaryMin > $salaryMax) {
            [$salaryMin, $salaryMax] = [$salaryMax, $salaryMin];
        }

        $salaryMedian ??= (int) floor(($salaryMin + $salaryMax) / 2);

        $industryName = $this->cleanText($this->pick($assoc, ['industry_name', 'industry', 'industri', 'sector', 'sektor']));
        $industryId = $this->resolveIndustryId($industryName, $industryIdsByName);

        $sourceCount = $this->parseMoney($this->pick($assoc, ['source_count', 'sources', 'jumlah_sumber']));

        return [
            'job_title' => Str::title($jobTitle),
            'location_city' => $locationCity !== null ? Str::title($locationCity) : null,
            'industry_id' => $industryId,
            'salary_min' => $salaryMin,
            'salary_median' => $salaryMedian,
            'salary_max' => $salaryMax,
            'source_count' => max(1, $sourceCount ?? 1),
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  array<int, string>  $keys
     */
    private function pick(array $row, array $keys): mixed
    {
        foreach ($keys as $key) {
            if (array_key_exists($key, $row)) {
                return $row[$key];
            }
        }

        return null;
    }

    private function cleanText(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = trim((string) $value);
        $text = preg_replace('/\s+/', ' ', $text);
        $text = is_string($text) ? trim($text) : '';

        return $text !== '' ? $text : null;
    }

    private function parseMoney(mixed $value): ?int
    {
        if ($value === null) {
            return null;
        }

        if (is_int($value)) {
            return $value;
        }

        if (is_float($value)) {
            return (int) round($value);
        }

        $stringValue = trim((string) $value);

        if ($stringValue === '') {
            return null;
        }

        if (preg_match('/^-?\d+(\.\d+)?$/', $stringValue) === 1) {
            return (int) round((float) $stringValue);
        }

        $digits = preg_replace('/[^0-9]/', '', $stringValue);

        if (! is_string($digits) || $digits === '') {
            return null;
        }

        return (int) $digits;
    }

    /**
     * @return array{0:?int,1:?int}
     */
    private function parseSalaryRange(mixed $value): array
    {
        if (! is_string($value)) {
            return [null, null];
        }

        $matches = [];
        preg_match_all('/\d+/', $value, $matches);

        $numbers = array_map(fn (string $number): int => (int) $number, $matches[0] ?? []);

        if ($numbers === []) {
            return [null, null];
        }

        if (count($numbers) === 1) {
            return [$numbers[0], $numbers[0]];
        }

        sort($numbers);

        return [$numbers[0], $numbers[count($numbers) - 1]];
    }

    /**
     * @param  array<string, int>  $industryIdsByName
     */
    private function resolveIndustryId(?string $industryName, array &$industryIdsByName): ?int
    {
        if ($industryName === null) {
            return null;
        }

        $normalizedName = Str::of($industryName)
            ->lower()
            ->squish()
            ->toString();

        if ($normalizedName === '') {
            return null;
        }

        if (array_key_exists($normalizedName, $industryIdsByName)) {
            return $industryIdsByName[$normalizedName];
        }

        $industry = Industry::query()->firstOrCreate(
            ['slug' => Str::slug($industryName)],
            ['name' => Str::title($industryName)],
        );

        $industryIdsByName[$normalizedName] = $industry->id;

        return $industry->id;
    }

    /**
     * @param  array<int, array{job_title:string,location_city:?string,industry_id:?int,salary_min:int,salary_median:int,salary_max:int,source_count:int}>  $rows
     * @return array<int, array{job_title:string,location_city:?string,industry_id:?int,salary_min:int,salary_median:int,salary_max:int,source_count:int}>
     */
    private function aggregate(array $rows): array
    {
        $groups = [];

        foreach ($rows as $row) {
            $key = implode('|', [
                Str::lower($row['job_title']),
                Str::lower((string) ($row['location_city'] ?? '')),
                (string) ($row['industry_id'] ?? 0),
            ]);

            if (! array_key_exists($key, $groups)) {
                $groups[$key] = [
                    'job_title' => $row['job_title'],
                    'location_city' => $row['location_city'],
                    'industry_id' => $row['industry_id'],
                    'salary_min' => $row['salary_min'],
                    'salary_max' => $row['salary_max'],
                    'source_count' => 0,
                    'medians' => [],
                ];
            }

            $groups[$key]['salary_min'] = min($groups[$key]['salary_min'], $row['salary_min']);
            $groups[$key]['salary_max'] = max($groups[$key]['salary_max'], $row['salary_max']);
            $groups[$key]['source_count'] += $row['source_count'];
            $groups[$key]['medians'][] = $row['salary_median'];
        }

        return array_values(array_map(function (array $group): array {
            $medians = $group['medians'];
            sort($medians);
            $count = count($medians);
            $middleIndex = (int) floor($count / 2);

            $salaryMedian = $count % 2 === 0
                ? (int) floor(($medians[$middleIndex - 1] + $medians[$middleIndex]) / 2)
                : $medians[$middleIndex];

            return [
                'job_title' => $group['job_title'],
                'location_city' => $group['location_city'],
                'industry_id' => $group['industry_id'],
                'salary_min' => $group['salary_min'],
                'salary_median' => $salaryMedian,
                'salary_max' => $group['salary_max'],
                'source_count' => $group['source_count'],
            ];
        }, $groups));
    }

    private function isValidDate(string $date): bool
    {
        $parsed = date_create_from_format('Y-m-d', $date);

        return $parsed !== false && $parsed->format('Y-m-d') === $date;
    }
}

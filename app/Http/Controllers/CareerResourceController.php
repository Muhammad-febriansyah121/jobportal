<?php

namespace App\Http\Controllers;

use App\Models\CareerResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CareerResourceController extends Controller
{
    public function index(Request $request): Response
    {
        $type = $request->string('type')->toString();
        $category = $request->string('category')->toString();
        $search = $request->string('search')->toString();

        $resources = CareerResource::query()
            ->select(['id', 'title', 'slug', 'type', 'category', 'thumbnail_path', 'content', 'published_at'])
            ->whereNotNull('published_at')
            ->when(filled($type), fn (Builder $q) => $q->where('type', $type))
            ->when(filled($category), fn (Builder $q) => $q->where('category', $category))
            ->when(filled($search), fn (Builder $q) => $q->where('title', 'like', '%'.$search.'%'))
            ->latest('published_at')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (CareerResource $r): array => $this->toCardArray($r));

        $types = CareerResource::query()
            ->whereNotNull('published_at')
            ->distinct()
            ->orderBy('type')
            ->pluck('type')
            ->values();

        $categories = CareerResource::query()
            ->whereNotNull('published_at')
            ->whereNotNull('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->values();

        $featured = CareerResource::query()
            ->select(['id', 'title', 'slug', 'type', 'category', 'thumbnail_path', 'content', 'published_at'])
            ->whereNotNull('published_at')
            ->latest('published_at')
            ->limit(3)
            ->get()
            ->map(fn (CareerResource $r): array => $this->toCardArray($r));

        return Inertia::render('front/career-resources/index', [
            'resources' => $resources,
            'featured' => $featured,
            'filters' => [
                'type' => $type,
                'category' => $category,
                'search' => $search,
            ],
            'types' => $types,
            'categories' => $categories,
        ]);
    }

    /**
     * Map a resource to the card payload shared by index, featured, and related lists.
     *
     * @return array{id:int,title:string,slug:string,type:string,category:?string,thumbnail_path:?string,excerpt:string,reading_time:int,published_at:?string}
     */
    private function toCardArray(CareerResource $r): array
    {
        $plain = trim(preg_replace('/\s+/', ' ', strip_tags((string) $r->content)) ?? '');
        $words = str_word_count($plain);

        return [
            'id' => $r->id,
            'title' => $r->title,
            'slug' => $r->slug,
            'type' => $r->type,
            'category' => $r->category,
            'thumbnail_path' => $r->thumbnail_path
                ? asset('storage/'.$r->thumbnail_path)
                : null,
            'excerpt' => Str::limit($plain, 120),
            'reading_time' => max(1, (int) ceil($words / 200)),
            'published_at' => $r->published_at?->diffForHumans(),
        ];
    }

    public function show(CareerResource $careerResource): Response
    {
        abort_unless(filled($careerResource->published_at), 404);

        $related = CareerResource::query()
            ->select(['id', 'title', 'slug', 'type', 'category', 'thumbnail_path', 'content', 'published_at'])
            ->whereNotNull('published_at')
            ->where('id', '!=', $careerResource->id)
            ->where(fn (Builder $q) => $q
                ->where('category', $careerResource->category)
                ->orWhere('type', $careerResource->type))
            ->latest('published_at')
            ->limit(3)
            ->get()
            ->map(fn (CareerResource $r): array => $this->toCardArray($r));

        $plain = trim(preg_replace('/\s+/', ' ', strip_tags((string) $careerResource->content)) ?? '');

        return Inertia::render('front/career-resources/show', [
            'resource' => [
                'id' => $careerResource->id,
                'title' => $careerResource->title,
                'slug' => $careerResource->slug,
                'type' => $careerResource->type,
                'category' => $careerResource->category,
                'thumbnail_path' => $careerResource->thumbnail_path
                    ? asset('storage/'.$careerResource->thumbnail_path)
                    : null,
                'content' => $careerResource->content,
                'reading_time' => max(1, (int) ceil(str_word_count($plain) / 200)),
                'published_at' => $careerResource->published_at?->format('d M Y'),
            ],
            'related' => $related,
        ]);
    }
}

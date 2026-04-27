<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Models\CareerResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateCareerResourceController extends Controller
{
    public function index(Request $request): Response
    {
        $type = $request->string('type')->toString();
        $category = $request->string('category')->toString();

        $resources = CareerResource::query()
            ->select(['id', 'title', 'slug', 'type', 'category', 'thumbnail_path', 'published_at'])
            ->whereNotNull('published_at')
            ->when(filled($type), fn (Builder $q) => $q->where('type', $type))
            ->when(filled($category), fn (Builder $q) => $q->where('category', $category))
            ->latest('published_at')
            ->paginate(12)
            ->withQueryString();

        $types = CareerResource::query()
            ->whereNotNull('published_at')
            ->distinct()
            ->pluck('type')
            ->sort()
            ->values();

        $categories = CareerResource::query()
            ->whereNotNull('published_at')
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->sort()
            ->values();

        return Inertia::render('candidate/career-resources/index', [
            'resources' => $resources->through(fn (CareerResource $r): array => [
                'id' => $r->id,
                'title' => $r->title,
                'slug' => $r->slug,
                'type' => $r->type,
                'category' => $r->category,
                'thumbnail_path' => $r->thumbnail_path
                    ? asset('storage/'.$r->thumbnail_path)
                    : null,
                'published_at' => $r->published_at?->diffForHumans(),
            ]),
            'filters' => [
                'type' => $type,
                'category' => $category,
            ],
            'types' => $types,
            'categories' => $categories,
        ]);
    }

    public function show(CareerResource $careerResource): Response
    {
        abort_unless(filled($careerResource->published_at), 404);

        $related = CareerResource::query()
            ->select(['id', 'title', 'slug', 'type', 'category', 'published_at'])
            ->whereNotNull('published_at')
            ->where('id', '!=', $careerResource->id)
            ->where(fn (Builder $q) => $q
                ->where('category', $careerResource->category)
                ->orWhere('type', $careerResource->type))
            ->latest('published_at')
            ->limit(4)
            ->get()
            ->map(fn (CareerResource $r): array => [
                'id' => $r->id,
                'title' => $r->title,
                'slug' => $r->slug,
                'type' => $r->type,
                'category' => $r->category,
                'published_at' => $r->published_at?->diffForHumans(),
            ]);

        return Inertia::render('candidate/career-resources/show', [
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
                'published_at' => $careerResource->published_at?->format('d M Y'),
            ],
            'related' => $related,
        ]);
    }
}

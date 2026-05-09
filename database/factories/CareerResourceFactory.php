<?php

namespace Database\Factories;

use App\Models\CareerResource;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CareerResource>
 */
class CareerResourceFactory extends Factory
{
    /** @var array<int, array{title: string, type: string, category: string}> */
    private static array $resources = [
        ['title' => 'How to Write a Standout Resume', 'type' => 'article', 'category' => 'Resume'],
        ['title' => 'Resume Templates for Fresh Graduates', 'type' => 'template', 'category' => 'Resume'],
        ['title' => 'ATS-Friendly Resume Tips', 'type' => 'guide', 'category' => 'Resume'],
        ['title' => 'Cover Letter Writing Guide', 'type' => 'guide', 'category' => 'Resume'],
        ['title' => 'Top 10 Interview Questions Answered', 'type' => 'article', 'category' => 'Interview'],
        ['title' => 'How to Prepare for a Technical Interview', 'type' => 'guide', 'category' => 'Interview'],
        ['title' => 'Behavioral Interview Techniques (STAR Method)', 'type' => 'article', 'category' => 'Interview'],
        ['title' => 'Mock Interview Practice Video', 'type' => 'video', 'category' => 'Interview'],
        ['title' => 'How to Negotiate Your Salary', 'type' => 'article', 'category' => 'Career Growth'],
        ['title' => 'Setting Career Goals That Actually Work', 'type' => 'guide', 'category' => 'Career Growth'],
        ['title' => 'Transitioning Careers: A Step-by-Step Guide', 'type' => 'guide', 'category' => 'Career Growth'],
        ['title' => 'Building a Personal Brand on LinkedIn', 'type' => 'video', 'category' => 'Career Growth'],
        ['title' => 'How to Find Your First Job After Graduation', 'type' => 'article', 'category' => 'Job Search'],
        ['title' => 'Job Search Strategies That Work in 2025', 'type' => 'guide', 'category' => 'Job Search'],
        ['title' => 'Using LinkedIn Effectively for Job Hunting', 'type' => 'article', 'category' => 'Job Search'],
        ['title' => 'Remote Work Job Search Tips', 'type' => 'article', 'category' => 'Job Search'],
        ['title' => 'How to Network Like a Pro', 'type' => 'guide', 'category' => 'Networking'],
        ['title' => 'Building Professional Relationships Online', 'type' => 'article', 'category' => 'Networking'],
        ['title' => 'Attending Industry Events & Meetups', 'type' => 'article', 'category' => 'Networking'],
        ['title' => 'Cold Outreach Email Templates', 'type' => 'template', 'category' => 'Networking'],
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $resource = $this->faker->unique()->randomElement(self::$resources);

        return [
            'title' => $resource['title'],
            'slug' => Str::slug($resource['title']),
            'type' => $resource['type'],
            'category' => $resource['category'],
            'thumbnail_path' => null,
            'content' => $this->faker->paragraphs(5, true),
            'published_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ];
    }
}

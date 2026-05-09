<?php

namespace Database\Factories;

use App\Models\Skill;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Skill>
 */
class SkillFactory extends Factory
{
    /** @var array<int, array{name: string, category: string}> */
    private static array $skills = [
        ['name' => 'PHP', 'category' => 'Programming'],
        ['name' => 'Python', 'category' => 'Programming'],
        ['name' => 'JavaScript', 'category' => 'Programming'],
        ['name' => 'TypeScript', 'category' => 'Programming'],
        ['name' => 'Java', 'category' => 'Programming'],
        ['name' => 'Go', 'category' => 'Programming'],
        ['name' => 'React', 'category' => 'Programming'],
        ['name' => 'Vue.js', 'category' => 'Programming'],
        ['name' => 'Node.js', 'category' => 'Programming'],
        ['name' => 'Laravel', 'category' => 'Programming'],
        ['name' => 'SQL', 'category' => 'Data'],
        ['name' => 'MySQL', 'category' => 'Data'],
        ['name' => 'PostgreSQL', 'category' => 'Data'],
        ['name' => 'MongoDB', 'category' => 'Data'],
        ['name' => 'Data Analysis', 'category' => 'Data'],
        ['name' => 'Machine Learning', 'category' => 'Data'],
        ['name' => 'Docker', 'category' => 'DevOps'],
        ['name' => 'Kubernetes', 'category' => 'DevOps'],
        ['name' => 'CI/CD', 'category' => 'DevOps'],
        ['name' => 'AWS', 'category' => 'DevOps'],
        ['name' => 'UI/UX Design', 'category' => 'Design'],
        ['name' => 'Figma', 'category' => 'Design'],
        ['name' => 'Adobe Photoshop', 'category' => 'Design'],
        ['name' => 'Project Management', 'category' => 'Management'],
        ['name' => 'Agile & Scrum', 'category' => 'Management'],
        ['name' => 'Product Management', 'category' => 'Management'],
        ['name' => 'Communication', 'category' => 'Soft Skills'],
        ['name' => 'Problem Solving', 'category' => 'Soft Skills'],
        ['name' => 'Leadership', 'category' => 'Soft Skills'],
        ['name' => 'Critical Thinking', 'category' => 'Soft Skills'],
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $skill = $this->faker->unique()->randomElement(self::$skills);

        return [
            'name' => $skill['name'],
            'slug' => Str::slug($skill['name']),
            'category' => $skill['category'],
        ];
    }
}

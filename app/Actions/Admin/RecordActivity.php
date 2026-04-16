<?php

namespace App\Actions\Admin;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class RecordActivity
{
    /**
     * @param  array<string, mixed>  $properties
     */
    public function handle(?User $actor, string $action, Model|string|null $subject = null, array $properties = []): ActivityLog
    {
        return ActivityLog::create([
            'actor_id' => $actor?->id,
            'action' => $action,
            'subject_type' => $subject instanceof Model ? $subject::class : $subject,
            'subject_id' => $subject instanceof Model ? $subject->getKey() : null,
            'properties_json' => $properties === [] ? null : $properties,
        ]);
    }
}

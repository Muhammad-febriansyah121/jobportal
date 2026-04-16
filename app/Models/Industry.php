<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'slug'])]
class Industry extends Model
{
    public function companies()
    {
        return $this->hasMany(Company::class);
    }

    public function jobListings()
    {
        return $this->hasMany(JobListing::class);
    }

    public function salaryInsights()
    {
        return $this->hasMany(SalaryInsight::class);
    }
}

<?php

namespace App\Models;

use Database\Factories\IndustryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'slug'])]
class Industry extends Model
{
    /** @use HasFactory<IndustryFactory> */
    use HasFactory;

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

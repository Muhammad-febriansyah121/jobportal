<?php

namespace App\Models;

use Database\Factories\CompanySizeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompanySize extends Model
{
    /** @use HasFactory<CompanySizeFactory> */
    use HasFactory;

    protected $fillable = ['label', 'sort_order'];

    public function companies(): HasMany
    {
        return $this->hasMany(Company::class, 'company_size', 'label');
    }
}

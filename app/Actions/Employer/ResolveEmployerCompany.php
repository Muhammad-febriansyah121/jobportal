<?php

namespace App\Actions\Employer;

use App\Models\Company;
use App\Models\User;

class ResolveEmployerCompany
{
    public function handle(User $user): ?Company
    {
        $ownedCompany = $user->ownedCompanies()
            ->with([
                'industry:id,name',
            ])
            ->first();

        if ($ownedCompany !== null) {
            return $ownedCompany;
        }

        return $user->companyMemberships()
            ->where('is_active', true)
            ->with([
                'company.industry:id,name',
            ])
            ->first()
            ?->company;
    }
}

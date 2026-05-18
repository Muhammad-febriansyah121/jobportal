<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;

return new class extends Migration
{
    public function up(): void
    {
        $defaults = [
            'smtp_host' => 'mail.karivia.id',
            'smtp_port' => '587',
            'smtp_encryption' => 'tls',
            'smtp_auth' => '1',
            'smtp_username' => 'support@karivia.id',
            'smtp_from_address' => 'support@karivia.id',
            'smtp_from_name' => 'Karivia',
        ];

        foreach ($defaults as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        $existingPassword = Setting::where('key', 'smtp_password')->value('value');

        if ($existingPassword === null || $existingPassword === '') {
            Setting::updateOrCreate(
                ['key' => 'smtp_password'],
                ['value' => Crypt::encryptString('supportkarivia123')],
            );
        }
    }

    public function down(): void
    {
        Setting::whereIn('key', [
            'smtp_host',
            'smtp_port',
            'smtp_encryption',
            'smtp_auth',
            'smtp_username',
            'smtp_password',
            'smtp_from_address',
            'smtp_from_name',
        ])->delete();
    }
};

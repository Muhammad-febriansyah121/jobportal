<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['key' => 'recaptcha_site_key', 'value' => ''],
            ['key' => 'recaptcha_secret_key', 'value' => ''],
            ['key' => 'recaptcha_enabled', 'value' => 'false'],
            ['key' => 'pakasir_project', 'value' => 'jobportal'],
            ['key' => 'pakasir_api_key', 'value' => ''],
        ];

        foreach ($defaults as $setting) {
            Setting::firstOrCreate(['key' => $setting['key']], ['value' => $setting['value']]);
        }
    }
}

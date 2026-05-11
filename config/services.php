<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_secret' => env('GOOGLE_OAUTH_CLIENT_SECRET'),
    ],

    'google_calendar' => [
        'client_id' => env('GOOGLE_CALENDAR_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CALENDAR_CLIENT_SECRET'),
        'redirect_uri' => env('GOOGLE_CALENDAR_REDIRECT_URI'),
    ],

    'google_login' => [
        'client_id' => env('GOOGLE_LOGIN_CLIENT_ID'),
        'client_secret' => env('GOOGLE_LOGIN_CLIENT_SECRET'),
    ],

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-5'),
        'api_url' => env('OPENAI_API_URL'),
    ],

    'pakasir' => [
        'project' => env('PAKASIR_PROJECT', 'jobportal'),
        'api_key' => env('PAKASIR_API_KEY'),
    ],

    'whatsapp' => [
        'base_url' => env('WHATSAPP_GATEWAY_URL'),
        'api_key' => env('WHATSAPP_GATEWAY_API_KEY'),
        'default_session_id' => env('WHATSAPP_GATEWAY_DEFAULT_SESSION_ID'),
        'connect_timeout' => (int) env('WHATSAPP_GATEWAY_CONNECT_TIMEOUT', 3),
        'timeout' => (int) env('WHATSAPP_GATEWAY_TIMEOUT', 10),
    ],

];

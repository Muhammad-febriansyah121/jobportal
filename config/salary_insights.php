<?php

return [
    'auto_import' => [
        'dataset_date' => env('SALARY_INSIGHT_AUTO_IMPORT_DATASET_DATE'),
        'enabled' => env('SALARY_INSIGHT_AUTO_IMPORT_ENABLED', false),
        'file' => env('SALARY_INSIGHT_AUTO_IMPORT_FILE'),
        'publish' => env('SALARY_INSIGHT_AUTO_IMPORT_PUBLISH', true),
        'source' => env('SALARY_INSIGHT_AUTO_IMPORT_SOURCE', 'LinkedIn + JobStreet'),
        'time' => env('SALARY_INSIGHT_AUTO_IMPORT_TIME', '02:00'),
    ],
];

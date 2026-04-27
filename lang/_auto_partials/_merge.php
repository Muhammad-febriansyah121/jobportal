<?php

/**
 * Merger: takes all partial JSON files in lang/_auto_partials/ and merges
 * the keys into lang/id.json and lang/en.json.
 *
 * Usage: php lang/_auto_partials/_merge.php
 *
 * Partial format:
 * {
 *   "key.path": { "id": "Indonesian", "en": "English" }
 * }
 *
 * Existing keys in lang/id.json or lang/en.json are NOT overwritten —
 * keys that already exist there win, partials only add missing keys.
 */
$partialDir = __DIR__;
$idPath = dirname(__DIR__).'/id.json';
$enPath = dirname(__DIR__).'/en.json';

$existingId = json_decode((string) file_get_contents($idPath), true) ?: [];
$existingEn = json_decode((string) file_get_contents($enPath), true) ?: [];

$idAdded = [];
$enAdded = [];
$conflicts = [];
$totalKeys = 0;

foreach (glob($partialDir.'/*.json') as $file) {
    $basename = basename($file);
    if ($basename === '_merge.php' || str_starts_with($basename, '_')) {
        continue;
    }

    $partial = json_decode((string) file_get_contents($file), true);
    if (! is_array($partial)) {
        echo "[skip] {$basename}: invalid JSON\n";

        continue;
    }

    foreach ($partial as $key => $value) {
        if (! is_array($value) || ! isset($value['id'], $value['en'])) {
            echo "[skip] {$basename}::{$key}: missing id/en\n";

            continue;
        }

        $totalKeys++;

        // Skip if key already exists in main lang files (don't overwrite manual translations)
        if (array_key_exists($key, $existingId)) {
            $conflicts[] = "{$basename}::{$key}";

            continue;
        }

        $idAdded[$key] = $value['id'];
        $enAdded[$key] = $value['en'];
    }
}

// Merge
$mergedId = $existingId + $idAdded;
$mergedEn = $existingEn + $enAdded;

ksort($mergedId);
ksort($mergedEn);

file_put_contents($idPath, json_encode($mergedId, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n");
file_put_contents($enPath, json_encode($mergedEn, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n");

echo "\n=== Merge Report ===\n";
echo 'Total partial keys scanned: '.$totalKeys."\n";
echo 'Added to id.json: '.count($idAdded)."\n";
echo 'Added to en.json: '.count($enAdded)."\n";
echo 'Skipped (already in main lang): '.count($conflicts)."\n";
echo 'Total keys in id.json: '.count($mergedId)."\n";
echo 'Total keys in en.json: '.count($mergedEn)."\n";

if ($conflicts !== []) {
    echo "\nConflicts (existing keys preserved):\n";
    foreach (array_slice($conflicts, 0, 10) as $c) {
        echo "  - {$c}\n";
    }
    if (count($conflicts) > 10) {
        echo '  ... and '.(count($conflicts) - 10)." more\n";
    }
}

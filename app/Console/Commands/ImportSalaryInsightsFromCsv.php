<?php

namespace App\Console\Commands;

use App\Services\SalaryInsightCsvImporter;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use InvalidArgumentException;

#[Signature('salary-insights:import
    {file : Path file CSV (relative ke project atau absolute path)}
    {--source= : Nama sumber data (mis. LinkedIn + JobStreet)}
    {--dataset-date= : Tanggal dataset dengan format YYYY-MM-DD}
    {--publish : Tandai hasil import sebagai published}
    {--dry-run : Validasi dan aggregasi tanpa menyimpan ke database}')]
#[Description('Import data salary insight dari dataset CSV secara aman')]
class ImportSalaryInsightsFromCsv extends Command
{
    public function handle(SalaryInsightCsvImporter $importer): int
    {
        $pathInput = (string) $this->argument('file');
        $filePath = is_file($pathInput) ? $pathInput : base_path($pathInput);

        try {
            $summary = $importer->import(
                filePath: $filePath,
                publish: (bool) $this->option('publish'),
                dryRun: (bool) $this->option('dry-run'),
                sourceName: $this->cleanStringOption('source'),
                datasetDate: $this->cleanStringOption('dataset-date'),
            );
        } catch (InvalidArgumentException $exception) {
            $this->components->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->components->twoColumnDetail('Total rows', (string) $summary['total_rows']);
        $this->components->twoColumnDetail('Valid rows', (string) $summary['valid_rows']);
        $this->components->twoColumnDetail('Skipped rows', (string) $summary['skipped_rows']);
        $this->components->twoColumnDetail('Aggregated rows', (string) $summary['aggregated_rows']);

        if ($summary['dry_run']) {
            $this->components->info('Dry run selesai. Tidak ada data yang disimpan.');

            return self::SUCCESS;
        }

        $this->components->twoColumnDetail('Created', (string) $summary['created']);
        $this->components->twoColumnDetail('Updated', (string) $summary['updated']);
        $this->components->info('Import salary insight selesai.');

        return self::SUCCESS;
    }

    private function cleanStringOption(string $key): ?string
    {
        $value = trim((string) $this->option($key));

        return $value !== '' ? $value : null;
    }
}

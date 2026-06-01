<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminDatabaseBackupController extends Controller
{
    public function index(): Response
    {
        $connection = config('database.default');
        $config = config("database.connections.{$connection}");

        return Inertia::render('admin/database-backup', [
            'database' => [
                'name' => (string) ($config['database'] ?? 'unknown'),
                'host' => (string) ($config['host'] ?? 'unknown'),
                'port' => (int) ($config['port'] ?? 3306),
            ],
        ]);
    }

    public function download(): StreamedResponse
    {
        $filename = 'backup_karivia_'.now()->format('Y-m-d_H-i-s').'.sql';

        return response()->streamDownload(function (): void {
            set_time_limit(0);

            $pdo = DB::getPdo();
            $connection = config('database.default');
            $dbName = (string) config("database.connections.{$connection}.database");

            $this->out('-- Karivia Database Backup');
            $this->out('-- Generated: '.now()->toIso8601String());
            $this->out("-- Database: {$dbName}");
            $this->out('');
            $this->out('SET NAMES utf8mb4;');
            $this->out('SET FOREIGN_KEY_CHECKS=0;');
            $this->out('SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";');
            $this->out('');
            $this->flush();

            $tables = DB::select('SHOW TABLES');

            foreach ($tables as $tableRow) {
                $table = (string) array_values((array) $tableRow)[0];

                $createResult = DB::select("SHOW CREATE TABLE `{$table}`");
                $createSql = (string) ($createResult[0]->{'Create Table'} ?? '');

                $this->out('-- --------------------------------------------------------');
                $this->out("-- Table: `{$table}`");
                $this->out('-- --------------------------------------------------------');
                $this->out('');
                $this->out("DROP TABLE IF EXISTS `{$table}`;");
                $this->out("{$createSql};");
                $this->out('');
                $this->flush();

                $offset = 0;
                $batchSize = 250;

                do {
                    $rows = DB::select("SELECT * FROM `{$table}` LIMIT {$batchSize} OFFSET {$offset}");

                    if (empty($rows)) {
                        break;
                    }

                    $columns = array_keys((array) $rows[0]);
                    $columnList = '`'.implode('`, `', $columns).'`';

                    $values = array_map(function (object $row) use ($pdo): string {
                        $rowValues = array_map(function ($val) use ($pdo): string {
                            if ($val === null) {
                                return 'NULL';
                            }

                            return $pdo->quote((string) $val);
                        }, (array) $row);

                        return '('.implode(', ', $rowValues).')';
                    }, $rows);

                    $this->out("INSERT INTO `{$table}` ({$columnList}) VALUES");
                    echo implode(",\n", $values).";\n\n";
                    $this->flush();

                    $offset += $batchSize;
                } while (count($rows) === $batchSize);
            }

            $this->out('SET FOREIGN_KEY_CHECKS=1;');
            $this->flush();
        }, $filename, [
            'Content-Type' => 'application/octet-stream',
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }

    private function out(string $line): void
    {
        echo $line."\n";
    }

    private function flush(): void
    {
        if (ob_get_level() > 0) {
            ob_flush();
        }

        flush();
    }
}

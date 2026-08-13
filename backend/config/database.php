<?php

declare(strict_types=1);

function getDatabaseConnection(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $dbname = getenv('DB_NAME') ?: 'u723435472_shivaymobile';
    $username = getenv('DB_USER') ?: 'u723435472_shivaymobile';
    $password = getenv('DB_PASSWORD') ?: 'ShivayMob12@123';
    $charset = 'utf8mb4';

    $localConfig = __DIR__ . '/local.php';
    if (file_exists($localConfig)) {
        $local = require $localConfig;
        $host = $local['DB_HOST'] ?? $local['host'] ?? $host;
        $dbname = $local['DB_NAME'] ?? $local['dbname'] ?? $dbname;
        $username = $local['DB_USER'] ?? $local['username'] ?? $username;
        $password = $local['DB_PASSWORD'] ?? $local['password'] ?? $password;
    }

    $dsn = "mysql:host={$host};dbname={$dbname};charset={$charset}";

    try {
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        error_log('[Shivay Mobile] Database connection failed: ' . $e->getMessage());
        throw $e;
    }

    return $pdo;
}

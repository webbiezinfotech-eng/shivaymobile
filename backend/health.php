<?php

declare(strict_types=1);

require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';

setupApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed.', [], 405);
}

try {
    $pdo = getDatabaseConnection();
    $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();

    successResponse('Server OK.', [
        'database' => 'connected',
        'users_count' => $count,
        'php_version' => PHP_VERSION,
    ]);
} catch (Throwable $e) {
    errorResponse('Database connection failed.', [
        'detail' => $e->getMessage(),
    ], 500);
}

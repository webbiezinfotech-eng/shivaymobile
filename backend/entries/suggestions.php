<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/security.php';
require_once __DIR__ . '/../middleware/auth.php';

setupApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed.', [], 405);
}

requireAuth();

$query = trim((string) ($_GET['q'] ?? ''));
$like = $query !== '' ? '%' . $query . '%' : null;

try {
    $pdo = getDatabaseConnection();

    $customerSql = 'SELECT DISTINCT TRIM(customer_name) AS name
                    FROM entries
                    WHERE TRIM(customer_name) <> \'\'';
    $sourceSql = 'SELECT DISTINCT TRIM(source_shop) AS name
                  FROM entries
                  WHERE TRIM(source_shop) <> \'\'';

    $customerParams = [];
    $sourceParams = [];

    if ($like !== null) {
        $customerSql .= ' AND TRIM(customer_name) LIKE :q';
        $sourceSql .= ' AND TRIM(source_shop) LIKE :q';
        $customerParams['q'] = $like;
        $sourceParams['q'] = $like;
    }

    $customerSql .= ' ORDER BY name ASC LIMIT 200';
    $sourceSql .= ' ORDER BY name ASC LIMIT 200';

    $customerStmt = $pdo->prepare($customerSql);
    $customerStmt->execute($customerParams);
    $customers = array_values(array_filter(array_map(
        static fn(array $row): string => (string) ($row['name'] ?? ''),
        $customerStmt->fetchAll()
    )));

    $sourceStmt = $pdo->prepare($sourceSql);
    $sourceStmt->execute($sourceParams);
    $sources = array_values(array_filter(array_map(
        static fn(array $row): string => (string) ($row['name'] ?? ''),
        $sourceStmt->fetchAll()
    )));

    successResponse('Suggestions retrieved.', [
        'customers' => $customers,
        'sources' => $sources,
    ]);
} catch (Throwable $e) {
    error_log('[Shivay Mobile] suggestions.php: ' . $e->getMessage());
    errorResponse('Unable to load suggestions.', [], 500);
}

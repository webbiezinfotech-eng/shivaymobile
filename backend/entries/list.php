<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/security.php';
require_once __DIR__ . '/../helpers/entry_formatter.php';
require_once __DIR__ . '/../middleware/auth.php';

setupApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed.', [], 405);
}

$user = requireAuth();

$dateFrom = trim((string) ($_GET['from_date'] ?? $_GET['date_from'] ?? ''));
$dateTo = trim((string) ($_GET['to_date'] ?? $_GET['date_to'] ?? ''));
$search = trim((string) ($_GET['search'] ?? ''));
$status = trim((string) ($_GET['status'] ?? ''));
$page = max(1, (int) ($_GET['page'] ?? 1));
$limit = min(100, max(1, (int) ($_GET['limit'] ?? 50)));
$offset = ($page - 1) * $limit;

$conditions = [];
$params = [];

if ($user['role'] === 'sameer') {
    $conditions[] = 'e.created_by = :created_by';
    $params['created_by'] = $user['id'];
}

if ($dateFrom !== '') {
    $conditions[] = 'e.entry_date >= :date_from';
    $params['date_from'] = $dateFrom;
}

if ($dateTo !== '') {
    $conditions[] = 'e.entry_date <= :date_to';
    $params['date_to'] = $dateTo;
}

if ($status !== '' && in_array($status, ['pending', 'settled'], true)) {
    $conditions[] = 'e.settlement_status = :status';
    $params['status'] = $status;
}

if ($search !== '') {
    $conditions[] = '(
        e.item_name LIKE :search_item
        OR e.customer_name LIKE :search_customer
        OR e.source_shop LIKE :search_source
        OR CAST(e.customer_amount AS CHAR) LIKE :search_amount
        OR CAST(e.purchase_cost AS CHAR) LIKE :search_cost
        OR CAST(e.profit AS CHAR) LIKE :search_profit
    )';
    $searchTerm = '%' . $search . '%';
    $params['search_item'] = $searchTerm;
    $params['search_customer'] = $searchTerm;
    $params['search_source'] = $searchTerm;
    $params['search_amount'] = $searchTerm;
    $params['search_cost'] = $searchTerm;
    $params['search_profit'] = $searchTerm;
}

$where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

try {
    $pdo = getDatabaseConnection();

    $countSql = "SELECT COUNT(*) AS total FROM entries e {$where}";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int) $countStmt->fetch()['total'];

    $sql = "SELECT e.*, u.name AS created_by_name, su.name AS settled_by_name
            FROM entries e
            JOIN users u ON u.id = e.created_by
            LEFT JOIN users su ON su.id = e.settled_by
            {$where}
            ORDER BY e.entry_date DESC, e.id DESC
            LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $entries = array_map(static fn(array $row): array => formatEntryResponse($row), $stmt->fetchAll());

    successResponse('Entries retrieved.', [
        'entries' => $entries,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => (int) ceil($total / $limit),
        ],
    ]);
} catch (Throwable $e) {
    logError('List entries error: ' . $e->getMessage());
    errorResponse('Unable to connect to server.', [], 500);
}

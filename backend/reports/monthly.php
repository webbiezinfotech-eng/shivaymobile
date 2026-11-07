<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/security.php';
require_once __DIR__ . '/../helpers/entry_formatter.php';
require_once __DIR__ . '/../middleware/role.php';

setupApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed.', [], 405);
}

requireOwner();

$fromDate = trim((string) ($_GET['from_date'] ?? ''));
$toDate = trim((string) ($_GET['to_date'] ?? ''));
$status = trim((string) ($_GET['status'] ?? ''));
$search = trim((string) ($_GET['search'] ?? ''));
$searchType = trim((string) ($_GET['search_type'] ?? 'all'));
if (!in_array($searchType, ['all', 'customer', 'source', 'item'], true)) {
    $searchType = 'all';
}

$allTime = filter_var((string) ($_GET['all_time'] ?? '0'), FILTER_VALIDATE_BOOLEAN);

$year = (int) ($_GET['year'] ?? (int) date('Y'));
$month = (int) ($_GET['month'] ?? (int) date('n'));

$hasRange = $fromDate !== '' && $toDate !== '';

if ($allTime) {
    // "All Time" — poore history par search (purani pending entries bhi mile).
    $rangeStart = '';
    $rangeEnd = '';
    $periodLabel = 'ALL TIME';
} elseif ($hasRange) {
    $rangeStart = $fromDate;
    $rangeEnd = $toDate;
    $periodLabel = strtoupper(date('d M Y', strtotime($fromDate)) . ' - ' . date('d M Y', strtotime($toDate)));
} else {
    if ($month < 1 || $month > 12) {
        errorResponse('Invalid month.', [], 400);
    }
    $rangeStart = sprintf('%04d-%02d-01', $year, $month);
    $rangeEnd = date('Y-m-t', strtotime($rangeStart));
    $periodLabel = strtoupper(date('F Y', strtotime($rangeStart)));
}

$conditions = [];
$baseParams = [];

if (!$allTime) {
    $conditions[] = 'e.entry_date >= :range_start';
    $conditions[] = 'e.entry_date <= :range_end';
    $baseParams['range_start'] = $rangeStart;
    $baseParams['range_end'] = $rangeEnd;
}

if ($status !== '' && in_array($status, ['pending', 'settled'], true)) {
    $conditions[] = 'e.settlement_status = :status';
    $baseParams['status'] = $status;
}

if ($search !== '') {
    $searchTerm = '%' . $search . '%';

    // Staff/user ke naam se bhi match — pending list me jo naam dikh raha hai
    // wahi naam report search me bhi hit hona chahiye.
    $userMatch = 'e.created_by IN (SELECT u2.id FROM users u2 WHERE LOWER(TRIM(u2.name)) LIKE LOWER(:search_user))';

    if ($searchType === 'customer') {
        $conditions[] = '(LOWER(TRIM(e.customer_name)) LIKE LOWER(:search_customer) OR ' . $userMatch . ')';
        $baseParams['search_customer'] = $searchTerm;
        $baseParams['search_user'] = $searchTerm;
        $periodLabel .= ' · CUSTOMER: ' . strtoupper($search);
    } elseif ($searchType === 'source') {
        $conditions[] = 'LOWER(TRIM(e.source_shop)) LIKE LOWER(:search_source)';
        $baseParams['search_source'] = $searchTerm;
        $periodLabel .= ' · SOURCE: ' . strtoupper($search);
    } elseif ($searchType === 'item') {
        $conditions[] = 'LOWER(TRIM(e.item_name)) LIKE LOWER(:search_item)';
        $baseParams['search_item'] = $searchTerm;
        $periodLabel .= ' · ITEM: ' . strtoupper($search);
    } else {
        $conditions[] = '(
            LOWER(TRIM(e.customer_name)) LIKE LOWER(:search_customer)
            OR LOWER(TRIM(e.source_shop)) LIKE LOWER(:search_source)
            OR LOWER(TRIM(e.item_name)) LIKE LOWER(:search_item)
            OR ' . $userMatch . '
        )';
        $baseParams['search_customer'] = $searchTerm;
        $baseParams['search_source'] = $searchTerm;
        $baseParams['search_item'] = $searchTerm;
        $baseParams['search_user'] = $searchTerm;
        $periodLabel .= ' · ' . strtoupper($search);
    }
}

$where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
$summaryParams = array_merge($baseParams, [
    'settled' => 'settled',
    'pending' => 'pending',
]);

try {
    $pdo = getDatabaseConnection();

    $stmt = $pdo->prepare(
        "SELECT
            COUNT(*) AS total_entries,
            COALESCE(SUM(e.customer_amount), 0) AS total_customer_amount,
            COALESCE(SUM(e.purchase_cost), 0) AS total_purchase_cost,
            COALESCE(SUM(e.profit), 0) AS total_profit,
            COALESCE(SUM(CASE WHEN e.settlement_status = :settled THEN e.customer_amount ELSE 0 END), 0) AS settled_amount,
            COALESCE(SUM(CASE WHEN e.settlement_status = :pending THEN e.customer_amount ELSE 0 END), 0) AS pending_amount
         FROM entries e
         {$where}"
    );
    $stmt->execute($summaryParams);
    $summary = $stmt->fetch();

    $entriesStmt = $pdo->prepare(
        "SELECT e.*, u.name AS created_by_name, su.name AS settled_by_name
         FROM entries e
         JOIN users u ON u.id = e.created_by
         LEFT JOIN users su ON su.id = e.settled_by
         {$where}
         ORDER BY e.entry_date DESC, e.id DESC"
    );
    $entriesStmt->execute($baseParams);
    $entries = array_map(static fn(array $row): array => formatEntryResponse($row), $entriesStmt->fetchAll());

    successResponse('Report retrieved.', [
        'year' => $year,
        'month' => $month,
        'from_date' => $rangeStart,
        'to_date' => $rangeEnd,
        'all_time' => $allTime,
        'status' => $status !== '' ? $status : 'all',
        'search' => $search,
        'search_type' => $searchType !== '' ? $searchType : 'all',
        'month_label' => $periodLabel,
        'total_entries' => (int) $summary['total_entries'],
        'total_customer_amount' => (float) $summary['total_customer_amount'],
        'total_purchase_cost' => (float) $summary['total_purchase_cost'],
        'total_profit' => (float) $summary['total_profit'],
        'settled_amount' => (float) $summary['settled_amount'],
        'pending_amount' => (float) $summary['pending_amount'],
        'entries' => $entries,
    ]);
} catch (Throwable $e) {
    logError('Monthly report error: ' . $e->getMessage());
    errorResponse('Unable to connect to server.', [], 500);
}

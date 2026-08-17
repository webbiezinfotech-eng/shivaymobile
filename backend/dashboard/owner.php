<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/security.php';
require_once __DIR__ . '/../middleware/role.php';

setupApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed.', [], 405);
}

requireOwner();
$today = date('Y-m-d');
$monthStart = date('Y-m-01');
$monthEnd = date('Y-m-t');

try {
    $pdo = getDatabaseConnection();

    $todayStatsStmt = $pdo->prepare(
        'SELECT
            COUNT(*) AS entry_count,
            COALESCE(SUM(customer_amount), 0) AS customer_amount,
            COALESCE(SUM(purchase_cost), 0) AS purchase_cost,
            COALESCE(SUM(profit), 0) AS profit,
            COALESCE(SUM(CASE WHEN settlement_status = :settled THEN customer_amount ELSE 0 END), 0) AS settled_amount,
            COALESCE(SUM(CASE WHEN settlement_status = :pending THEN customer_amount ELSE 0 END), 0) AS pending_amount
         FROM entries
         WHERE entry_date = :today'
    );
    $todayStatsStmt->execute([
        'settled' => 'settled',
        'pending' => 'pending',
        'today' => $today,
    ]);
    $todayStats = $todayStatsStmt->fetch();

    $monthStmt = $pdo->prepare(
        'SELECT
            COUNT(*) AS total_entries,
            COALESCE(SUM(customer_amount), 0) AS total_customer_amount,
            COALESCE(SUM(purchase_cost), 0) AS total_purchase_cost,
            COALESCE(SUM(profit), 0) AS total_profit,
            COALESCE(SUM(CASE WHEN settlement_status = :settled THEN customer_amount ELSE 0 END), 0) AS settled_amount,
            COALESCE(SUM(CASE WHEN settlement_status = :pending THEN customer_amount ELSE 0 END), 0) AS pending_amount
         FROM entries
         WHERE entry_date >= :month_start AND entry_date <= :month_end'
    );
    $monthStmt->execute([
        'settled' => 'settled',
        'pending' => 'pending',
        'month_start' => $monthStart,
        'month_end' => $monthEnd,
    ]);
    $monthSummary = $monthStmt->fetch();

    $totalPendingStmt = $pdo->query(
        "SELECT COALESCE(SUM(customer_amount), 0) AS pending_amount
         FROM entries
         WHERE settlement_status = 'pending'"
    );
    $totalPendingSettlement = (float) $totalPendingStmt->fetch()['pending_amount'];

    $recentStmt = $pdo->prepare(
        'SELECT e.*, u.name AS created_by_name, su.name AS settled_by_name
         FROM entries e
         JOIN users u ON u.id = e.created_by
         LEFT JOIN users su ON su.id = e.settled_by
         WHERE e.entry_date = :today
         ORDER BY e.id DESC
         LIMIT 50'
    );
    $recentStmt->execute(['today' => $today]);
    $recent = array_map(static function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'entry_date' => $row['entry_date'],
            'item_name' => $row['item_name'],
            'customer_name' => $row['customer_name'],
            'customer_amount' => (float) $row['customer_amount'],
            'purchase_cost' => (float) $row['purchase_cost'],
            'source_shop' => $row['source_shop'],
            'profit' => (float) $row['profit'],
            'settlement_status' => $row['settlement_status'],
        ];
    }, $recentStmt->fetchAll());

    successResponse('Dashboard data retrieved.', [
        'today' => [
            'entry_count' => (int) $todayStats['entry_count'],
            'customer_amount' => (float) $todayStats['customer_amount'],
            'purchase_cost' => (float) $todayStats['purchase_cost'],
            'profit' => (float) $todayStats['profit'],
            'settled_amount' => (float) $todayStats['settled_amount'],
            'pending_amount' => (float) $todayStats['pending_amount'],
        ],
        'monthly_summary' => [
            'month_label' => strtoupper(date('F Y')),
            'total_entries' => (int) $monthSummary['total_entries'],
            'total_customer_amount' => (float) $monthSummary['total_customer_amount'],
            'total_purchase_cost' => (float) $monthSummary['total_purchase_cost'],
            'total_profit' => (float) $monthSummary['total_profit'],
            'settled_amount' => (float) $monthSummary['settled_amount'],
            'pending_amount' => (float) $monthSummary['pending_amount'],
        ],
        'pending_settlement_total' => $totalPendingSettlement,
        'recent_entries' => $recent,
    ]);
} catch (Throwable $e) {
    logError('Owner dashboard error: ' . $e->getMessage());
    errorResponse('Unable to connect to server.', [], 500);
}

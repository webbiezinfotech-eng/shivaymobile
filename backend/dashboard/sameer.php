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

$user = requireSameer();
$today = date('Y-m-d');
$monthStart = date('Y-m-01');

try {
    $pdo = getDatabaseConnection();

    $todayStmt = $pdo->prepare(
        'SELECT COUNT(*) AS count
         FROM entries
         WHERE created_by = :user_id AND entry_date = :today'
    );
    $todayStmt->execute(['user_id' => $user['id'], 'today' => $today]);
    $todayCount = (int) $todayStmt->fetch()['count'];

    $monthStmt = $pdo->prepare(
        'SELECT COUNT(*) AS count
         FROM entries
         WHERE created_by = :user_id AND entry_date >= :month_start'
    );
    $monthStmt->execute(['user_id' => $user['id'], 'month_start' => $monthStart]);
    $monthCount = (int) $monthStmt->fetch()['count'];

    $pendingStmt = $pdo->prepare(
        'SELECT COUNT(*) AS count
         FROM entries
         WHERE created_by = :user_id AND settlement_status = :status'
    );
    $pendingStmt->execute(['user_id' => $user['id'], 'status' => 'pending']);
    $pendingCount = (int) $pendingStmt->fetch()['count'];

    // Staff aur owner shared ledger dekhte hain — dashboard par bhi saari aaj ki entries
    $recentStmt = $pdo->prepare(
        'SELECT e.*, u.name AS created_by_name
         FROM entries e
         JOIN users u ON u.id = e.created_by
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
            'settlement_status' => $row['settlement_status'],
        ];
    }, $recentStmt->fetchAll());

    successResponse('Dashboard data retrieved.', [
        'today_entry_count' => $todayCount,
        'month_entry_count' => $monthCount,
        'pending_entry_count' => $pendingCount,
        'recent_entries' => $recent,
    ]);
} catch (Throwable $e) {
    logError('Sameer dashboard error: ' . $e->getMessage());
    errorResponse('Unable to connect to server.', [], 500);
}

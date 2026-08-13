<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/security.php';
require_once __DIR__ . '/../helpers/entry_formatter.php';
require_once __DIR__ . '/../middleware/role.php';

setupApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed.', [], 405);
}

$user = requireOwner();
$data = getJsonInput();
$entryId = (int) ($data['entry_id'] ?? 0);

if ($entryId <= 0) {
    errorResponse('Entry ID is required.', [], 400);
}

try {
    $pdo = getDatabaseConnection();
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT * FROM entries WHERE id = :id FOR UPDATE');
    $stmt->execute(['id' => $entryId]);
    $entry = $stmt->fetch();

    if (!$entry) {
        $pdo->rollBack();
        errorResponse('Entry not found.', [], 404);
    }

    if ($entry['settlement_status'] === 'settled') {
        $pdo->rollBack();
        errorResponse('Entry is already settled.', [], 400);
    }

    $updateStmt = $pdo->prepare(
        'UPDATE entries
         SET settlement_status = :status,
             settled_at = NOW(),
             settled_by = :settled_by
         WHERE id = :id'
    );
    $updateStmt->execute([
        'status' => 'settled',
        'settled_by' => $user['id'],
        'id' => $entryId,
    ]);

    $pdo->commit();

    $detailStmt = $pdo->prepare(
        'SELECT e.*, u.name AS created_by_name, su.name AS settled_by_name
         FROM entries e
         JOIN users u ON u.id = e.created_by
         LEFT JOIN users su ON su.id = e.settled_by
         WHERE e.id = :id'
    );
    $detailStmt->execute(['id' => $entryId]);
    $updated = $detailStmt->fetch();

    successResponse('Entry marked as settled.', formatEntryResponse($updated));
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    logError('Settle entry error: ' . $e->getMessage());
    errorResponse('Unable to connect to server.', [], 500);
}

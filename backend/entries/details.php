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
$entryId = (int) ($_GET['id'] ?? 0);

if ($entryId <= 0) {
    errorResponse('Entry ID is required.', [], 400);
}

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare(
        'SELECT e.*, u.name AS created_by_name, su.name AS settled_by_name
         FROM entries e
         JOIN users u ON u.id = e.created_by
         LEFT JOIN users su ON su.id = e.settled_by
         WHERE e.id = :id'
    );
    $stmt->execute(['id' => $entryId]);
    $entry = $stmt->fetch();

    if (!$entry) {
        errorResponse('Entry not found.', [], 404);
    }

    // Staff aur owner dono shared ledger dekhte hain — kisi bhi entry ka detail khul sakta hai.

    successResponse('Entry retrieved.', formatEntryResponse($entry));
} catch (Throwable $e) {
    logError('Entry details error: ' . $e->getMessage());
    errorResponse('Unable to connect to server.', [], 500);
}

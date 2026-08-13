<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/security.php';
require_once __DIR__ . '/../middleware/role.php';

setupApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed.', [], 405);
}

requireOwner();
$data = getJsonInput();

$entryId = (int) ($data['entry_id'] ?? 0);
if ($entryId <= 0) {
    errorResponse('Entry ID is required.', [], 400);
}

try {
    $pdo = getDatabaseConnection();

    $check = $pdo->prepare('SELECT id FROM entries WHERE id = :id LIMIT 1');
    $check->execute(['id' => $entryId]);
    if (!$check->fetch()) {
        errorResponse('Entry not found.', [], 404);
    }

    $delete = $pdo->prepare('DELETE FROM entries WHERE id = :id');
    $delete->execute(['id' => $entryId]);

    successResponse('Entry deleted successfully.');
} catch (Throwable $e) {
    logError('Delete entry error: ' . $e->getMessage());
    errorResponse('Unable to delete entry. Please try again.', [], 500);
}

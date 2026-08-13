<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/validation.php';
require_once __DIR__ . '/../helpers/security.php';
require_once __DIR__ . '/../helpers/entry_formatter.php';
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

$errors = validateCreateEntry($data);
if (!empty($errors)) {
    errorResponse('Validation failed.', $errors, 400);
}

$itemName = sanitizeString((string) $data['item_name']);
$customerName = sanitizeString((string) $data['customer_name']);
$sourceShop = sanitizeString((string) $data['source_shop']);
$entryDate = (string) $data['entry_date'];
$customerAmount = round((float) $data['customer_amount'], 2);

$costItems = normalizeCostItems($data['cost_items'] ?? []);
$costBreakdownJson = null;

if (!empty($costItems)) {
    $purchaseCost = round(array_sum(array_column($costItems, 'cost')), 2);
    $costBreakdownJson = json_encode($costItems, JSON_UNESCAPED_UNICODE);
} else {
    $purchaseCost = round((float) $data['purchase_cost'], 2);
}

$profit = round($customerAmount - $purchaseCost, 2);

try {
    $pdo = getDatabaseConnection();

    $check = $pdo->prepare('SELECT id FROM entries WHERE id = :id LIMIT 1');
    $check->execute(['id' => $entryId]);
    if (!$check->fetch()) {
        errorResponse('Entry not found.', [], 404);
    }

    $stmt = $pdo->prepare(
        'UPDATE entries SET
            entry_date = :entry_date,
            item_name = :item_name,
            customer_name = :customer_name,
            customer_amount = :customer_amount,
            purchase_cost = :purchase_cost,
            source_shop = :source_shop,
            profit = :profit,
            cost_breakdown = :cost_breakdown
         WHERE id = :id'
    );

    $stmt->execute([
        'entry_date' => $entryDate,
        'item_name' => $itemName,
        'customer_name' => $customerName,
        'customer_amount' => $customerAmount,
        'purchase_cost' => $purchaseCost,
        'source_shop' => $sourceShop,
        'profit' => $profit,
        'cost_breakdown' => $costBreakdownJson,
        'id' => $entryId,
    ]);

    $detailStmt = $pdo->prepare(
        'SELECT e.*, u.name AS created_by_name, su.name AS settled_by_name
         FROM entries e
         JOIN users u ON u.id = e.created_by
         LEFT JOIN users su ON su.id = e.settled_by
         WHERE e.id = :id'
    );
    $detailStmt->execute(['id' => $entryId]);
    $entry = $detailStmt->fetch();

    successResponse('Entry updated successfully.', formatEntryResponse($entry));
} catch (Throwable $e) {
    logError('Update entry error: ' . $e->getMessage());
    errorResponse('Unable to update entry. Please try again.', [], 500);
}

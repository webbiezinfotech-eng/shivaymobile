<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/validation.php';
require_once __DIR__ . '/../helpers/security.php';
require_once __DIR__ . '/../middleware/auth.php';

setupApiHeaders();

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDatabaseConnection();

    if ($method === 'GET') {
        $customerStmt = $pdo->query(
            "SELECT name FROM saved_names WHERE name_type = 'customer' ORDER BY name ASC"
        );
        $sourceStmt = $pdo->query(
            "SELECT name FROM saved_names WHERE name_type = 'source' ORDER BY name ASC"
        );

        $customers = array_values(array_filter(array_map(
            static fn(array $row): string => (string) ($row['name'] ?? ''),
            $customerStmt->fetchAll()
        )));

        $sources = array_values(array_filter(array_map(
            static fn(array $row): string => (string) ($row['name'] ?? ''),
            $sourceStmt->fetchAll()
        )));

        successResponse('Saved names retrieved.', [
            'customers' => $customers,
            'sources' => $sources,
        ]);
    }

    if ($method === 'POST') {
        $data = getJsonInput();
        $nameType = trim((string) ($data['name_type'] ?? ''));
        $name = sanitizeString((string) ($data['name'] ?? ''));

        if (!in_array($nameType, ['customer', 'source'], true)) {
            errorResponse('Invalid name type.', ['name_type' => 'Must be customer or source.'], 400);
        }

        if ($name === '') {
            errorResponse('Name is required.', ['name' => 'Name cannot be empty.'], 400);
        }

        if (mb_strlen($name) > 255) {
            errorResponse('Name is too long.', ['name' => 'Maximum 255 characters allowed.'], 400);
        }

        $nameKey = mb_strtolower($name);

        $existingStmt = $pdo->prepare(
            'SELECT id, name FROM saved_names WHERE name_type = :name_type AND name_key = :name_key LIMIT 1'
        );
        $existingStmt->execute([
            'name_type' => $nameType,
            'name_key' => $nameKey,
        ]);
        $existing = $existingStmt->fetch();

        if ($existing) {
            successResponse('Name already saved.', [
                'name' => (string) $existing['name'],
                'name_type' => $nameType,
            ]);
        }

        $insertStmt = $pdo->prepare(
            'INSERT INTO saved_names (name_type, name, name_key, created_by)
             VALUES (:name_type, :name, :name_key, :created_by)'
        );
        $insertStmt->execute([
            'name_type' => $nameType,
            'name' => $name,
            'name_key' => $nameKey,
            'created_by' => (int) $user['id'],
        ]);

        successResponse('Name saved.', [
            'name' => $name,
            'name_type' => $nameType,
        ], 201);
    }

    errorResponse('Method not allowed.', [], 405);
} catch (PDOException $e) {
    if ((int) ($e->errorInfo[1] ?? 0) === 1062) {
        errorResponse('Name already saved.', [], 409);
    }

    error_log('[Shivay Mobile] saved-names.php: ' . $e->getMessage());
    errorResponse('Unable to save name.', [], 500);
} catch (Throwable $e) {
    error_log('[Shivay Mobile] saved-names.php: ' . $e->getMessage());
    errorResponse('Unable to process saved names.', [], 500);
}

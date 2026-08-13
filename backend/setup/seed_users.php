<?php

declare(strict_types=1);

/**
 * Run ONCE on server after uploading backend, then DELETE this file.
 * URL: https://shivaymob.webbiezinfotech.in/backend/setup/seed_users.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = getDatabaseConnection();

    $users = [
        [
            'name' => 'Shivay Mobile Owner',
            'username' => 'owner',
            'password' => 'owner123',
            'role' => 'owner',
        ],
        [
            'name' => 'Sameer',
            'username' => 'sameer',
            'password' => 'sameer123',
            'role' => 'sameer',
        ],
    ];

    $stmt = $pdo->prepare(
        'INSERT INTO users (name, username, password_hash, role, is_active)
         VALUES (:name, :username, :password_hash, :role, 1)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           password_hash = VALUES(password_hash),
           role = VALUES(role),
           is_active = 1'
    );

    foreach ($users as $user) {
        $stmt->execute([
            'name' => $user['name'],
            'username' => $user['username'],
            'password_hash' => password_hash($user['password'], PASSWORD_DEFAULT),
            'role' => $user['role'],
        ]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Users seeded. Delete this file now. Login: owner/owner123, sameer/sameer123',
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Seed failed.',
        'error' => $e->getMessage(),
    ]);
}

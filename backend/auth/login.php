<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/security.php';
require_once __DIR__ . '/../middleware/auth.php';

setupApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed.', [], 405);
}

$data = getJsonInput();
$username = trim((string) ($data['username'] ?? ''));
$password = (string) ($data['password'] ?? '');

if ($username === '' || $password === '') {
    errorResponse('Invalid username or password.', [], 401);
}

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare(
        'SELECT id, name, username, password_hash, role, is_active
         FROM users
         WHERE username = :username
         LIMIT 1'
    );
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();

    if (!$user || !(int) $user['is_active'] || !password_verify($password, $user['password_hash'])) {
        errorResponse('Invalid username or password.', [], 401);
    }

    regenerateSessionId();
    setAuthenticatedUser($user);

    successResponse('Login successful.', [
        'user' => [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'role' => $user['role'],
        ],
    ]);
} catch (Throwable $e) {
    logError('Login error: ' . $e->getMessage());
    errorResponse('Unable to connect to server.', [], 500);
}

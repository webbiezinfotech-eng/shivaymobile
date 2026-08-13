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

$user = requireOwner();
$data = getJsonInput();

$currentPassword = (string) ($data['current_password'] ?? '');
$newPassword = (string) ($data['new_password'] ?? '');
$confirmPassword = (string) ($data['confirm_password'] ?? '');

$errors = [];

if ($currentPassword === '') {
    $errors['current_password'] = 'Current password is required.';
}
if ($newPassword === '') {
    $errors['new_password'] = 'New password is required.';
} elseif (strlen($newPassword) < 6) {
    $errors['new_password'] = 'New password must be at least 6 characters.';
}
if ($confirmPassword === '') {
    $errors['confirm_password'] = 'Please confirm new password.';
} elseif ($newPassword !== $confirmPassword) {
    $errors['confirm_password'] = 'Passwords do not match.';
}

if ($currentPassword !== '' && $newPassword !== '' && $currentPassword === $newPassword) {
    $errors['new_password'] = 'New password must be different from current password.';
}

if (!empty($errors)) {
    errorResponse('Validation failed.', $errors, 400);
}

try {
    $pdo = getDatabaseConnection();

    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $user['id']]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
        errorResponse('Current password is incorrect.', ['current_password' => 'Current password is incorrect.'], 400);
    }

    $update = $pdo->prepare(
        'UPDATE users SET password_hash = :password_hash WHERE id = :id'
    );
    $update->execute([
        'password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        'id' => $user['id'],
    ]);

    successResponse('Password changed successfully.');
} catch (Throwable $e) {
    logError('Change password error: ' . $e->getMessage());
    errorResponse('Unable to change password. Please try again.', [], 500);
}

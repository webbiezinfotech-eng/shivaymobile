<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';

function requireAuth(): array
{
    if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
        errorResponse('Authentication required.', [], 401);
    }

    return getCurrentUser();
}

function getCurrentUser(): ?array
{
    if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
        return null;
    }

    return [
        'id' => (int) $_SESSION['user_id'],
        'name' => (string) ($_SESSION['name'] ?? ''),
        'role' => (string) $_SESSION['role'],
    ];
}

function setAuthenticatedUser(array $user): void
{
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['role'] = (string) $user['role'];
    $_SESSION['name'] = (string) $user['name'];
}

function clearAuthenticatedUser(): void
{
    unset($_SESSION['user_id'], $_SESSION['role'], $_SESSION['name'], $_SESSION['csrf_token']);
}

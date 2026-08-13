<?php

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

function requireRole(string $role): array
{
    $user = requireAuth();

    if ($user['role'] !== $role) {
        errorResponse('You do not have permission to perform this action.', [], 403);
    }

    return $user;
}

function requireOwner(): array
{
    return requireRole('owner');
}

function requireSameer(): array
{
    return requireRole('sameer');
}

function requireEntryCreator(): array
{
    $user = requireAuth();

    if (!in_array($user['role'], ['sameer', 'owner'], true)) {
        errorResponse('You do not have permission to perform this action.', [], 403);
    }

    return $user;
}

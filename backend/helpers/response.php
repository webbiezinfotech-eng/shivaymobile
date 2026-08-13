<?php

declare(strict_types=1);

function jsonResponse(bool $success, string $message, mixed $data = null, array $errors = [], int $statusCode = 200): void
{
    http_response_code($statusCode);

    $payload = [
        'success' => $success,
        'message' => $message,
    ];

    if ($data !== null) {
        $payload['data'] = $data;
    }

    if (!empty($errors)) {
        $payload['errors'] = $errors;
    }

    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function successResponse(string $message, mixed $data = null, int $statusCode = 200): void
{
    jsonResponse(true, $message, $data, [], $statusCode);
}

function errorResponse(string $message, array $errors = [], int $statusCode = 400): void
{
    jsonResponse(false, $message, null, $errors, $statusCode);
}

function getJsonInput(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function setupApiHeaders(): void
{
    $config = require __DIR__ . '/../config/config.php';
    $origin = $config['cors_origin'];

    header('Content-Type: application/json; charset=utf-8');

    if (!empty($origin)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

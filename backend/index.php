<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'success' => true,
    'message' => 'Shivay Mobile API',
    'data' => [
        'version' => '1.0.0',
    ],
], JSON_UNESCAPED_UNICODE);

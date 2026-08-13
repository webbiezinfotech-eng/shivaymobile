<?php

declare(strict_types=1);

return [
    'app_name' => 'Shivay Mobile',
    'timezone' => 'Asia/Kolkata',
    'debug' => filter_var(getenv('APP_DEBUG') ?: 'true', FILTER_VALIDATE_BOOLEAN),
    'cors_origin' => getenv('CORS_ORIGIN') ?: '',
    'session_lifetime' => (int) (getenv('SESSION_LIFETIME') ?: 60 * 60 * 24 * 30),
];

<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

$config = require __DIR__ . '/config.php';

date_default_timezone_set($config['timezone']);

$sessionLifetime = (int) ($config['session_lifetime'] ?? (60 * 60 * 24 * 30));
ini_set('session.gc_maxlifetime', (string) $sessionLifetime);

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => $sessionLifetime,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
    ]);
    session_start();
}

function regenerateSessionId(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_regenerate_id(true);
    }
}

function destroySession(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'] ?? '',
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();
}

<?php

declare(strict_types=1);

http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => false, 'message' => 'Not found.'], JSON_UNESCAPED_UNICODE);

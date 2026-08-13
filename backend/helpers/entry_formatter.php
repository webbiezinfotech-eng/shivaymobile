<?php

declare(strict_types=1);

require_once __DIR__ . '/validation.php';

function parseCostBreakdown(?string $json): array
{
    if ($json === null || $json === '') {
        return [];
    }

    $decoded = json_decode($json, true);
    if (!is_array($decoded)) {
        return [];
    }

    $items = [];
    foreach ($decoded as $row) {
        if (!is_array($row)) {
            continue;
        }
        $items[] = [
            'name' => sanitizeString((string) ($row['name'] ?? '')),
            'cost' => round((float) ($row['cost'] ?? 0), 2),
        ];
    }

    return $items;
}

function normalizeCostItems(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }

    $normalized = [];
    foreach ($items as $row) {
        if (!is_array($row)) {
            continue;
        }
        $cost = round((float) ($row['cost'] ?? 0), 2);
        if ($cost <= 0) {
            continue;
        }
        $normalized[] = [
            'name' => sanitizeString((string) ($row['name'] ?? '')),
            'cost' => $cost,
        ];
    }

    return $normalized;
}

function formatEntryResponse(array $entry): array
{
    $costBreakdown = parseCostBreakdown($entry['cost_breakdown'] ?? null);

    return [
        'id' => (int) $entry['id'],
        'entry_date' => $entry['entry_date'],
        'item_name' => $entry['item_name'],
        'customer_name' => $entry['customer_name'],
        'customer_amount' => (float) $entry['customer_amount'],
        'purchase_cost' => (float) $entry['purchase_cost'],
        'source_shop' => $entry['source_shop'],
        'profit' => (float) $entry['profit'],
        'cost_breakdown' => $costBreakdown,
        'created_by' => (int) $entry['created_by'],
        'created_by_name' => $entry['created_by_name'] ?? null,
        'settlement_status' => $entry['settlement_status'],
        'settled_at' => $entry['settled_at'],
        'settled_by' => !empty($entry['settled_by']) ? (int) $entry['settled_by'] : null,
        'settled_by_name' => $entry['settled_by_name'] ?? null,
        'created_at' => $entry['created_at'],
        'updated_at' => $entry['updated_at'],
    ];
}

<?php

declare(strict_types=1);

function validateRequired(array $data, array $fields): array
{
    $errors = [];

    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
            $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required.';
        }
    }

    return $errors;
}

function validateAmount(mixed $value, string $fieldName): ?string
{
    if (!is_numeric($value)) {
        return ucfirst(str_replace('_', ' ', $fieldName)) . ' must be a valid number.';
    }

    if ((float) $value < 0) {
        return ucfirst(str_replace('_', ' ', $fieldName)) . ' cannot be negative.';
    }

    return null;
}

function validateDate(string $date): ?string
{
    $dt = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dt || $dt->format('Y-m-d') !== $date) {
        return 'Date must be in YYYY-MM-DD format.';
    }

    return null;
}

function validateEntryDateNotFuture(string $date): ?string
{
    $today = date('Y-m-d');
    if ($date > $today) {
        return 'Future date entries are not allowed.';
    }

    return null;
}

function sanitizeString(string $value): string
{
    return trim(strip_tags($value));
}

function validateCreateEntry(array $data): array
{
    $errors = validateRequired($data, [
        'entry_date',
        'item_name',
        'customer_name',
        'customer_amount',
        'source_shop',
    ]);

    if (isset($data['entry_date'])) {
        $dateError = validateDate((string) $data['entry_date']);
        if ($dateError) {
            $errors['entry_date'] = $dateError;
        } else {
            $futureError = validateEntryDateNotFuture((string) $data['entry_date']);
            if ($futureError) {
                $errors['entry_date'] = $futureError;
            }
        }
    }

    if (isset($data['customer_amount'])) {
        $amountError = validateAmount($data['customer_amount'], 'customer_amount');
        if ($amountError) {
            $errors['customer_amount'] = $amountError;
        }
    }

    $costItems = [];
    if (isset($data['cost_items']) && is_array($data['cost_items'])) {
        foreach ($data['cost_items'] as $index => $row) {
            if (!is_array($row)) {
                continue;
            }
            if (!isset($row['cost']) || trim((string) $row['cost']) === '') {
                continue;
            }
            $costError = validateAmount($row['cost'], 'cost');
            if ($costError) {
                $errors["cost_items_{$index}"] = $costError;
            } else {
                $costItems[] = $row;
            }
        }
    }

    if (!empty($costItems)) {
        return $errors;
    }

    if (!isset($data['purchase_cost']) || trim((string) $data['purchase_cost']) === '') {
        $errors['purchase_cost'] = 'Purchase cost is required.';
    } else {
        $amountError = validateAmount($data['purchase_cost'], 'purchase_cost');
        if ($amountError) {
            $errors['purchase_cost'] = $amountError;
        }
    }

    return $errors;
}

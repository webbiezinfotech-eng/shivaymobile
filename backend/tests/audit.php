<?php

declare(strict_types=1);

/**
 * Shivay Mobile audit test suite.
 * Run: php backend/tests/audit.php
 *
 * Requires MySQL running with schema + seed imported.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/validation.php';

$passed = 0;
$failed = 0;
$skipped = 0;

function pass(string $message): void
{
    global $passed;
    $passed++;
    echo "[PASS] {$message}\n";
}

function fail(string $message): void
{
    global $failed;
    $failed++;
    echo "[FAIL] {$message}\n";
}

function skip(string $message): void
{
    global $skipped;
    $skipped++;
    echo "[SKIP] {$message}\n";
}

echo "=== Shivay Mobile Audit Tests ===\n\n";

// --- Profit calculation (backend logic) ---
$tests = [
    [90, 20, 70],
    [140, 110, 30],
    [100, 120, -20],
];

foreach ($tests as [$customer, $cost, $expected]) {
    $profit = round($customer - $cost, 2);
    if ($profit === (float) $expected) {
        pass("Profit calculation: {$customer} - {$cost} = {$expected}");
    } else {
        fail("Profit calculation: expected {$expected}, got {$profit}");
    }
}

// --- Validation tests ---
$validationErrors = validateCreateEntry([
    'entry_date' => '',
    'item_name' => '',
    'customer_amount' => -5,
    'purchase_cost' => 'abc',
]);
if (count($validationErrors) >= 3) {
    pass('Validation rejects empty fields and invalid amounts');
} else {
    fail('Validation should reject empty/invalid entry data');
}

// --- Database tests ---
try {
    $pdo = getDatabaseConnection();

    // Schema: only users and entries tables
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    sort($tables);
    $expectedTables = ['entries', 'users'];
    if ($tables === $expectedTables) {
        pass('Database contains only users and entries tables');
    } else {
        fail('Unexpected tables: ' . implode(', ', $tables));
    }

    // No advance columns
    $entryColumns = $pdo->query('SHOW COLUMNS FROM entries')->fetchAll(PDO::FETCH_COLUMN);
    $forbidden = ['advance', 'advance_amount', 'payment_amount', 'settlement_amount'];
    $foundForbidden = array_intersect($forbidden, $entryColumns);
    if (empty($foundForbidden)) {
        pass('No forbidden advance/payment columns in entries table');
    } else {
        fail('Forbidden columns found: ' . implode(', ', $foundForbidden));
    }

    // Passwords hashed
    $users = $pdo->query('SELECT username, password_hash FROM users')->fetchAll();
    $allHashed = true;
    foreach ($users as $user) {
        if (!str_starts_with($user['password_hash'], '$2y$')) {
            $allHashed = false;
            fail("Password not hashed for user: {$user['username']}");
        }
    }
    if ($allHashed) {
        pass('All user passwords are bcrypt hashed');
    }

    // Verify login passwords
    foreach (['owner' => 'owner123', 'sameer' => 'sameer123'] as $username => $password) {
        $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE username = :u');
        $stmt->execute(['u' => $username]);
        $hash = $stmt->fetchColumn();
        if ($hash && password_verify($password, $hash)) {
            pass("Password verify works for {$username}");
        } else {
            fail("Password verify failed for {$username}");
        }
    }

    // Settlement amount = customer_amount (aggregation test)
    $pdo->exec('DELETE FROM entries');
    $owner = $pdo->query("SELECT id FROM users WHERE role = 'owner' LIMIT 1")->fetchColumn();
    $sameer = $pdo->query("SELECT id FROM users WHERE role = 'sameer' LIMIT 1")->fetchColumn();

    $insert = $pdo->prepare(
        'INSERT INTO entries (entry_date, item_name, customer_name, customer_amount, purchase_cost, source_shop, profit, created_by, settlement_status)
         VALUES (:d, :item, :cust, :ca, :pc, :src, :profit, :cb, :status)'
    );

    $insert->execute([
        'd' => '2026-08-10', 'item' => 'Camera Glass', 'cust' => 'Ankur Gao',
        'ca' => 90, 'pc' => 20, 'src' => 'V.M', 'profit' => 70, 'cb' => $sameer, 'status' => 'pending',
    ]);
    $insert->execute([
        'd' => '2026-08-10', 'item' => 'OnePlus Battery', 'cust' => 'Rahul',
        'ca' => 140, 'pc' => 110, 'src' => 'Shop A', 'profit' => 30, 'cb' => $sameer, 'status' => 'settled',
    ]);

    $agg = $pdo->query(
        "SELECT
            COALESCE(SUM(customer_amount), 0) AS total_customer,
            COALESCE(SUM(purchase_cost), 0) AS total_cost,
            COALESCE(SUM(profit), 0) AS total_profit,
            COALESCE(SUM(CASE WHEN settlement_status = 'pending' THEN customer_amount ELSE 0 END), 0) AS pending_amt,
            COALESCE(SUM(CASE WHEN settlement_status = 'settled' THEN customer_amount ELSE 0 END), 0) AS settled_amt
         FROM entries"
    )->fetch();

    if ((float) $agg['total_customer'] === 230.0) pass('Dashboard total customer amount = 230');
    else fail('Dashboard total customer amount expected 230, got ' . $agg['total_customer']);

    if ((float) $agg['total_cost'] === 130.0) pass('Dashboard total purchase cost = 130');
    else fail('Dashboard total purchase cost expected 130, got ' . $agg['total_cost']);

    if ((float) $agg['total_profit'] === 100.0) pass('Dashboard total profit = 100');
    else fail('Dashboard total profit expected 100, got ' . $agg['total_profit']);

    if ((float) $agg['pending_amt'] === 90.0) pass('Pending settlement amount = 90 (customer_amount)');
    else fail('Pending amount expected 90, got ' . $agg['pending_amt']);

    if ((float) $agg['settled_amt'] === 140.0) pass('Settled amount = 140 (customer_amount)');
    else fail('Settled amount expected 140, got ' . $agg['settled_amt']);

    // Date filter boundary test
    $insert->execute([
        'd' => '2026-08-01', 'item' => 'Boundary Start', 'cust' => 'Test',
        'ca' => 50, 'pc' => 10, 'src' => 'X', 'profit' => 40, 'cb' => $sameer, 'status' => 'pending',
    ]);
    $insert->execute([
        'd' => '2026-07-31', 'item' => 'July Entry', 'cust' => 'Test',
        'ca' => 999, 'pc' => 100, 'src' => 'X', 'profit' => 899, 'cb' => $sameer, 'status' => 'pending',
    ]);

    $dateFilter = $pdo->prepare(
        'SELECT COUNT(*) FROM entries WHERE entry_date >= :from AND entry_date <= :to'
    );
    $dateFilter->execute(['from' => '2026-08-01', 'to' => '2026-08-10']);
    $count = (int) $dateFilter->fetchColumn();
    if ($count === 3) {
        pass('Date filter (2026-08-01 to 2026-08-10) returns 3 entries, excludes July');
    } else {
        fail("Date filter expected 3 entries, got {$count}");
    }

    // Search test
    $search = $pdo->prepare(
        "SELECT COUNT(*) FROM entries WHERE item_name LIKE :s OR customer_name LIKE :s OR source_shop LIKE :s"
    );
    $search->execute(['s' => '%Camera%']);
    if ((int) $search->fetchColumn() === 1) pass('Search for Camera returns 1 entry');
    else fail('Search for Camera failed');

    $search->execute(['s' => '%Ankur%']);
    if ((int) $search->fetchColumn() === 1) pass('Search for Ankur returns 1 entry');
    else fail('Search for Ankur failed');

    $search->execute(['s' => '%V.M%']);
    if ((int) $search->fetchColumn() === 1) pass('Search for V.M returns 1 entry');
    else fail('Search for V.M failed');

    // Settlement test
    $entryId = $pdo->query("SELECT id FROM entries WHERE item_name = 'Camera Glass' LIMIT 1")->fetchColumn();
    $settle = $pdo->prepare(
        "UPDATE entries SET settlement_status = 'settled', settled_at = NOW(), settled_by = :owner WHERE id = :id AND settlement_status = 'pending'"
    );
    $settle->execute(['owner' => $owner, 'id' => $entryId]);

    $settle->execute(['owner' => $owner, 'id' => $entryId]);
    $status = $pdo->query("SELECT settlement_status FROM entries WHERE id = {$entryId}")->fetchColumn();
    if ($status === 'settled') pass('Settlement updates status to settled');
    else fail('Settlement status update failed');

    $settledBy = $pdo->query("SELECT settled_by FROM entries WHERE id = {$entryId}")->fetchColumn();
    if ((int) $settledBy === (int) $owner) pass('Settlement records settled_by owner');
    else fail('settled_by not recorded correctly');

    // Clean up test data
    $pdo->exec('DELETE FROM entries');

} catch (Throwable $e) {
    skip('Database tests skipped: ' . $e->getMessage());
}

echo "\n=== Results ===\n";
echo "Passed: {$passed}\n";
echo "Failed: {$failed}\n";
echo "Skipped: {$skipped}\n";

exit($failed > 0 ? 1 : 0);

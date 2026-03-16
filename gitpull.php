<?php
/**
 * Git Pull Deploy Script
 *
 * Pouziti: https://plushouse.cz/gitpull.php?token=PlusHouse2026Deploy
 *
 * DULEZITE: Po prvnim pouziti zmen token nize!
 */

// Tajny token - ZMEN na vlastni!
$secret = 'PlusHouse2026Deploy';

// Branch ktery se ma pullnout
$branch = 'main';

// Overeni tokenu
if (!isset($_GET['token']) || $_GET['token'] !== $secret) {
    http_response_code(403);
    die('Pristup odepren.');
}

// Nastaveni pro vystup
header('Content-Type: text/plain; charset=utf-8');
echo "=== Git Pull Deploy ===\n";
echo "Cas: " . date('Y-m-d H:i:s') . "\n\n";

// Git pull
$output = [];
$returnCode = 0;

// Nastav HOME pro git
putenv('HOME=' . __DIR__);

// Zjisti aktualni stav
exec('cd ' . escapeshellarg(__DIR__) . ' && git status --short 2>&1', $output, $returnCode);
echo "--- Git Status ---\n";
echo implode("\n", $output) . "\n\n";

// Proved git pull
$output = [];
exec('cd ' . escapeshellarg(__DIR__) . ' && git pull origin ' . escapeshellarg($branch) . ' 2>&1', $output, $returnCode);
echo "--- Git Pull ---\n";
echo implode("\n", $output) . "\n\n";

if ($returnCode === 0) {
    echo "USPECH: Deploy dokoncen.\n";
} else {
    echo "CHYBA: Git pull selhal (kod: $returnCode).\n";
}

// Posledni commit
$output = [];
exec('cd ' . escapeshellarg(__DIR__) . ' && git log -1 --oneline 2>&1', $output);
echo "\nPosledni commit: " . implode("\n", $output) . "\n";

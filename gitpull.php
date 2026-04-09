<?php
/**
 * Git Pull Deploy Script
 *
 * Pouziti: https://plushouse.cz/gitpull.php?token=TVUJ_TAJNY_TOKEN
 *
 * Token se nacita z .env souboru (DEPLOY_TOKEN=...).
 * Pokud .env neexistuje, pouzije se fallback token nize.
 */

// Nacti .env soubor pokud existuje
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        putenv("$key=$value");
    }
}

// Token z .env nebo fallback
$secret = getenv('DEPLOY_TOKEN') ?: 'ZMEN_TENTO_TOKEN_V_ENV_SOUBORU';

// Branch ktery se ma pullnout
$branch = getenv('DEPLOY_BRANCH') ?: 'main';

// Overeni tokenu
if (!isset($_GET['token']) || !hash_equals($secret, $_GET['token'])) {
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

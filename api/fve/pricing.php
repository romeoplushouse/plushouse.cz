<?php
/**
 * FVE Pricing API – sync pricing between plushouse.cz and plusconnect.cz
 *
 * GET  /api/fve/pricing.php           → returns current pricing.json
 * POST /api/fve/pricing.php           → updates pricing.json (from plusconnect.cz admin)
 *   Requires header: X-API-Key matching PLUSCONNECT_API_KEY env var
 */

// Load env
$envFile = dirname(__DIR__, 2) . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($value, " \t\n\r\0\x0B\"'"));
    }
}

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$pricingFile = dirname(__DIR__, 2) . '/fve-configurator/configs/pricing.json';

// ── GET: return current pricing ──
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($pricingFile)) {
        http_response_code(404);
        echo json_encode(['error' => 'Pricing file not found']);
        exit;
    }

    $includeVersion = isset($_GET['with_version']);
    $content = file_get_contents($pricingFile);
    $data = json_decode($content, true);

    if ($includeVersion) {
        $data['_version'] = md5($content);
        $data['_updated_at'] = date('c', filemtime($pricingFile));
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// ── POST: update pricing (from plusconnect.cz admin) ──
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Authenticate
    $apiKey = getenv('PLUSCONNECT_API_KEY');
    if (!$apiKey) {
        http_response_code(503);
        echo json_encode(['error' => 'API key not configured']);
        exit;
    }

    $providedKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (!hash_equals($apiKey, $providedKey)) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid API key']);
        exit;
    }

    $input = file_get_contents('php://input');
    $newPricing = json_decode($input, true);

    if (!$newPricing) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    // Validate required sheets
    $requiredSheets = ['Items', 'SystemRules', 'Regions', 'VATRules', 'Segments', 'Meta'];
    foreach ($requiredSheets as $sheet) {
        if (!isset($newPricing[$sheet]) || !is_array($newPricing[$sheet])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required sheet: ' . $sheet]);
            exit;
        }
    }

    // Ensure ConditionalRules exists (can be empty)
    if (!isset($newPricing['ConditionalRules'])) {
        $newPricing['ConditionalRules'] = [];
    }

    // Backup current pricing
    $backupDir = dirname(__DIR__, 2) . '/data/pricing-backups';
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0750, true);
    }
    if (file_exists($pricingFile)) {
        $backupName = 'pricing-' . date('Ymd-His') . '.json';
        copy($pricingFile, $backupDir . '/' . $backupName);

        // Keep only last 20 backups
        $backups = glob($backupDir . '/pricing-*.json');
        if (count($backups) > 20) {
            sort($backups);
            $toDelete = array_slice($backups, 0, count($backups) - 20);
            foreach ($toDelete as $old) {
                unlink($old);
            }
        }
    }

    // Write new pricing
    $written = file_put_contents(
        $pricingFile,
        json_encode($newPricing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );

    if ($written === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write pricing file']);
        exit;
    }

    $version = md5(file_get_contents($pricingFile));

    http_response_code(200);
    echo json_encode([
        'ok' => true,
        'version' => $version,
        'updated_at' => date('c'),
        'message' => 'Pricing updated'
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);

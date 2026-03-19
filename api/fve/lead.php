<?php
/**
 * FVE Lead API – receives configurator leads
 * Stores locally + forwards to plusconnect.cz + optional webhook
 *
 * POST /api/fve/lead.php
 * Body: JSON lead payload from configurator
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || empty($data['customer_email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit;
}

// Sanitize
$data['customer_email'] = filter_var($data['customer_email'], FILTER_SANITIZE_EMAIL);
if (!filter_var($data['customer_email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}

$data['customer_name'] = htmlspecialchars($data['customer_name'] ?? '', ENT_QUOTES, 'UTF-8');
$data['customer_phone'] = preg_replace('/[^0-9+\s-]/', '', $data['customer_phone'] ?? '');
$data['received_at'] = date('c');
$data['source'] = 'plushouse.cz';

// Store lead locally
$leadsDir = dirname(__DIR__, 2) . '/data/fve-leads';
if (!is_dir($leadsDir)) {
    mkdir($leadsDir, 0750, true);
}

$leadId = date('Ymd-His') . '-' . bin2hex(random_bytes(4));
$data['lead_id'] = $leadId;
$leadFile = $leadsDir . '/' . $leadId . '.json';
file_put_contents($leadFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Forward to plusconnect.cz (async-style, best effort)
$plusconnectUrl = getenv('PLUSCONNECT_API_URL');
$plusconnectKey = getenv('PLUSCONNECT_API_KEY');

if ($plusconnectUrl) {
    $forwardUrl = rtrim($plusconnectUrl, '/') . '/api/leads/ingest';
    $ch = curl_init($forwardUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-API-Key: ' . ($plusconnectKey ?: '')
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_CONNECTTIMEOUT => 3
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data['sync_status'] = ($httpCode >= 200 && $httpCode < 300) ? 'synced' : 'pending';
    // Update lead file with sync status
    file_put_contents($leadFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Also forward to legacy webhook if configured
$webhookUrl = $data['token'] ?? '';
// Legacy webhook forwarding handled client-side as fallback

http_response_code(201);
echo json_encode([
    'ok' => true,
    'lead_id' => $leadId,
    'message' => 'Lead přijat'
]);

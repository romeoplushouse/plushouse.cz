<?php
/**
 * Comgate callback handler
 * Comgate volá tuto URL s informací o stavu platby.
 * Dokumentace: https://help.comgate.cz/docs/protocol-api-v1.0
 */
require_once __DIR__ . '/../fulfillment_lib.php';

// Comgate konfigurace – musí odpovídat checkout.php
define('COMGATE_MERCHANT', '');
define('COMGATE_SECRET', '');

// Comgate posílá POST s parametry: merchant, test, price, curr, label, refId, transId, secret, status
$merchant = $_POST['merchant'] ?? '';
$secret = $_POST['secret'] ?? '';
$refId = $_POST['refId'] ?? '';
$transId = $_POST['transId'] ?? '';
$status = $_POST['status'] ?? '';

// Ověření
if (COMGATE_MERCHANT === '' || COMGATE_SECRET === '') {
    http_response_code(500);
    echo "code=1&message=Gateway not configured";
    exit;
}

if ($merchant !== COMGATE_MERCHANT || $secret !== COMGATE_SECRET) {
    http_response_code(403);
    echo "code=1&message=Invalid merchant or secret";
    exit;
}

if ($refId === '') {
    http_response_code(400);
    echo "code=1&message=Missing refId";
    exit;
}

$orders = load_orders();
$index = find_order_index($orders, $refId);

if ($index < 0) {
    http_response_code(404);
    echo "code=1&message=Order not found";
    exit;
}

$order = $orders[$index];

if ($status === 'PAID' && $order['state'] === 'NEW') {
    $order['state'] = 'PAID';
    $order['comgate_trans_id'] = $transId;
    add_history($order, 'NEW', 'PAID', 'Platba potvrzena Comgate, transId: ' . $transId);
    $orders[$index] = $order;
    save_orders($orders);

    // Odeslat potvrzovací e-mail zákazníkovi
    $emailBody = customer_email_paid($order);
    $customerEmail = $order['customer']['email'] ?? '';
    if ($customerEmail !== '' && function_exists('mail')) {
        $headers = "From: info@plushouse.cz\r\nContent-Type: text/plain; charset=UTF-8\r\n";
        mail($customerEmail, 'Potvrzení objednávky ' . $order['id'] . ' | PLUS HOUSE', $emailBody, $headers);
    }
}

if ($status === 'CANCELLED' && $order['state'] === 'NEW') {
    add_history($order, 'NEW', 'NEW', 'Platba zrušena, transId: ' . $transId);
    $orders[$index] = $order;
    save_orders($orders);
}

// Comgate očekává odpověď code=0
echo "code=0&message=OK";

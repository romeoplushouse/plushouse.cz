<?php
/**
 * Eshop Admin – PLUS HOUSE
 * Jednoduchá administrace objednávek s přihlášením heslem.
 */
session_start();
require_once __DIR__ . '/../../fulfillment_lib.php';

// Heslo pro přístup – nastavte v .env souboru (ESHOP_ADMIN_PASSWORD=...)
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($k, $v) = explode('=', $line, 2);
        putenv(trim($k) . '=' . trim($v, " \t\n\r\0\x0B\"'"));
    }
}
define('ADMIN_PASSWORD', getenv('ESHOP_ADMIN_PASSWORD') ?: 'ZMEN_HESLO_V_ENV_SOUBORU');

// Přihlášení / odhlášení
if (isset($_POST['admin_login'])) {
    if ($_POST['password'] === ADMIN_PASSWORD) {
        $_SESSION['eshop_admin'] = true;
    } else {
        $_SESSION['login_error'] = 'Nesprávné heslo.';
    }
    header('Location: ' . $_SERVER['PHP_SELF']);
    exit;
}
if (isset($_GET['logout'])) {
    unset($_SESSION['eshop_admin']);
    header('Location: ' . $_SERVER['PHP_SELF']);
    exit;
}

// Kontrola přihlášení
if (empty($_SESSION['eshop_admin'])) {
    show_login();
    exit;
}

$products = load_products();
$orders = load_orders();
$message = '';

// Akce: změna stavu objednávky
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $orderId = $_POST['order_id'] ?? '';
    $idx = find_order_index($orders, $orderId);

    if ($idx >= 0) {
        $action = $_POST['action'];

        if ($action === 'transition') {
            $newState = $_POST['new_state'] ?? '';
            $note = trim($_POST['note'] ?? '');
            $oldState = $orders[$idx]['state'];

            if (can_transition($oldState, $newState)) {
                // Uložíme extra pole podle stavu
                if ($newState === 'ORDERED_AT_LOXONE') {
                    $orders[$idx]['loxone_order_ref'] = trim($_POST['loxone_order_ref'] ?? '');
                }
                if ($newState === 'SHIPPED') {
                    $orders[$idx]['carrier'] = trim($_POST['carrier'] ?? '');
                    $orders[$idx]['tracking_number'] = trim($_POST['tracking_number'] ?? '');

                    // Odeslat e-mail zákazníkovi
                    $orders[$idx]['state'] = $newState;
                    add_history($orders[$idx], $oldState, $newState, $note ?: 'Stav změněn.');
                    save_orders($orders);

                    $emailBody = customer_email_shipped($orders[$idx]);
                    $customerEmail = $orders[$idx]['customer']['email'] ?? '';
                    if ($customerEmail !== '' && function_exists('mail')) {
                        $headers = "From: info@plushouse.cz\r\nContent-Type: text/plain; charset=UTF-8\r\n";
                        @mail($customerEmail, 'Objednávka ' . $orderId . ' odeslána | PLUS HOUSE', $emailBody, $headers);
                    }

                    $message = "Objednávka $orderId: stav změněn na $newState.";
                    $orders = load_orders(); // reload
                } else {
                    $orders[$idx]['state'] = $newState;
                    add_history($orders[$idx], $oldState, $newState, $note ?: 'Stav změněn.');
                    save_orders($orders);
                    $message = "Objednávka $orderId: stav změněn na $newState.";
                    $orders = load_orders();
                }
            } else {
                $message = "Nelze přejít ze stavu {$oldState} na {$newState}.";
            }
        }

        if ($action === 'update_fields') {
            $orders[$idx]['loxone_order_ref'] = trim($_POST['loxone_order_ref'] ?? $orders[$idx]['loxone_order_ref']);
            $orders[$idx]['carrier'] = trim($_POST['carrier'] ?? $orders[$idx]['carrier']);
            $orders[$idx]['tracking_number'] = trim($_POST['tracking_number'] ?? $orders[$idx]['tracking_number']);
            add_history($orders[$idx], $orders[$idx]['state'], $orders[$idx]['state'], 'Údaje aktualizovány.');
            save_orders($orders);
            $message = "Objednávka $orderId: údaje aktualizovány.";
            $orders = load_orders();
        }
    }
}

// Zobrazení
$view = $_GET['view'] ?? 'list';
$detailId = $_GET['id'] ?? '';

if ($view === 'detail' && $detailId !== '') {
    $idx = find_order_index($orders, $detailId);
    if ($idx >= 0) {
        show_detail($orders[$idx], $products, $message);
    } else {
        $message = "Objednávka $detailId nenalezena.";
        show_list($orders, $products, $message);
    }
} else {
    show_list($orders, $products, $message);
}

// ========== VIEWS ==========

function show_login() {
    $error = $_SESSION['login_error'] ?? '';
    unset($_SESSION['login_error']);
    ?>
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin přihlášení | PLUS HOUSE</title>
<meta name="robots" content="noindex, nofollow">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #1a1a1a; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.login-box { background: #fff; border-radius: 8px; padding: 40px; width: 360px; box-shadow: 0 4px 24px rgba(0,0,0,.3); }
.login-box h1 { font-size: 22px; margin-bottom: 6px; }
.login-box p.sub { color: #888; font-size: 14px; margin-bottom: 24px; }
.login-box input[type=password] { width: 100%; padding: 12px 14px; border: 1px solid #ccc; border-radius: 4px; font-size: 15px; margin-bottom: 16px; }
.login-box button { width: 100%; padding: 12px; background: #b5e126; border: none; border-radius: 4px; font-size: 16px; font-weight: 700; cursor: pointer; }
.login-box button:hover { background: #a3cc1e; }
.error { color: #c00; font-size: 14px; margin-bottom: 12px; }
</style>
</head>
<body>
<div class="login-box">
    <h1>PLUS HOUSE Eshop</h1>
    <p class="sub">Administrace objednávek</p>
    <?php if ($error): ?><p class="error"><?= htmlspecialchars($error) ?></p><?php endif; ?>
    <form method="post">
        <input type="password" name="password" placeholder="Heslo" autofocus required>
        <button type="submit" name="admin_login" value="1">Přihlásit se</button>
    </form>
</div>
</body>
</html>
<?php
}

function show_list($orders, $products, $message) {
    $stateColors = [
        'NEW' => '#5bc0de', 'PAID' => '#b5e126', 'READY_FOR_LOXONE_ORDER' => '#f0ad4e',
        'ORDERED_AT_LOXONE' => '#ff9800', 'SHIPPED' => '#5cb85c', 'DELIVERED' => '#337ab7', 'CLOSED' => '#999',
    ];
    // Řazení: nejnovější nahoře
    $sorted = $orders;
    usort($sorted, function($a, $b) {
        return strcmp($b['id'], $a['id']);
    });
    ?>
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin – Objednávky | PLUS HOUSE</title>
<meta name="robots" content="noindex, nofollow">
<?php admin_css(); ?>
</head>
<body>
<div class="admin-wrap">
    <div class="admin-header">
        <div>
            <h1>Objednávky</h1>
            <span class="count"><?= count($orders) ?> objednávek</span>
        </div>
        <a href="?logout=1" class="btn-logout">Odhlásit se</a>
    </div>

    <?php if ($message): ?><div class="msg"><?= htmlspecialchars($message) ?></div><?php endif; ?>

    <?php if (empty($sorted)): ?>
        <p style="padding:40px;text-align:center;color:#888;">Zatím žádné objednávky.</p>
    <?php else: ?>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Stav</th>
                <th>Zákazník</th>
                <th>Položky</th>
                <th>Celkem</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($sorted as $o): ?>
            <tr>
                <td><strong><?= htmlspecialchars($o['id']) ?></strong></td>
                <td><span class="badge" style="background:<?= $stateColors[$o['state']] ?? '#999' ?>"><?= htmlspecialchars($o['state']) ?></span></td>
                <td>
                    <?= htmlspecialchars($o['customer']['name'] ?? '') ?><br>
                    <small><?= htmlspecialchars($o['customer']['email'] ?? '') ?></small>
                </td>
                <td>
                    <?php foreach (($o['items'] ?? []) as $item): ?>
                        <?= htmlspecialchars($products[$item['sku']]['name'] ?? $item['sku']) ?> x<?= $item['qty'] ?><br>
                    <?php endforeach; ?>
                </td>
                <td><strong><?= number_format($o['total_czk'] ?? 0, 0, ',', ' ') ?> Kč</strong></td>
                <td><a href="?view=detail&id=<?= urlencode($o['id']) ?>" class="btn-detail">Detail</a></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    <?php endif; ?>
</div>
</body>
</html>
<?php
}

function show_detail($order, $products, $message) {
    $stateColors = [
        'NEW' => '#5bc0de', 'PAID' => '#b5e126', 'READY_FOR_LOXONE_ORDER' => '#f0ad4e',
        'ORDERED_AT_LOXONE' => '#ff9800', 'SHIPPED' => '#5cb85c', 'DELIVERED' => '#337ab7', 'CLOSED' => '#999',
    ];
    $currentState = $order['state'];
    $currentIdx = array_search($currentState, ORDER_STATES, true);
    $nextState = ($currentIdx !== false && isset(ORDER_STATES[$currentIdx + 1])) ? ORDER_STATES[$currentIdx + 1] : null;

    // Quick order CSV
    $agg = flatten_order_items_for_quick_order($order, $products);
    $csv = quick_order_csv($agg);
    ?>
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Objednávka <?= htmlspecialchars($order['id']) ?> | Admin PLUS HOUSE</title>
<meta name="robots" content="noindex, nofollow">
<?php admin_css(); ?>
</head>
<body>
<div class="admin-wrap">
    <div class="admin-header">
        <div>
            <a href="?" style="text-decoration:none;color:#888;font-size:14px;">&larr; Zpět na seznam</a>
            <h1><?= htmlspecialchars($order['id']) ?></h1>
        </div>
        <span class="badge big" style="background:<?= $stateColors[$currentState] ?? '#999' ?>"><?= htmlspecialchars($currentState) ?></span>
    </div>

    <?php if ($message): ?><div class="msg"><?= htmlspecialchars($message) ?></div><?php endif; ?>

    <div class="grid-2">
        <div class="card">
            <h3>Zákazník</h3>
            <p><strong><?= htmlspecialchars($order['customer']['name'] ?? '') ?></strong></p>
            <p><?= htmlspecialchars($order['customer']['email'] ?? '') ?></p>
            <p><?= htmlspecialchars($order['customer']['phone'] ?? '') ?></p>
        </div>
        <div class="card">
            <h3>Doručovací adresa</h3>
            <p><?= htmlspecialchars($order['shipping_address']['street'] ?? '') ?></p>
            <p><?= htmlspecialchars($order['shipping_address']['zip'] ?? '') ?> <?= htmlspecialchars($order['shipping_address']['city'] ?? '') ?></p>
            <p><?= htmlspecialchars($order['shipping_address']['country'] ?? 'CZ') ?></p>
        </div>
    </div>

    <div class="card">
        <h3>Položky</h3>
        <table class="items-table">
            <thead><tr><th>Produkt</th><th>SKU</th><th>Množství</th><th>Cena/ks</th><th>Celkem</th></tr></thead>
            <tbody>
            <?php foreach (($order['items'] ?? []) as $item):
                $p = $products[$item['sku']] ?? null;
                $unitPrice = $p ? $p['price_czk'] : 0;
            ?>
                <tr>
                    <td><?= htmlspecialchars($p ? $p['name'] : $item['sku']) ?></td>
                    <td><code><?= htmlspecialchars($item['sku']) ?></code></td>
                    <td><?= $item['qty'] ?></td>
                    <td><?= number_format($unitPrice, 0, ',', ' ') ?> Kč</td>
                    <td><strong><?= number_format($unitPrice * $item['qty'], 0, ',', ' ') ?> Kč</strong></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
            <tfoot><tr><td colspan="4" style="text-align:right;"><strong>Celkem:</strong></td><td><strong><?= number_format($order['total_czk'] ?? 0, 0, ',', ' ') ?> Kč</strong></td></tr></tfoot>
        </table>
    </div>

    <div class="card">
        <h3>Loxone Quick Order CSV</h3>
        <pre style="background:#f5f5f5;padding:12px;border-radius:4px;font-size:14px;"><?= htmlspecialchars($csv) ?></pre>
        <button onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent.trim()).then(()=>this.textContent='Zkopírováno!')" class="btn-small">Kopírovat CSV</button>
    </div>

    <div class="grid-2">
        <div class="card">
            <h3>Údaje k objednávce</h3>
            <form method="post">
                <input type="hidden" name="order_id" value="<?= htmlspecialchars($order['id']) ?>">
                <input type="hidden" name="action" value="update_fields">
                <label>Loxone objednávka ref:</label>
                <input type="text" name="loxone_order_ref" value="<?= htmlspecialchars($order['loxone_order_ref'] ?? '') ?>">
                <label>Dopravce:</label>
                <input type="text" name="carrier" value="<?= htmlspecialchars($order['carrier'] ?? '') ?>">
                <label>Tracking číslo:</label>
                <input type="text" name="tracking_number" value="<?= htmlspecialchars($order['tracking_number'] ?? '') ?>">
                <button type="submit" class="btn-small" style="margin-top:12px;">Uložit</button>
            </form>
        </div>

        <div class="card">
            <h3>Změna stavu</h3>
            <?php if ($nextState): ?>
            <form method="post">
                <input type="hidden" name="order_id" value="<?= htmlspecialchars($order['id']) ?>">
                <input type="hidden" name="action" value="transition">
                <input type="hidden" name="new_state" value="<?= htmlspecialchars($nextState) ?>">
                <p style="margin-bottom:8px;">Aktuální: <strong><?= htmlspecialchars($currentState) ?></strong> &rarr; <strong><?= htmlspecialchars($nextState) ?></strong></p>

                <?php if ($nextState === 'ORDERED_AT_LOXONE'): ?>
                <label>Loxone objednávka ref:</label>
                <input type="text" name="loxone_order_ref" value="<?= htmlspecialchars($order['loxone_order_ref'] ?? '') ?>">
                <?php endif; ?>

                <?php if ($nextState === 'SHIPPED'): ?>
                <label>Dopravce:</label>
                <input type="text" name="carrier" value="<?= htmlspecialchars($order['carrier'] ?? '') ?>" placeholder="PPL, DPD, Zásilkovna...">
                <label>Tracking číslo:</label>
                <input type="text" name="tracking_number" value="<?= htmlspecialchars($order['tracking_number'] ?? '') ?>">
                <?php endif; ?>

                <label>Poznámka:</label>
                <input type="text" name="note" placeholder="Volitelná poznámka">
                <button type="submit" class="btn-transition">Posunout na <?= htmlspecialchars($nextState) ?></button>
            </form>
            <?php else: ?>
                <p style="color:#888;">Objednávka je ve finálním stavu.</p>
            <?php endif; ?>
        </div>
    </div>

    <div class="card">
        <h3>Historie</h3>
        <table class="history-table">
            <thead><tr><th>Datum</th><th>Změna</th><th>Poznámka</th></tr></thead>
            <tbody>
            <?php foreach (array_reverse($order['history'] ?? []) as $h): ?>
                <tr>
                    <td><?= htmlspecialchars(date('d.m.Y H:i', strtotime($h['at']))) ?></td>
                    <td><?= htmlspecialchars($h['from']) ?> &rarr; <?= htmlspecialchars($h['to']) ?></td>
                    <td><?= htmlspecialchars($h['note']) ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
</body>
</html>
<?php
}

function admin_css() { ?>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f4; color: #333; }
.admin-wrap { max-width: 1100px; margin: 0 auto; padding: 30px 20px; }
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #b5e126; padding-bottom: 16px; }
.admin-header h1 { font-size: 24px; margin: 0; }
.count { color: #888; font-size: 14px; }
.btn-logout { background: #eee; color: #333; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 14px; }
.btn-logout:hover { background: #ddd; }
.msg { background: #e8f5e9; border: 1px solid #a5d6a7; color: #2e7d32; padding: 12px 18px; border-radius: 4px; margin-bottom: 20px; }
table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
th { background: #fafafa; text-align: left; padding: 12px 14px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: .5px; }
td { padding: 12px 14px; border-top: 1px solid #eee; font-size: 14px; vertical-align: top; }
.badge { display: inline-block; padding: 4px 10px; border-radius: 3px; color: #000; font-size: 12px; font-weight: 700; }
.badge.big { font-size: 15px; padding: 6px 16px; }
.btn-detail { background: #b5e126; color: #000; padding: 6px 14px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 13px; }
.btn-detail:hover { background: #a3cc1e; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
@media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
.card { background: #fff; border-radius: 6px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.08); margin-bottom: 20px; }
.card h3 { font-size: 16px; margin-bottom: 14px; color: #555; }
.card label { display: block; font-size: 13px; font-weight: 600; color: #888; margin-top: 10px; margin-bottom: 4px; }
.card input[type=text] { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
.btn-small { background: #eee; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; }
.btn-small:hover { background: #ddd; }
.btn-transition { display: block; width: 100%; margin-top: 14px; background: #b5e126; border: none; padding: 12px; border-radius: 4px; font-size: 15px; font-weight: 700; cursor: pointer; }
.btn-transition:hover { background: #a3cc1e; }
.items-table { margin-bottom: 0; box-shadow: none; }
.history-table { box-shadow: none; }
pre { white-space: pre-wrap; word-break: break-all; }
</style>
<?php }

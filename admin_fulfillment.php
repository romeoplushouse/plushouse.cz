<?php
require_once __DIR__ . '/fulfillment_lib.php';

$orders = load_orders();
$products = load_products();
$orderId = $_GET['order_id'] ?? ($orders[0]['id'] ?? '');
$index = find_order_index($orders, $orderId);
$order = $index >= 0 ? $orders[$index] : null;
$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $order) {
  $action = $_POST['action'] ?? '';
  if ($action === 'set_state') {
    $to = $_POST['to_state'] ?? '';
    $from = $order['state'];
    if (can_transition($from, $to)) {
      $order['state'] = $to;
      add_history($order, $from, $to, 'Stav změněn administrátorem.');
      if ($to === 'PAID') {
        $order['email_paid_preview'] = customer_email_paid($order);
      }
      $orders[$index] = $order;
      save_orders($orders);
      $message = 'Stav objednávky byl změněn.';
    } else {
      $message = 'Neplatný přechod stavu.';
    }
  }

  if ($action === 'mark_ordered_loxone') {
    $from = $order['state'];
    $ref = trim($_POST['loxone_order_ref'] ?? '');
    $order['loxone_order_ref'] = $ref;
    if ($from === 'READY_FOR_LOXONE_ORDER' && can_transition($from, 'ORDERED_AT_LOXONE')) {
      $order['state'] = 'ORDERED_AT_LOXONE';
      add_history($order, $from, 'ORDERED_AT_LOXONE', 'Objednáno v Loxone, ref: ' . $ref);
    }
    $orders[$index] = $order;
    save_orders($orders);
    $message = 'Loxone ref uložen.';
  }

  if ($action === 'set_tracking') {
    $from = $order['state'];
    $order['tracking_number'] = trim($_POST['tracking_number'] ?? '');
    $order['carrier'] = trim($_POST['carrier'] ?? '');
    if ($from === 'ORDERED_AT_LOXONE' && can_transition($from, 'SHIPPED')) {
      $order['state'] = 'SHIPPED';
      add_history($order, $from, 'SHIPPED', 'Tracking zadán.');
      $order['email_shipped_preview'] = customer_email_shipped($order);
    }
    $orders[$index] = $order;
    save_orders($orders);
    $message = 'Tracking uložen.';
  }

  header('Location: ?order_id=' . urlencode($orderId) . '&msg=' . urlencode($message));
  exit;
}

if (isset($_GET['download_csv']) && $order) {
  $agg = flatten_order_items_for_quick_order($order, $products);
  $csv = quick_order_csv($agg);
  header('Content-Type: text/csv; charset=UTF-8');
  header('Content-Disposition: attachment; filename="quick-order-' . $order['id'] . '.csv"');
  echo $csv;
  exit;
}

$message = $_GET['msg'] ?? '';
?>
<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <title>Fulfillment admin | PLUS HOUSE</title>
  <link rel="stylesheet" href="bootstrap.css">
</head>
<body style="padding:20px; max-width:1000px; margin:auto;">
<h1>Dropshipping fulfillment – Loxone HW</h1>
<p><strong>Model:</strong> PLUS HOUSE je merchant of record, Loxone fulfillment partner. Bez automatického robotického přístupu do Loxone shopu.</p>

<?php if ($message): ?><div class="alert alert-info"><?= htmlspecialchars($message) ?></div><?php endif; ?>

<form method="get" style="margin-bottom:16px;">
  <label>Objednávka:
    <select name="order_id" onchange="this.form.submit()">
      <?php foreach ($orders as $o): ?>
        <option value="<?= htmlspecialchars($o['id']) ?>" <?= $orderId === $o['id'] ? 'selected' : '' ?>><?= htmlspecialchars($o['id']) ?> (<?= htmlspecialchars($o['state']) ?>)</option>
      <?php endforeach; ?>
    </select>
  </label>
</form>

<?php if ($order): ?>
  <h2>Detail objednávky <?= htmlspecialchars($order['id']) ?></h2>
  <p><strong>Stav:</strong> <?= htmlspecialchars($order['state']) ?></p>
  <p><strong>Dodací adresa (kopírovatelná):</strong><br><code><?= htmlspecialchars(shipping_address_text($order)) ?></code></p>
  <p><a class="btn btn-primary" href="?order_id=<?= urlencode($orderId) ?>&download_csv=1">Stáhnout QuickOrder CSV</a></p>

  <h3>Přechod stavu</h3>
  <form method="post" class="form-inline">
    <input type="hidden" name="action" value="set_state">
    <select name="to_state" class="form-control">
      <?php foreach (ORDER_STATES as $state): ?>
        <option value="<?= htmlspecialchars($state) ?>"><?= htmlspecialchars($state) ?></option>
      <?php endforeach; ?>
    </select>
    <button class="btn btn-default" type="submit">Změnit stav</button>
  </form>

  <h3>Označit objednáno v Loxone</h3>
  <form method="post" class="form-inline">
    <input type="hidden" name="action" value="mark_ordered_loxone">
    <label>loxone_order_ref <input name="loxone_order_ref" class="form-control" value="<?= htmlspecialchars($order['loxone_order_ref'] ?? '') ?>"></label>
    <button class="btn btn-default" type="submit">Uložit + označit objednáno</button>
  </form>

  <h3>Zadat tracking</h3>
  <form method="post" class="form-inline">
    <input type="hidden" name="action" value="set_tracking">
    <label>Dopravce <input name="carrier" class="form-control" value="<?= htmlspecialchars($order['carrier'] ?? '') ?>"></label>
    <label>Tracking <input name="tracking_number" class="form-control" value="<?= htmlspecialchars($order['tracking_number'] ?? '') ?>"></label>
    <button class="btn btn-default" type="submit">Uložit tracking</button>
  </form>

  <h3>Quick Order preview (itemnumber;quantity)</h3>
  <pre><?php $agg=flatten_order_items_for_quick_order($order,$products); foreach($agg as $item=>$qty){ echo htmlspecialchars($item.';'.$qty)."\n"; } ?></pre>

  <h3>Audit historie</h3>
  <ul>
    <?php foreach (($order['history'] ?? []) as $h): ?>
      <li><strong><?= htmlspecialchars($h['at']) ?></strong> <?= htmlspecialchars($h['from']) ?> → <?= htmlspecialchars($h['to']) ?> (<?= htmlspecialchars($h['note']) ?>)</li>
    <?php endforeach; ?>
  </ul>

  <h3>E-mail preview</h3>
  <p><strong>Po zaplacení:</strong></p>
  <pre><?= htmlspecialchars(customer_email_paid($order)) ?></pre>
  <p><strong>Po odeslání:</strong></p>
  <pre><?= htmlspecialchars(customer_email_shipped($order)) ?></pre>
<?php endif; ?>
</body>
</html>

<?php
/**
 * Sledování objednávky – PLUS HOUSE Eshop
 * Zákazník zadá číslo objednávky a e-mail, stránka zobrazí stav objednávky.
 */
require_once __DIR__ . '/../fulfillment_lib.php';

$stateLabels = [
    'NEW'                    => 'Nová objednávka',
    'PAID'                   => 'Zaplaceno',
    'READY_FOR_LOXONE_ORDER' => 'Připraveno k expedici',
    'ORDERED_AT_LOXONE'      => 'Objednáno u dodavatele',
    'SHIPPED'                => 'Odesláno',
    'DELIVERED'              => 'Doručeno',
    'CLOSED'                 => 'Dokončeno',
];

$order = null;
$error = '';
$searched = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $searched = true;
    $orderId = trim($_POST['order_id'] ?? '');
    $email   = trim($_POST['email'] ?? '');

    if ($orderId === '' || $email === '') {
        $error = 'Vyplňte prosím číslo objednávky i e-mail.';
    } else {
        $orders = load_orders();
        $idx = find_order_index($orders, $orderId);
        if ($idx >= 0) {
            $found = $orders[$idx];
            if (strtolower($found['customer']['email'] ?? '') === strtolower($email)) {
                $order = $found;
            } else {
                $error = 'Objednávka nebyla nalezena. Zkontrolujte prosím zadané údaje.';
            }
        } else {
            $error = 'Objednávka nebyla nalezena. Zkontrolujte prosím zadané údaje.';
        }
    }
}

// Compute progress bar position
$currentStateIndex = 0;
if ($order) {
    $idx = array_search($order['state'], ORDER_STATES, true);
    if ($idx !== false) $currentStateIndex = $idx;
}
$totalStates = count(ORDER_STATES);

$products = null;
if ($order) {
    $products = load_products();
}
?>
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sledování objednávky | PLUS HOUSE Eshop</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" type="text/css" href="/css/bootstrap.css" />
<link rel="stylesheet" type="text/css" href="/css/font-awesome.min.css" />
<link rel="stylesheet" type="text/css" href="/css/pix_style.css" />
<link rel="stylesheet" type="text/css" href="/css/main.css" />
<link rel="stylesheet" type="text/css" href="/css/font-style.css" />
<link rel="icon" type="image/png" sizes="32x32" href="https://www.plushouse.cz/uploads/uploads/ico/favicon-32x32.png">
<style>
html { scroll-behavior: smooth; }
::-webkit-scrollbar { width: 5px; background-color: rgba(255,255,255,.4); }
::-webkit-scrollbar-track { background-color: #ffffff; opacity: .4; }
::-webkit-scrollbar-thumb { background-color: #888; opacity: .8; }
::-webkit-scrollbar-thumb:hover { background-color: #555; opacity: .8; }

.dropdown-menu-link { color: #b5e126; font-family: Montserrat; font-weight: 600; }
.dropdown-menu-link:hover { color: #b5e154; background-color: white !important; font-family: Montserrat; font-weight: 600; }
.dropdown-menu { font-weight: 600 !important; background-color: black !important; padding: 5px 15px !important; padding-bottom: 10px !important; }

/* Page styles */
body { font-family: 'Montserrat', sans-serif; background: #0a0a0a; color: #fff; }
.page-wrap { max-width: 720px; margin: 0 auto; padding: 60px 15px 80px; }
.page-wrap h1 { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 28px; margin-bottom: 10px; color: #fff; }
.page-wrap .subtitle { color: #999; font-size: 15px; margin-bottom: 40px; }

/* Form */
.tracking-form { background: #141414; border: 1px solid #222; border-radius: 8px; padding: 32px; margin-bottom: 40px; }
.tracking-form label { display: block; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #b5e126; margin-bottom: 6px; }
.tracking-form input[type="text"],
.tracking-form input[type="email"] {
    width: 100%; padding: 12px 16px; border: 1px solid #333; border-radius: 6px;
    background: #0a0a0a; color: #fff; font-size: 15px; font-family: 'Montserrat', sans-serif;
    transition: border-color 0.2s;
}
.tracking-form input:focus { outline: none; border-color: #b5e126; }
.form-row { display: flex; gap: 16px; margin-bottom: 0; }
.form-row .form-group { flex: 1; }
.form-group { margin-bottom: 20px; }
.btn-track {
    background: #b5e126; color: #000; font-weight: 700; font-size: 15px;
    padding: 14px 36px; border: none; border-radius: 6px; cursor: pointer;
    width: 100%; font-family: 'Montserrat', sans-serif; text-transform: uppercase;
    letter-spacing: 0.5px; transition: background 0.2s;
}
.btn-track:hover { background: #a3cc1e; }

/* Error / not found */
.alert-error { background: rgba(220,53,69,0.12); border: 1px solid rgba(220,53,69,0.3); border-radius: 6px; padding: 14px 20px; color: #ff6b6b; margin-bottom: 24px; font-size: 14px; }

/* Order card */
.order-card { background: #141414; border: 1px solid #222; border-radius: 8px; overflow: hidden; }
.order-header { padding: 28px 32px 20px; border-bottom: 1px solid #222; }
.order-header h2 { margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #fff; }
.order-header .order-id { color: #b5e126; font-weight: 600; font-size: 15px; }
.order-header .order-state-badge {
    display: inline-block; background: rgba(181,225,38,0.15); color: #b5e126;
    padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px; margin-top: 10px;
}

/* Progress bar */
.progress-track { padding: 24px 32px 28px; border-bottom: 1px solid #222; }
.progress-steps { display: flex; justify-content: space-between; position: relative; margin-bottom: 0; }
.progress-steps::before {
    content: ''; position: absolute; top: 14px; left: 0; right: 0;
    height: 3px; background: #333; z-index: 0; border-radius: 2px;
}
.progress-steps .bar-fill {
    position: absolute; top: 14px; left: 0; height: 3px;
    background: #b5e126; z-index: 1; border-radius: 2px; transition: width 0.5s;
}
.progress-step { position: relative; z-index: 2; text-align: center; flex: 1; }
.progress-step .dot {
    width: 30px; height: 30px; border-radius: 50%; margin: 0 auto 8px;
    border: 3px solid #333; background: #0a0a0a; display: flex; align-items: center;
    justify-content: center; font-size: 12px; color: #333; transition: all 0.3s;
}
.progress-step.active .dot { border-color: #b5e126; background: #b5e126; color: #000; }
.progress-step.completed .dot { border-color: #b5e126; background: #b5e126; color: #000; }
.progress-step .step-label { font-size: 10px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.3; }
.progress-step.active .step-label, .progress-step.completed .step-label { color: #b5e126; }

/* Order sections */
.order-section { padding: 24px 32px; border-bottom: 1px solid #222; }
.order-section:last-child { border-bottom: none; }
.order-section h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #b5e126; margin: 0 0 16px; font-weight: 700; }

/* Items table */
.items-table { width: 100%; }
.items-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; font-weight: 600; padding: 0 0 10px; text-align: left; }
.items-table th:last-child { text-align: right; }
.items-table td { padding: 10px 0; border-top: 1px solid #1a1a1a; color: #ccc; font-size: 14px; }
.items-table td:last-child { text-align: right; font-weight: 600; }
.items-total { text-align: right; font-size: 18px; font-weight: 700; color: #fff; margin-top: 16px; padding-top: 12px; border-top: 1px solid #333; }

/* Shipping / tracking info */
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.info-item label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; font-weight: 600; margin-bottom: 4px; }
.info-item span { font-size: 14px; color: #ccc; }
.tracking-highlight {
    background: rgba(181,225,38,0.08); border: 1px solid rgba(181,225,38,0.2);
    border-radius: 6px; padding: 16px; margin-top: 16px;
}
.tracking-highlight .tracking-num { font-size: 18px; font-weight: 700; color: #b5e126; letter-spacing: 1px; }

/* History timeline */
.history-list { list-style: none; padding: 0; margin: 0; }
.history-list li { position: relative; padding: 0 0 16px 24px; }
.history-list li:last-child { padding-bottom: 0; }
.history-list li::before {
    content: ''; position: absolute; left: 6px; top: 8px;
    width: 8px; height: 8px; border-radius: 50%; background: #b5e126;
}
.history-list li::after {
    content: ''; position: absolute; left: 9px; top: 18px; bottom: 0;
    width: 2px; background: #222;
}
.history-list li:last-child::after { display: none; }
.history-date { font-size: 12px; color: #666; }
.history-note { font-size: 14px; color: #ccc; margin-top: 2px; }

/* Responsive */
@media (max-width: 600px) {
    .form-row { flex-direction: column; gap: 0; }
    .order-header, .progress-track, .order-section { padding-left: 20px; padding-right: 20px; }
    .info-grid { grid-template-columns: 1fr; }
    .progress-step .step-label { font-size: 8px; }
    .progress-step .dot { width: 24px; height: 24px; font-size: 10px; }
}
</style>
</head>
<body>

<!-- NAV -->
<div class="pix_section pix_nav_menu normal pix-padding-v-20 pix-over-header pix_scroll_header slow-mo" data-scroll-bg="#000000" id="section_1" style="background-color: #000; background-repeat: repeat-x; padding-top: 20px; padding-bottom: 20px; display: block;">
<div class="container">
<div class="row">
    <div class="col-md-10 col-xs-12">
        <nav class="navbar navbar-default pix-no-margin-bottom pix-navbar-default">
        <div class="container">
            <div class="navbar-header">
                <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#pix-navbar-collapse">
                    <span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>
                </button>
                <a class="navbar-brand logo-img logo-img-a" href="https://www.plushouse.cz/">
                    <img src="/uploads/plushouse-RSF.png" class="img-responsive pix-logo-img" alt="PLUS HOUSE">
                </a>
            </div>
            <div class="navbar-collapse pix-no-h-padding collapse" id="pix-navbar-collapse" style="height: 1px;">
                <ul class="nav navbar-nav pix-inline-block pix-float-none media-middle pix-header-nav pix-adjust-height" id="pix-header-nav" style="margin-top: 13.5px;">
                    <li class="dropdown">
                        <a href="#" class="pix-gray pix-nav-link" data-toggle="dropdown" style="color: rgb(181, 225, 38);">SLUŽBY</a>
                        <ul class="dropdown-menu dropdown-menu-left">
                            <li><a href="https://www.plushouse.cz/fotovoltaika" class="dropdown-menu-link">FOTOVOLTAIKA</a></li>
                            <li><a href="https://www.plushouse.cz/trafostanice" class="dropdown-menu-link">TRAFOSTANICE</a></li>
                            <li><a href="https://www.plushouse.cz/fototermika.html" class="dropdown-menu-link">FOTOTERMIKA</a></li>
                            <li><a href="https://www.plushouse.cz/tepelna-cerpadla.html" class="dropdown-menu-link">TEPELNÁ ČERPADLA</a></li>
                            <li><a href="https://www.plushouse.cz/nabijeci-stanice.html" class="dropdown-menu-link">NABÍJECÍ STANICE</a></li>
                            <li><a href="https://www.plushouse.cz/pms" class="dropdown-menu-link">PMS PRO HOTELY</a></li>
                            <li><a href="https://www.plushouse.cz/plusconnect" class="dropdown-menu-link">PLUSCONNECT</a></li>
                            <li><a href="https://www.plushouse.cz/eshop/loxone/balicky/" class="dropdown-menu-link">ESHOP</a></li>
                        </ul>
                    </li>
                    <li><a href="https://www.plushouse.cz/cenik.html" class="pix-gray pix-nav-link" style="color: rgb(181, 225, 38);">CENÍK</a></li>
                    <li><a href="https://www.plushouse.cz/blog" class="pix-gray pix-nav-link" style="color: rgb(181, 225, 38);">BLOG</a></li>
                    <li><a href="https://www.plushouse.cz/eshop/loxone/balicky/" class="pix-gray pix-nav-link" style="color: rgb(181, 225, 38);">ESHOP</a></li>
                </ul>
            </div>
        </div>
        </nav>
    </div>
    <div class="col-md-2 col-xs-12 text-right">
        <a href="tel:+420734384858" class="btn small-text pix-inline-block normal btn-md pix-line" style="background: transparent; border-color: rgb(181,225,38); color: rgb(181,225,38);"><b>+420 734 38 48 58</b></a>
    </div>
</div>
</div>
</div>

<!-- CONTENT -->
<div class="page-wrap">

<h1>Sledování objednávky</h1>
<p class="subtitle">Zadejte číslo objednávky a e-mail, který jste použili při nákupu.</p>

<div class="tracking-form">
    <?php if ($error): ?>
        <div class="alert-error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <form method="post">
        <div class="form-row">
            <div class="form-group">
                <label for="order_id">Číslo objednávky</label>
                <input type="text" id="order_id" name="order_id" placeholder="např. ORD-2026-0001" value="<?= htmlspecialchars($_POST['order_id'] ?? '') ?>" required>
            </div>
            <div class="form-group">
                <label for="email">E-mail</label>
                <input type="email" id="email" name="email" placeholder="vas@email.cz" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required>
            </div>
        </div>
        <button type="submit" class="btn-track">Vyhledat objednávku</button>
    </form>
</div>

<?php if ($order): ?>
<div class="order-card">

    <!-- Header -->
    <div class="order-header">
        <h2>Objednávka <span class="order-id"><?= htmlspecialchars($order['id']) ?></span></h2>
        <div class="order-state-badge"><?= htmlspecialchars($stateLabels[$order['state']] ?? $order['state']) ?></div>
    </div>

    <!-- Progress bar -->
    <div class="progress-track">
        <div class="progress-steps">
            <?php
            $fillPercent = $totalStates > 1 ? ($currentStateIndex / ($totalStates - 1)) * 100 : 0;
            ?>
            <div class="bar-fill" style="width: <?= $fillPercent ?>%;"></div>
            <?php foreach (ORDER_STATES as $i => $state): ?>
                <?php
                    $stepClass = '';
                    if ($i < $currentStateIndex) $stepClass = 'completed';
                    elseif ($i === $currentStateIndex) $stepClass = 'active';
                ?>
                <div class="progress-step <?= $stepClass ?>">
                    <div class="dot">
                        <?php if ($i < $currentStateIndex): ?>
                            <i class="fa fa-check" style="font-size: 11px;"></i>
                        <?php elseif ($i === $currentStateIndex): ?>
                            <i class="fa fa-circle" style="font-size: 8px;"></i>
                        <?php endif; ?>
                    </div>
                    <div class="step-label"><?= htmlspecialchars($stateLabels[$state] ?? $state) ?></div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Items -->
    <div class="order-section">
        <h3>Položky objednávky</h3>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Produkt</th>
                    <th>Množství</th>
                    <th style="text-align: right;">Cena</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach (($order['items'] ?? []) as $item): ?>
                <?php
                    $sku = $item['sku'];
                    $qty = (int)($item['qty'] ?? 1);
                    $productName = $sku;
                    $productPrice = 0;
                    if ($products && isset($products[$sku])) {
                        $productName = $products[$sku]['name'];
                        $productPrice = ($products[$sku]['price_czk'] ?? 0) * $qty;
                    }
                ?>
                <tr>
                    <td><?= htmlspecialchars($productName) ?><br><small style="color:#666;"><?= htmlspecialchars($sku) ?></small></td>
                    <td><?= $qty ?>&times;</td>
                    <td><?= $productPrice > 0 ? number_format($productPrice, 0, ',', ' ') . ' Kč' : '—' ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
        <?php if (isset($order['total_czk']) && $order['total_czk'] > 0): ?>
            <div class="items-total">Celkem: <?= number_format($order['total_czk'], 0, ',', ' ') ?> Kč vč. DPH</div>
        <?php endif; ?>
    </div>

    <!-- Shipping -->
    <div class="order-section">
        <h3>Doručení</h3>
        <div class="info-grid">
            <div class="info-item">
                <label>Adresa</label>
                <span><?= htmlspecialchars(shipping_address_text($order)) ?></span>
            </div>
            <?php if (!empty($order['carrier'])): ?>
            <div class="info-item">
                <label>Dopravce</label>
                <span><?= htmlspecialchars($order['carrier']) ?></span>
            </div>
            <?php endif; ?>
        </div>
        <?php if (!empty($order['tracking_number'])): ?>
        <div class="tracking-highlight">
            <label style="display:block; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#666; font-weight:600; margin-bottom:6px;">Sledovací číslo zásilky</label>
            <div class="tracking-num"><?= htmlspecialchars($order['tracking_number']) ?></div>
        </div>
        <?php endif; ?>
    </div>

    <!-- History -->
    <?php if (!empty($order['history'])): ?>
    <div class="order-section">
        <h3>Historie objednávky</h3>
        <ul class="history-list">
            <?php
            $history = $order['history'];
            usort($history, function($a, $b) {
                return strcmp($b['at'] ?? '', $a['at'] ?? '');
            });
            foreach ($history as $h):
                $date = '';
                if (!empty($h['at'])) {
                    $ts = strtotime($h['at']);
                    if ($ts) $date = date('j. n. Y H:i', $ts);
                }
                $label = '';
                if (!empty($h['to'])) {
                    $label = $stateLabels[$h['to']] ?? $h['to'];
                }
            ?>
            <li>
                <div class="history-date"><?= htmlspecialchars($date) ?></div>
                <div class="history-note">
                    <?php if ($label): ?><strong><?= htmlspecialchars($label) ?></strong> — <?php endif; ?>
                    <?= htmlspecialchars($h['note'] ?? '') ?>
                </div>
            </li>
            <?php endforeach; ?>
        </ul>
    </div>
    <?php endif; ?>

</div>
<?php elseif ($searched && !$error): ?>
    <!-- This shouldn't normally happen since we set $error, but just in case -->
    <div class="alert-error">Objednávka nebyla nalezena.</div>
<?php endif; ?>

</div>

<!-- FOOTER -->
<div class="pix_section pix-padding-bottom-20 pix-padding-top-60 gray-dark-bg" style="background-color: rgb(0,0,0); padding-top:60px; padding-bottom:20px;">
<div class="container"><div class="row">
<div class="col-md-6"><h5 class="pix-white"><strong>NAŠE VIZE</strong></h5><p class="pix-gray"><span style="color:#fff;">Navrhujeme technicky čistá řešení, která fungují i po letech provozu.</span></p></div>
<div class="col-md-3"><h5 class="pix-white"><strong>KONTAKTUJTE NÁS</strong></h5><p class="pix-gray"><span style="color:#fff;">info@plushouse.cz<br>+420 734 38 48 58<br>Mladeč 61, 783 21 Mladeč</span></p></div>
<div class="col-md-3"><h5 class="pix-white"><strong>SLEDUJTE NÁS</strong></h5><a href="https://www.facebook.com/plushousecz" class="small-social"><i class="pixicon-facebook3" style="color:#a4aaae;font-size:32px;"></i></a> <a href="https://www.instagram.com/plushouse.cz" class="small-social"><i class="pixicon-instagram4" style="color:#a4aaae;font-size:32px;"></i></a></div>
</div></div>
</div>

<script src="/js/jquery-1.11.2.js"></script>
<script src="/js/bootstrap.js"></script>
</body>
</html>

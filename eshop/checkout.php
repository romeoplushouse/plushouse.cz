<?php
/**
 * Eshop checkout – PLUS HOUSE
 * Zobrazí formulář, vytvoří objednávku a přesměruje na Comgate platební bránu.
 */
require_once __DIR__ . '/../fulfillment_lib.php';

// Comgate konfigurace – vyplňte svůj merchant ID a secret
define('COMGATE_MERCHANT', '');   // <-- doplnit Comgate merchant ID
define('COMGATE_SECRET', '');     // <-- doplnit Comgate secret key
define('COMGATE_TEST', true);     // true = testovací režim, false = produkce
define('COMGATE_CREATE_URL', 'https://payments.comgate.cz/v1.0/create');

$products = load_products();
$errors = [];
$sku = $_GET['sku'] ?? ($_POST['sku'] ?? '');
$qty = max(1, (int)($_GET['qty'] ?? ($_POST['qty'] ?? 1)));

if (!isset($products[$sku])) {
    header('Location: /eshop/loxone/balicky/');
    exit;
}

$product = $products[$sku];
$totalPrice = $product['price_czk'] * $qty;

// Zpracování formuláře
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $street = trim($_POST['street'] ?? '');
    $city = trim($_POST['city'] ?? '');
    $zip = trim($_POST['zip'] ?? '');
    $consent = isset($_POST['consent']);

    if ($name === '') $errors[] = 'Vyplňte jméno a příjmení.';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Zadejte platný e-mail.';
    if ($phone === '') $errors[] = 'Vyplňte telefonní číslo.';
    if ($street === '') $errors[] = 'Vyplňte ulici a číslo.';
    if ($city === '') $errors[] = 'Vyplňte město.';
    if (!preg_match('/^\d{3}\s?\d{2}$/', $zip)) $errors[] = 'Zadejte platné PSČ.';
    if (!$consent) $errors[] = 'Musíte souhlasit s obchodními podmínkami.';

    if (empty($errors)) {
        // Vygeneruj ID objednávky
        $orders = load_orders();
        $year = date('Y');
        $maxNum = 0;
        foreach ($orders as $o) {
            if (preg_match('/^ORD-' . $year . '-(\d+)$/', $o['id'], $m)) {
                $maxNum = max($maxNum, (int)$m[1]);
            }
        }
        $orderId = sprintf('ORD-%s-%04d', $year, $maxNum + 1);

        $order = [
            'id' => $orderId,
            'state' => 'NEW',
            'customer' => [
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
            ],
            'shipping_address' => [
                'street' => $street,
                'city' => $city,
                'zip' => preg_replace('/\s/', '', $zip),
                'country' => 'CZ',
            ],
            'items' => [
                ['sku' => $sku, 'qty' => $qty],
            ],
            'total_czk' => $totalPrice,
            'loxone_order_ref' => '',
            'tracking_number' => '',
            'carrier' => '',
            'history' => [
                ['at' => date('c'), 'from' => '', 'to' => 'NEW', 'note' => 'Objednávka vytvořena.'],
            ],
        ];

        $orders[] = $order;
        save_orders($orders);

        // Comgate – vytvoření platby
        if (COMGATE_MERCHANT !== '' && COMGATE_SECRET !== '') {
            $baseUrl = 'https://www.plushouse.cz';
            $comgateData = [
                'merchant' => COMGATE_MERCHANT,
                'test' => COMGATE_TEST ? 'true' : 'false',
                'price' => $totalPrice * 100, // Comgate expects haléře (cents)
                'curr' => 'CZK',
                'label' => 'Objednávka ' . $orderId,
                'refId' => $orderId,
                'method' => 'ALL',
                'email' => $email,
                'prepareOnly' => 'true',
                'secret' => COMGATE_SECRET,
                'url_ok' => $baseUrl . '/eshop/comgate-return.php?status=ok&refId=' . urlencode($orderId),
                'url_cancelled' => $baseUrl . '/eshop/comgate-return.php?status=cancelled&refId=' . urlencode($orderId),
                'url_pending' => $baseUrl . '/eshop/comgate-return.php?status=pending&refId=' . urlencode($orderId),
                'url_callback' => $baseUrl . '/eshop/comgate-callback.php',
            ];

            $ch = curl_init(COMGATE_CREATE_URL);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($comgateData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200 && $response) {
                parse_str($response, $parsed);
                if (($parsed['code'] ?? '') === '0' && !empty($parsed['redirect'])) {
                    // Uložíme transId
                    $idx = find_order_index($orders, $orderId);
                    if ($idx >= 0) {
                        $orders[$idx]['comgate_trans_id'] = $parsed['transId'] ?? '';
                        save_orders($orders);
                    }
                    header('Location: ' . $parsed['redirect']);
                    exit;
                }
            }

            // Pokud Comgate selže, přesměruj na return stránku s chybou
            header('Location: /eshop/comgate-return.php?status=error&refId=' . urlencode($orderId));
            exit;
        } else {
            // Comgate ještě není nakonfigurován – zobraz potvrzení
            header('Location: /eshop/comgate-return.php?status=no_gateway&refId=' . urlencode($orderId));
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Objednávka – <?= htmlspecialchars($product['name']) ?> | PLUS HOUSE</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" type="text/css" href="/css/bootstrap.css" />
<link rel="stylesheet" type="text/css" href="/css/font-awesome.min.css" />
<link rel="stylesheet" type="text/css" href="/css/pix_style.css" />
<link rel="stylesheet" type="text/css" href="/css/main.css" />
<link rel="stylesheet" type="text/css" href="/css/font-style.css" />
<link rel="stylesheet" type="text/css" href="/css/professional.css" />
<link rel="icon" type="image/png" sizes="32x32" href="https://www.plushouse.cz/uploads/uploads/ico/favicon-32x32.png">
<style>
html { scroll-behavior: smooth; }
.checkout-form { max-width: 640px; margin: 0 auto; }
.checkout-form .form-group { margin-bottom: 18px; }
.checkout-form label { font-weight: 600; display: block; margin-bottom: 4px; }
.checkout-form input[type="text"],
.checkout-form input[type="email"],
.checkout-form input[type="tel"] {
    width: 100%; padding: 10px 14px; border: 1px solid #ccc; border-radius: 4px; font-size: 15px;
}
.checkout-summary { background: #f8f8f8; border: 1px solid #e8e8e8; border-radius: 6px; padding: 24px; margin-bottom: 30px; }
.checkout-summary h3 { margin-top: 0; }
.checkout-summary .price { font-size: 22px; font-weight: 700; color: #333; }
.btn-pay { background-color: #b5e126; color: #000; font-weight: 700; font-size: 18px; padding: 14px 40px; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
.btn-pay:hover { background-color: #a3cc1e; }
.error-list { background: #fee; border: 1px solid #fcc; border-radius: 4px; padding: 14px 20px; margin-bottom: 20px; color: #c00; }
.error-list li { margin-bottom: 4px; }
</style>
</head>
<body>
<div class="pix_section pix_nav_menu normal pix-padding-v-20 pix-over-header pix_scroll_header slow-mo" data-scroll-bg="#000000" id="section_1" style="background-repeat: repeat-x; padding-top: 20px; padding-bottom: 20px; display: block;">
<div class="container"><div class="row">
<div class="col-md-10 col-xs-12"><nav class="navbar navbar-default pix-no-margin-bottom pix-navbar-default"><div class="container"><div class="navbar-header"><button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#pix-navbar-collapse"><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></button><a class="navbar-brand logo-img logo-img-a" href="https://www.plushouse.cz/"><img src="/uploads/plushouse-RSF.png" class="img-responsive pix-logo-img" alt="PLUS HOUSE"></a></div></div></nav></div>
<div class="col-md-2 col-xs-12 text-right"><a href="tel:+420734384858" class="btn small-text pix-inline-block normal btn-md pix-line" style="background: transparent; border-color: rgb(181,225,38); color: rgb(181,225,38);"><b>+420 734 38 48 58</b></a></div>
</div></div>
</div>

<div class="container" style="max-width: 800px; padding: 60px 15px 80px;">
<h1 class="pix-black-gray-dark">Objednávka</h1>

<div class="checkout-summary">
    <h3><?= htmlspecialchars($product['name']) ?></h3>
    <p>Množství: <?= $qty ?> ks</p>
    <p class="price"><?= number_format($totalPrice, 0, ',', ' ') ?> Kč vč. DPH</p>
    <p><small>Dodací doba: <?= htmlspecialchars($product['lead_time_text']) ?></small></p>
</div>

<?php if (!empty($errors)): ?>
<div class="error-list">
    <ul style="margin:0; padding-left:20px;">
    <?php foreach ($errors as $e): ?>
        <li><?= htmlspecialchars($e) ?></li>
    <?php endforeach; ?>
    </ul>
</div>
<?php endif; ?>

<form method="post" class="checkout-form">
    <input type="hidden" name="sku" value="<?= htmlspecialchars($sku) ?>">
    <input type="hidden" name="qty" value="<?= $qty ?>">

    <h2>Kontaktní údaje</h2>
    <div class="form-group">
        <label for="name">Jméno a příjmení *</label>
        <input type="text" id="name" name="name" value="<?= htmlspecialchars($_POST['name'] ?? '') ?>" required>
    </div>
    <div class="form-group">
        <label for="email">E-mail *</label>
        <input type="email" id="email" name="email" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required>
    </div>
    <div class="form-group">
        <label for="phone">Telefon *</label>
        <input type="tel" id="phone" name="phone" value="<?= htmlspecialchars($_POST['phone'] ?? '') ?>" required>
    </div>

    <h2>Doručovací adresa</h2>
    <div class="form-group">
        <label for="street">Ulice a číslo *</label>
        <input type="text" id="street" name="street" value="<?= htmlspecialchars($_POST['street'] ?? '') ?>" required>
    </div>
    <div class="row">
        <div class="col-md-8 col-xs-8">
            <div class="form-group">
                <label for="city">Město *</label>
                <input type="text" id="city" name="city" value="<?= htmlspecialchars($_POST['city'] ?? '') ?>" required>
            </div>
        </div>
        <div class="col-md-4 col-xs-4">
            <div class="form-group">
                <label for="zip">PSČ *</label>
                <input type="text" id="zip" name="zip" value="<?= htmlspecialchars($_POST['zip'] ?? '') ?>" required placeholder="123 45">
            </div>
        </div>
    </div>

    <div class="form-group" style="margin-top: 20px;">
        <label style="font-weight: normal;">
            <input type="checkbox" name="consent" <?= isset($_POST['consent']) ? 'checked' : '' ?>>
            Souhlasím s <a href="/obchodni-podminky.html" target="_blank">obchodními podmínkami</a> a beru na vědomí <a href="/zasady_ochrany_os_udaju.html" target="_blank">zásady ochrany osobních údajů</a>. *
        </label>
    </div>

    <button type="submit" class="btn-pay">Přejít k platbě</button>
    <p style="text-align: center; margin-top: 14px; color: #888; font-size: 13px;">
        Platba je zabezpečena platební bránou <strong>Comgate</strong>. Po odeslání budete přesměrováni na bezpečnou platební stránku.
    </p>
</form>
</div>

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

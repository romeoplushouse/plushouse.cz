<?php
/**
 * Návratová stránka po platbě přes Comgate.
 */
$status = $_GET['status'] ?? '';
$refId = htmlspecialchars($_GET['refId'] ?? '', ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stav objednávky | PLUS HOUSE</title>
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
.status-box { max-width: 640px; margin: 0 auto; text-align: center; padding: 60px 20px; }
.status-icon { font-size: 64px; margin-bottom: 20px; }
.status-ok { color: #b5e126; }
.status-pending { color: #f0ad4e; }
.status-error { color: #d9534f; }
</style>
</head>
<body>
<div class="pix_section pix_nav_menu normal pix-padding-v-20 pix-over-header pix_scroll_header slow-mo" data-scroll-bg="#000000" id="section_1" style="background-repeat: repeat-x; padding-top: 20px; padding-bottom: 20px; display: block;">
<div class="container"><div class="row">
<div class="col-md-10 col-xs-12"><nav class="navbar navbar-default pix-no-margin-bottom pix-navbar-default"><div class="container"><div class="navbar-header"><button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#pix-navbar-collapse"><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></button><a class="navbar-brand logo-img logo-img-a" href="https://www.plushouse.cz/"><img src="/uploads/plushouse-RSF.png" class="img-responsive pix-logo-img" alt="PLUS HOUSE"></a></div></div></nav></div>
<div class="col-md-2 col-xs-12 text-right"><a href="tel:+420734384858" class="btn small-text pix-inline-block normal btn-md pix-line" style="background: transparent; border-color: rgb(181,225,38); color: rgb(181,225,38);"><b>+420 734 38 48 58</b></a></div>
</div></div>
</div>

<div class="container" style="padding: 60px 15px 80px;">
<div class="status-box">

<?php if ($status === 'ok'): ?>
    <div class="status-icon status-ok"><i class="fa fa-check-circle"></i></div>
    <h1 class="pix-black-gray-dark">Platba proběhla úspěšně</h1>
    <p class="big-text">Děkujeme za vaši objednávku <strong><?= $refId ?></strong>.</p>
    <p class="big-text">Potvrzení jsme odeslali na váš e-mail. Zboží bude expedováno z distribučního skladu v nejbližším možném termínu.</p>
    <p><a href="/" class="btn small-text pix-white" style="background-color: #b5e126; color: #000; padding: 12px 30px; font-weight: 700;">Zpět na hlavní stránku</a></p>

<?php elseif ($status === 'pending'): ?>
    <div class="status-icon status-pending"><i class="fa fa-clock-o"></i></div>
    <h1 class="pix-black-gray-dark">Platba se zpracovává</h1>
    <p class="big-text">Vaše objednávka <strong><?= $refId ?></strong> byla přijata. Čekáme na potvrzení platby.</p>
    <p class="big-text">Jakmile bude platba potvrzena, obdržíte e-mail s potvrzením.</p>
    <p><a href="/" class="btn small-text pix-white" style="background-color: #b5e126; color: #000; padding: 12px 30px; font-weight: 700;">Zpět na hlavní stránku</a></p>

<?php elseif ($status === 'cancelled'): ?>
    <div class="status-icon status-error"><i class="fa fa-times-circle"></i></div>
    <h1 class="pix-black-gray-dark">Platba byla zrušena</h1>
    <p class="big-text">Vaše platba pro objednávku <strong><?= $refId ?></strong> nebyla dokončena.</p>
    <p class="big-text">Můžete to zkusit znovu nebo nás kontaktovat.</p>
    <p>
        <a href="/eshop/loxone/balicky/" class="btn small-text pix-white" style="background-color: #b5e126; color: #000; padding: 12px 30px; font-weight: 700;">Zpět do e-shopu</a>
        <a href="/kontakt" class="btn small-text" style="border: 2px solid #b5e126; color: #b5e126; padding: 10px 30px; font-weight: 700; margin-left: 10px;">Kontaktujte nás</a>
    </p>

<?php elseif ($status === 'no_gateway'): ?>
    <div class="status-icon status-pending"><i class="fa fa-info-circle"></i></div>
    <h1 class="pix-black-gray-dark">Objednávka přijata</h1>
    <p class="big-text">Vaše objednávka <strong><?= $refId ?></strong> byla přijata.</p>
    <p class="big-text">Platební brána ještě není aktivní. Budeme vás kontaktovat s pokyny k platbě.</p>
    <p><a href="/" class="btn small-text pix-white" style="background-color: #b5e126; color: #000; padding: 12px 30px; font-weight: 700;">Zpět na hlavní stránku</a></p>

<?php else: ?>
    <div class="status-icon status-error"><i class="fa fa-exclamation-circle"></i></div>
    <h1 class="pix-black-gray-dark">Chyba při zpracování platby</h1>
    <p class="big-text">Při zpracování platby došlo k chybě. Zkuste to prosím znovu nebo nás kontaktujte.</p>
    <p>
        <a href="/eshop/loxone/balicky/" class="btn small-text pix-white" style="background-color: #b5e126; color: #000; padding: 12px 30px; font-weight: 700;">Zpět do e-shopu</a>
        <a href="/kontakt" class="btn small-text" style="border: 2px solid #b5e126; color: #b5e126; padding: 10px 30px; font-weight: 700; margin-left: 10px;">Kontaktujte nás</a>
    </p>
<?php endif; ?>

</div>
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

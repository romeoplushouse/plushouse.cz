<?php

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

    $mail_type = 'smtp';
    //-----------------------------------------------------------------------------------------
    $to_Email       = "tonda@plushouse.cz"; //Replace with recipient email address
    $subject        = 'Formular'; //Subject line for emails

    // your recaptcha secret key
    $secret = getenv('RECAPTCHA_SECRET') ?: "";
    //-----------------------------------------------------------------------------------------

    // Language
    $language = "EN";



    // SMTP Settings
    define('SMTP_HOST', getenv('SMTP_HOST') ?: 'wes1-smtp.wedos.net');
    define('SMTP_USER', getenv('SMTP_USER') ?: 'tonda@plushouse.cz');
    define('SMTP_PASS', getenv('SMTP_PASS') ?: '');


    /* Mailchimp setting. */
    define('MC_APIKEY', getenv('MC_APIKEY') ?: '');

    /* Campaign Monitor setting. */
    define('CM_APIKEY', '');

    /* GetResponse setting. */
    define('GR_APIKEY', '');

    /* AWeber setting */
    define('AW_AUTHCODE', '');

    /* ActiveCampaign setting */
    define("ACTIVECAMPAIGN_URL", "");
    define("ACTIVECAMPAIGN_API_KEY", "");

    /* MailerLite setting */
    define("MailerLite_API_KEY", "");

    /* FreshMail setting */
    define ( 'FM_API_KEY', '' );
    define ( 'FM_API_SECRET', '' );

    /* Sendloop setting */
    define("Sendloop_API3_KEY", '');
    define("Sendloop_SUBDOMAIN", '');


    /* MailWizz setting */
    define("Mailwizz_apiUrl", '');
    define("Mailwizz_publicKey", '');
	define("Mailwizz_privateKey", '');

	/* Sendy setting */
    define("Sendy_URL", '');
    define("Sendy_apikey", '');

    /* Hubspot setting */
    define("Hubspot_api", '');

    /* iContact setting */
    define("iContact_appId", '');
    define("iContact_apiPassword", '');
    define("iContact_apiUsername", '');

?>

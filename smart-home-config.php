<?php
error_reporting(E_ALL);
ini_set("log_errors", 1);
ini_set("error_log", dirname(__FILE__) . "/php-error.log");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    include("config.php");

    header('Expires: 0');
    header('Cache-Control: no-cache, must-revalidate, post-check=0, pre-check=0');
    header('Pragma: no-cache');
    header('Content-Type: application/json; charset=utf-8');

    if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {
        die(json_encode(array('type' => 'error', 'text' => 'Request must come from Ajax')));
    }

    $action = isset($_POST['action']) ? trim($_POST['action']) : '';
    if (!in_array($action, array('save', 'consult'))) {
        die(json_encode(array('type' => 'error', 'text' => 'Neplatná akce.')));
    }

    // Building info
    $building_type = isset($_POST['building_type']) ? trim($_POST['building_type']) : '';
    $area = isset($_POST['area']) ? intval($_POST['area']) : 0;
    $floors = isset($_POST['floors']) ? trim($_POST['floors']) : '';
    $rooms = isset($_POST['rooms']) ? intval($_POST['rooms']) : 0;
    $phase = isset($_POST['phase']) ? trim($_POST['phase']) : '';
    $location = isset($_POST['location']) ? trim($_POST['location']) : '';
    $notes = isset($_POST['notes']) ? trim($_POST['notes']) : '';

    // Selected features
    $features_json = isset($_POST['features']) ? $_POST['features'] : '[]';
    $features = json_decode($features_json, true);
    if (!is_array($features)) $features = array();

    // Server-side price calculation (ignore client-supplied values)
    $price_ranges = array(
        'heating' => array(25000, 45000), 'cooling' => array(20000, 35000),
        'heat_pump' => array(15000, 25000), 'recuperation' => array(15000, 25000),
        'photovoltaics' => array(30000, 50000), 'battery' => array(20000, 40000),
        'energy_monitor' => array(8000, 15000), 'ev_charger' => array(15000, 30000),
        'irrigation' => array(12000, 22000), 'water_leak' => array(8000, 15000),
        'hot_water' => array(10000, 18000), 'smart_lights' => array(20000, 40000),
        'outdoor_lights' => array(12000, 22000), 'light_scenes' => array(8000, 15000),
        'cameras' => array(25000, 50000), 'alarm' => array(20000, 35000),
        'access' => array(15000, 30000), 'doorbell' => array(8000, 18000),
        'blinds' => array(18000, 35000), 'multiroom' => array(25000, 50000),
        'cinema' => array(30000, 60000), 'voice' => array(10000, 20000)
    );
    $price_min = 0;
    $price_max = 0;
    foreach ($features as $f) {
        if (isset($price_ranges[$f])) {
            $price_min += $price_ranges[$f][0];
            $price_max += $price_ranges[$f][1];
        }
    }
    $area_multiplier = max(1.0, $area / 100);
    $price_min = round($price_min * $area_multiplier);
    $price_max = round($price_max * $area_multiplier);

    // Newsletter consent
    $newsletter = isset($_POST['newsletter_consent']) && $_POST['newsletter_consent'] === '1';

    // Feature labels
    $feature_labels = array(
        'heating' => 'Řízení vytápění', 'cooling' => 'Klimatizace a chlazení',
        'heat_pump' => 'Tepelné čerpadlo', 'recuperation' => 'Rekuperace',
        'photovoltaics' => 'Fotovoltaika - řízení', 'battery' => 'Bateriové úložiště',
        'energy_monitor' => 'Monitoring spotřeby', 'ev_charger' => 'Nabíjecí stanice EV',
        'irrigation' => 'Řízení zavlažování', 'water_leak' => 'Detekce úniku vody',
        'hot_water' => 'Ohřev teplé vody', 'smart_lights' => 'Inteligentní osvětlení',
        'outdoor_lights' => 'Venkovní osvětlení', 'light_scenes' => 'Světelné scény',
        'cameras' => 'Kamerový systém', 'alarm' => 'Alarm a zabezpečení',
        'access' => 'Přístupový systém', 'doorbell' => 'Videozvonky',
        'blinds' => 'Ovládání žaluzií/rolet', 'multiroom' => 'Multiroom audio',
        'cinema' => 'Domácí kino', 'voice' => 'Hlasové ovládání'
    );

    $building_types = array('new' => 'Novostavba', 'reconstruction' => 'Rekonstrukce', 'commercial' => 'Komerční budova', 'apartment' => 'Bytový dům');
    $phases = array('project' => 'Projektová příprava', 'rough' => 'Hrubá stavba', 'finishing' => 'Před dokončením', 'done' => 'Hotová stavba');
    $building_label = isset($building_types[$building_type]) ? $building_types[$building_type] : $building_type;
    $phase_label = isset($phases[$phase]) ? $phases[$phase] : $phase;
    $price_str = number_format($price_min, 0, ',', ' ') . ' - ' . number_format($price_max, 0, ',', ' ') . ' Kč';

    $features_html = '';
    foreach ($features as $f) {
        $label = isset($feature_labels[$f]) ? $feature_labels[$f] : $f;
        $features_html .= '<li style="padding:4px 0;">' . htmlspecialchars($label) . '</li>';
    }

    // Create storage directory
    $dir_name = date('Ymd_His') . '_' . substr(md5(uniqid()), 0, 8);
    $upload_dir = dirname(__FILE__) . '/public/data/smart-home-configs/' . $dir_name;
    if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);

    // Handle file uploads
    $uploaded_files = array();
    if (isset($_FILES['documents']) && !empty($_FILES['documents']['name'][0])) {
        $allowed_ext = array('pdf', 'dwg', 'jpg', 'jpeg', 'png', 'zip', 'doc', 'docx');
        $total_size = 0;
        for ($i = 0; $i < count($_FILES['documents']['name']); $i++) {
            if ($_FILES['documents']['error'][$i] === UPLOAD_ERR_OK) {
                $orig_name = $_FILES['documents']['name'][$i];
                $ext = strtolower(pathinfo($orig_name, PATHINFO_EXTENSION));
                $size = $_FILES['documents']['size'][$i];
                $total_size += $size;
                if ($total_size > 25 * 1024 * 1024) {
                    die(json_encode(array('type' => 'error', 'text' => 'Celková velikost souborů překračuje 25 MB.')));
                }
                if (!in_array($ext, $allowed_ext)) {
                    die(json_encode(array('type' => 'error', 'text' => 'Nepodporovaný formát: ' . $orig_name)));
                }
                $safe_name = $i . '_' . substr(md5(uniqid(mt_rand(), true)), 0, 6) . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $orig_name);
                if (move_uploaded_file($_FILES['documents']['tmp_name'][$i], $upload_dir . '/' . $safe_name)) {
                    $uploaded_files[] = array('name' => $orig_name, 'size' => $size, 'disk_name' => $safe_name);
                }
            }
        }
    }

    // --- ACTION: SAVE ---
    if ($action === 'save') {
        $save_email = isset($_POST['save_email']) ? trim($_POST['save_email']) : '';
        if (!filter_var($save_email, FILTER_VALIDATE_EMAIL)) {
            die(json_encode(array('type' => 'error', 'text' => 'Zadejte prosím platný email.')));
        }

        // Save CRM entry
        $crm_data = array(
            'timestamp' => date('c'), 'ip' => $_SERVER['REMOTE_ADDR'],
            'action' => 'save', 'email' => $save_email,
            'newsletter_consent' => $newsletter,
            'building' => array('type' => $building_type, 'area_m2' => $area, 'floors' => $floors, 'rooms' => $rooms, 'phase' => $phase, 'location' => $location, 'notes' => $notes),
            'features' => $features,
            'price_estimate' => array('min' => $price_min, 'max' => $price_max),
            'uploaded_files' => $uploaded_files, 'status' => 'saved'
        );
        file_put_contents($upload_dir . '/config-data.json', json_encode($crm_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        // Send config email to user
        $client_body = buildConfigEmail($save_email, $building_label, $area, $location, $phase_label, $floors, $features_html, $price_str, false);

        require 'phpmailer/PHPMailerAutoload.php';
        $mail = new PHPMailer;
        $mail->isSMTP();
        $mail->Host = SMTP_HOST; $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER; $mail->Password = SMTP_PASS;
        $mail->SMTPSecure = 'tls'; $mail->Port = 587; $mail->CharSet = 'UTF-8';

        $to_emails = explode(',', str_replace(' ', '', $to_Email));
        $mail->setFrom($to_emails[0], 'Můj dům - PLUS HOUSE');
        $mail->addAddress($save_email);
        $mail->addReplyTo($to_emails[0], 'PLUS HOUSE');
        $mail->isHTML(true);
        $mail->Subject = 'Vase konfigurace Muj dum - PLUS HOUSE';
        $mail->Body = $client_body;
        $mail->AltBody = "Vase konfigurace Muj dum byla ulozena.\nOrientacni cena: $price_str\n\nPLUS HOUSE | info@plushouse.cz | +420 734 38 48 58";

        if (!$mail->send()) {
            die(json_encode(array('type' => 'error', 'text' => 'Chyba při odesílání emailu: ' . $mail->ErrorInfo)));
        }

        // Notify admin (lightweight - no attachment for save)
        $mail2 = new PHPMailer;
        $mail2->isSMTP();
        $mail2->Host = SMTP_HOST; $mail2->SMTPAuth = true;
        $mail2->Username = SMTP_USER; $mail2->Password = SMTP_PASS;
        $mail2->SMTPSecure = 'tls'; $mail2->Port = 587; $mail2->CharSet = 'UTF-8';
        $mail2->setFrom($to_emails[0], 'Muj dum Konfigurator');
        foreach ($to_emails as $e) $mail2->addAddress(trim($e));
        $mail2->addReplyTo($save_email);
        $mail2->isHTML(true);
        $mail2->Subject = 'Muj dum - ulozena konfigurace (' . htmlspecialchars($save_email) . ')' . ($newsletter ? ' [NEWSLETTER]' : '');
        $mail2->Body = '<div style="font-family:Arial,sans-serif;max-width:600px;">'
            . '<h2 style="color:#B5E126;">Uložená konfigurace</h2>'
            . '<p><strong>Email:</strong> ' . htmlspecialchars($save_email) . '</p>'
            . '<p><strong>Newsletter souhlas:</strong> ' . ($newsletter ? 'ANO' : 'NE') . '</p>'
            . '<p><strong>Stavba:</strong> ' . htmlspecialchars($building_label) . ', ' . $area . ' m², ' . htmlspecialchars($location) . '</p>'
            . '<p><strong>Funkce:</strong></p><ul>' . $features_html . '</ul>'
            . '<p><strong>Cena:</strong> ' . $price_str . '</p>'
            . '<p style="color:#999;font-size:12px;">CRM: ' . $dir_name . '</p></div>';
        $mail2->send();

        die(json_encode(array('type' => 'message', 'text' => 'Konfigurace byla uložena a odeslána na váš email.')));
    }

    // --- ACTION: CONSULT ---
    if ($action === 'consult') {
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
        $contact_pref = isset($_POST['contact_preference']) ? trim($_POST['contact_preference']) : 'both';
        $consult_note = isset($_POST['consult_note']) ? trim($_POST['consult_note']) : '';

        if (empty($name) || empty($email) || empty($phone)) {
            die(json_encode(array('type' => 'error', 'text' => 'Vyplňte prosím všechna povinná pole.')));
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            die(json_encode(array('type' => 'error', 'text' => 'Zadejte prosím platný email.')));
        }

        // Save CRM entry
        $crm_data = array(
            'timestamp' => date('c'), 'ip' => $_SERVER['REMOTE_ADDR'],
            'action' => 'consult',
            'contact' => array('name' => $name, 'email' => $email, 'phone' => $phone, 'contact_preference' => $contact_pref, 'consult_note' => $consult_note),
            'newsletter_consent' => $newsletter,
            'building' => array('type' => $building_type, 'area_m2' => $area, 'floors' => $floors, 'rooms' => $rooms, 'phase' => $phase, 'location' => $location, 'notes' => $notes),
            'features' => $features,
            'price_estimate' => array('min' => $price_min, 'max' => $price_max),
            'uploaded_files' => $uploaded_files, 'status' => 'consultation_requested'
        );
        file_put_contents($upload_dir . '/config-data.json', json_encode($crm_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        require 'phpmailer/PHPMailerAutoload.php';

        // Admin notification (full details + attachments)
        $admin_body = '<div style="font-family:Montserrat,Arial,sans-serif;max-width:600px;margin:0 auto;">'
            . '<div style="background:#000;padding:20px;text-align:center;"><h1 style="color:#B5E126;margin:0;">Žádost o konzultaci — Můj dům</h1></div>'
            . '<div style="padding:20px;background:#f9f9f9;">'
            . '<h2 style="color:#333;">Kontakt</h2>'
            . '<table style="width:100%;border-collapse:collapse;">'
            . '<tr><td style="padding:5px;font-weight:bold;">Jméno:</td><td>' . htmlspecialchars($name) . '</td></tr>'
            . '<tr><td style="padding:5px;font-weight:bold;">Email:</td><td>' . htmlspecialchars($email) . '</td></tr>'
            . '<tr><td style="padding:5px;font-weight:bold;">Telefon:</td><td>' . htmlspecialchars($phone) . '</td></tr>'
            . '<tr><td style="padding:5px;font-weight:bold;">Preferovaný kontakt:</td><td>' . htmlspecialchars($contact_pref) . '</td></tr>'
            . '<tr><td style="padding:5px;font-weight:bold;">Newsletter:</td><td>' . ($newsletter ? 'ANO' : 'NE') . '</td></tr>'
            . '</table>'
            . ($consult_note ? '<p style="margin-top:10px;"><strong>Poznámka:</strong> ' . nl2br(htmlspecialchars($consult_note)) . '</p>' : '')
            . '<h2 style="color:#333;margin-top:20px;">Stavba</h2>'
            . '<table style="width:100%;border-collapse:collapse;">'
            . '<tr><td style="padding:5px;font-weight:bold;">Typ:</td><td>' . htmlspecialchars($building_label) . '</td></tr>'
            . '<tr><td style="padding:5px;font-weight:bold;">Plocha:</td><td>' . $area . ' m²</td></tr>'
            . '<tr><td style="padding:5px;font-weight:bold;">Podlaží:</td><td>' . htmlspecialchars($floors) . '</td></tr>'
            . '<tr><td style="padding:5px;font-weight:bold;">Místností:</td><td>' . $rooms . '</td></tr>'
            . '<tr><td style="padding:5px;font-weight:bold;">Fáze:</td><td>' . htmlspecialchars($phase_label) . '</td></tr>'
            . '<tr><td style="padding:5px;font-weight:bold;">Lokalita:</td><td>' . htmlspecialchars($location) . '</td></tr>'
            . '</table>'
            . ($notes ? '<p><strong>Poznámky:</strong> ' . nl2br(htmlspecialchars($notes)) . '</p>' : '')
            . '<h2 style="color:#333;margin-top:20px;">Vybrané technologie</h2><ul style="list-style:none;padding:0;">' . $features_html . '</ul>'
            . '<div style="background:#B5E126;padding:15px;margin-top:20px;text-align:center;"><h2 style="margin:0;color:#000;">Orientační cena: ' . $price_str . '</h2></div>'
            . '<p style="margin-top:20px;color:#666;font-size:12px;">CRM: ' . $dir_name . '</p>'
            . '</div></div>';

        $mail = new PHPMailer;
        $mail->isSMTP();
        $mail->Host = SMTP_HOST; $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER; $mail->Password = SMTP_PASS;
        $mail->SMTPSecure = 'tls'; $mail->Port = 587; $mail->CharSet = 'UTF-8';

        $to_emails = explode(',', str_replace(' ', '', $to_Email));
        $mail->setFrom($to_emails[0], 'Muj dum Konfigurator');
        foreach ($to_emails as $e) $mail->addAddress(trim($e));
        $mail->addReplyTo($email, $name);
        $mail->isHTML(true);
        $mail->Subject = 'KONZULTACE - Muj dum - ' . $name . ($newsletter ? ' [NEWSLETTER]' : '');
        $mail->Body = $admin_body;

        // Attach uploaded files
        foreach ($uploaded_files as $uf) {
            $filepath = $upload_dir . '/' . $uf['disk_name'];
            if (file_exists($filepath)) $mail->addAttachment($filepath, $uf['name']);
        }

        if (!$mail->send()) {
            die(json_encode(array('type' => 'error', 'text' => 'Chyba při odesílání: ' . $mail->ErrorInfo)));
        }

        // Client confirmation
        $client_body = buildConfigEmail($name, $building_label, $area, $location, $phase_label, $floors, $features_html, $price_str, true);

        $mail2 = new PHPMailer;
        $mail2->isSMTP();
        $mail2->Host = SMTP_HOST; $mail2->SMTPAuth = true;
        $mail2->Username = SMTP_USER; $mail2->Password = SMTP_PASS;
        $mail2->SMTPSecure = 'tls'; $mail2->Port = 587; $mail2->CharSet = 'UTF-8';
        $mail2->setFrom($to_emails[0], 'PLUS HOUSE');
        $mail2->addAddress($email, $name);
        $mail2->addReplyTo($to_emails[0], 'PLUS HOUSE');
        $mail2->isHTML(true);
        $mail2->Subject = 'Potvrzeni zadosti o konzultaci - PLUS HOUSE';
        $mail2->Body = $client_body;
        $mail2->AltBody = "Dobry den, $name,\n\nDekujeme za Vas zajem. Nas specialista se Vam ozve do 24 hodin.\n\nOrientacni cena: $price_str\n\nS pozdravem,\nTym PLUS HOUSE\ninfo@plushouse.cz | +420 734 38 48 58";
        $mail2->send();

        die(json_encode(array('type' => 'message', 'text' => 'Žádost o konzultaci byla úspěšně odeslána. Ozveme se vám do 24 hodin.')));
    }
}

function buildConfigEmail($nameOrEmail, $building_label, $area, $location, $phase_label, $floors, $features_html, $price_str, $isConsult) {
    $greeting = $isConsult ? 'Dobrý den, ' . htmlspecialchars($nameOrEmail) . ',' : 'Dobrý den,';
    $main_text = $isConsult
        ? 'děkujeme za váš zájem o konzultaci. Vaši konfiguraci jsme přijali a náš specialista se vám <strong>ozve do 24 hodin</strong>, aby s vámi prošel možnosti pro váš dům.'
        : 'vaše konfigurace „Můj dům" byla úspěšně uložena. Níže najdete přehled vašeho nastavení. Kdykoliv se můžete vrátit a zažádat o nezávaznou konzultaci.';

    return '
    <div style="font-family:Montserrat,Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#000;padding:30px;text-align:center;">
            <h1 style="color:#B5E126;margin:0;font-size:24px;">MŮJ DŮM</h1>
            <p style="color:#888;margin:5px 0 0;font-size:13px;">powered by PLUS HOUSE</p>
        </div>
        <div style="padding:30px;background:#ffffff;">
            <h2 style="color:#333;">' . $greeting . '</h2>
            <p style="color:#555;line-height:1.6;">' . $main_text . '</p>
            <div style="background:#f5f5f5;padding:20px;margin:20px 0;border-left:4px solid #B5E126;">
                <h3 style="margin:0 0 10px;color:#333;">Přehled konfigurace</h3>
                <p style="margin:5px 0;"><strong>Typ stavby:</strong> ' . htmlspecialchars($building_label) . '</p>
                <p style="margin:5px 0;"><strong>Plocha:</strong> ' . $area . ' m²</p>
                <p style="margin:5px 0;"><strong>Podlaží:</strong> ' . htmlspecialchars($floors) . '</p>
                <p style="margin:5px 0;"><strong>Lokalita:</strong> ' . htmlspecialchars($location) . '</p>
                <p style="margin:10px 0 5px;"><strong>Vybrané technologie:</strong></p>
                <ul style="padding-left:20px;color:#555;">' . $features_html . '</ul>
            </div>
            <div style="background:#000;padding:20px;text-align:center;margin:20px 0;">
                <p style="color:#B5E126;font-size:18px;margin:0;font-weight:bold;">Orientační cena: ' . $price_str . '</p>
                <p style="color:#aaa;font-size:12px;margin:5px 0 0;">*Nezávazný odhad — přesná cena závisí na konkrétním řešení</p>
            </div>
            <p style="color:#555;line-height:1.6;">
                V případě dotazů nás neváhejte kontaktovat na
                <a href="mailto:info@plushouse.cz" style="color:#B5E126;">info@plushouse.cz</a>
                nebo <a href="tel:+420734384858" style="color:#B5E126;">+420 734 38 48 58</a>.
            </p>
            <p style="color:#555;">S pozdravem,<br><strong>Tým PLUS HOUSE</strong></p>
        </div>
        <div style="background:#222;padding:20px;text-align:center;">
            <p style="color:#888;font-size:12px;margin:0;">
                PLUS HOUSE s.r.o. | Mladeč 61, 783 21 | IČ: 09648852<br>
                <a href="https://www.plushouse.cz" style="color:#B5E126;">www.plushouse.cz</a>
            </p>
        </div>
    </div>';
}
?>

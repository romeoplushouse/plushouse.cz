(function($) {
    'use strict';

    var currentStep = 1;
    var totalSteps = 4;
    var uploadedFiles = [];
    var maxUploadSize = 25 * 1024 * 1024; // 25MB
    var currentSubStep = null; // 'save' or 'consult'

    // Price ranges per feature [min, max]
    var priceRanges = {
        'heating': [25000, 45000],
        'cooling': [20000, 35000],
        'heat_pump': [15000, 25000],
        'recuperation': [15000, 25000],
        'photovoltaics': [30000, 50000],
        'battery': [20000, 40000],
        'energy_monitor': [8000, 15000],
        'ev_charger': [15000, 30000],
        'irrigation': [12000, 22000],
        'water_leak': [8000, 15000],
        'hot_water': [10000, 18000],
        'smart_lights': [20000, 40000],
        'outdoor_lights': [12000, 22000],
        'light_scenes': [8000, 15000],
        'cameras': [25000, 50000],
        'alarm': [20000, 35000],
        'access': [15000, 30000],
        'doorbell': [8000, 18000],
        'blinds': [18000, 35000],
        'multiroom': [25000, 50000],
        'cinema': [30000, 60000],
        'voice': [10000, 20000]
    };

    var featureLabels = {
        'heating': 'Řízení vytápění',
        'cooling': 'Klimatizace a chlazení',
        'heat_pump': 'Tepelné čerpadlo',
        'recuperation': 'Rekuperace',
        'photovoltaics': 'Fotovoltaika - řízení',
        'battery': 'Bateriové úložiště',
        'energy_monitor': 'Monitoring spotřeby',
        'ev_charger': 'Nabíjecí stanice EV',
        'irrigation': 'Řízení zavlažování',
        'water_leak': 'Detekce úniku vody',
        'hot_water': 'Ohřev teplé vody',
        'smart_lights': 'Inteligentní osvětlení',
        'outdoor_lights': 'Venkovní osvětlení',
        'light_scenes': 'Světelné scény',
        'cameras': 'Kamerový systém',
        'alarm': 'Alarm a zabezpečení',
        'access': 'Přístupový systém',
        'doorbell': 'Videozvonky',
        'blinds': 'Ovládání žaluzií/rolet',
        'multiroom': 'Multiroom audio',
        'cinema': 'Domácí kino',
        'voice': 'Hlasové ovládání'
    };

    function init() {
        showStep(1);
        bindNavigation();
        bindFeatureCards();
        bindFileUpload();
        bindActions();
    }

    // --- Step Navigation ---
    function showStep(step) {
        currentStep = step;
        currentSubStep = null;
        $('.shc-step').hide();
        $('#shc-step-' + step).fadeIn(300);

        // Update progress bar
        $('.shc-progress-step').removeClass('active completed');
        for (var i = 1; i <= totalSteps; i++) {
            var $el = $('.shc-progress-step[data-step="' + i + '"]');
            if (i < step) $el.addClass('completed');
            else if (i === step) $el.addClass('active');
        }

        // Update nav buttons
        $('#shc-btn-prev').toggle(step > 1);
        $('#shc-btn-next').toggle(step < totalSteps);
        $('.shc-nav-buttons').toggle(step <= totalSteps && !currentSubStep);

        if (step === totalSteps) {
            $('#shc-btn-next').hide();
            updateSummary();
        }

        $('html, body').animate({ scrollTop: $('#shc-configurator').offset().top - 80 }, 300);
    }

    function showSubStep(type) {
        currentSubStep = type;
        $('.shc-step').hide();
        $('.shc-nav-buttons').hide();
        $('#shc-step-' + type).fadeIn(300);
        $('html, body').animate({ scrollTop: $('#shc-configurator').offset().top - 80 }, 300);
    }

    function bindNavigation() {
        $('#shc-btn-next').on('click', function() {
            if (validateStep(currentStep)) {
                showStep(currentStep + 1);
            }
        });
        $('#shc-btn-prev').on('click', function() {
            showStep(currentStep - 1);
        });
        $('.shc-progress-step').on('click', function() {
            var target = parseInt($(this).data('step'));
            if (target < currentStep) {
                showStep(target);
            } else if (target === currentStep + 1 && validateStep(currentStep)) {
                showStep(target);
            }
        });
    }

    // --- Validation ---
    function validateStep(step) {
        var valid = true;
        $('.shc-error').remove();

        if (step === 1) {
            var requiredFields = ['building_type', 'area', 'floors', 'phase', 'location'];
            requiredFields.forEach(function(field) {
                var $field = $('[name="' + field + '"]');
                var val = $field.val();
                if (!val || val === '') {
                    showError($field, 'Toto pole je povinné');
                    valid = false;
                }
            });
            var area = parseInt($('[name="area"]').val());
            if (area && (area < 10 || area > 10000)) {
                showError($('[name="area"]'), 'Zadejte plochu 10 - 10 000 m²');
                valid = false;
            }
        } else if (step === 3) {
            var selected = getSelectedFeatures();
            if (selected.length === 0) {
                showError($('.shc-feature-category').first(), 'Vyberte alespoň jednu technologii');
                valid = false;
            }
        }
        return valid;
    }

    function validateSave() {
        var valid = true;
        $('.shc-error').remove();
        var email = $('[name="save_email"]').val();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError($('[name="save_email"]'), 'Zadejte platný email');
            valid = false;
        }
        if (!$('[name="consent_save"]').is(':checked')) {
            showError($('[name="consent_save"]').parent(), 'Souhlas je povinný');
            valid = false;
        }
        return valid;
    }

    function validateConsult() {
        var valid = true;
        $('.shc-error').remove();
        var name = $('[name="name"]').val();
        var email = $('[name="email"]').val();
        var phone = $('[name="phone"]').val();

        if (!name || name.trim() === '') {
            showError($('[name="name"]'), 'Vyplňte jméno a příjmení');
            valid = false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError($('[name="email"]'), 'Zadejte platný email');
            valid = false;
        }
        if (!phone || phone.replace(/\s/g, '').length < 9) {
            showError($('[name="phone"]'), 'Zadejte platné telefonní číslo');
            valid = false;
        }
        if (!$('[name="consent_consult"]').is(':checked')) {
            showError($('[name="consent_consult"]').parent(), 'Souhlas je povinný');
            valid = false;
        }
        return valid;
    }

    function showError($el, msg) {
        var $err = $('<div class="shc-error" style="color:#e74c3c;font-size:13px;margin-top:4px;">' + msg + '</div>');
        $el.closest('.form-group, .shc-feature-category, .shc-consent-wrap').append($err);
        $el.closest('.form-group').find('.form-control').css('border-color', '#e74c3c');
        setTimeout(function() {
            $el.closest('.form-group').find('.form-control').css('border-color', '');
        }, 3000);
    }

    // --- Feature Cards ---
    function bindFeatureCards() {
        $(document).on('click', '.shc-feature-card', function() {
            $(this).toggleClass('selected');
            $(this).find('input[type="checkbox"]').prop('checked', $(this).hasClass('selected'));
            updatePriceEstimate();
        });
    }

    function getSelectedFeatures() {
        var selected = [];
        $('.shc-feature-card.selected').each(function() {
            selected.push($(this).data('feature'));
        });
        return selected;
    }

    // --- Price Estimation ---
    function updatePriceEstimate() {
        var selected = getSelectedFeatures();
        var totalMin = 0;
        var totalMax = 0;

        selected.forEach(function(feature) {
            if (priceRanges[feature]) {
                totalMin += priceRanges[feature][0];
                totalMax += priceRanges[feature][1];
            }
        });

        var area = parseInt($('[name="area"]').val()) || 100;
        var multiplier = Math.max(1.0, area / 100);
        totalMin = Math.round(totalMin * multiplier);
        totalMax = Math.round(totalMax * multiplier);

        var priceText = selected.length > 0
            ? formatPrice(totalMin) + ' - ' + formatPrice(totalMax) + ' Kč'
            : '---';

        $('#shc-price-estimate, #shc-price-estimate-summary').text(priceText);
        $('#shc-price-min').val(totalMin);
        $('#shc-price-max').val(totalMax);
    }

    function formatPrice(n) {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // --- File Upload ---
    function bindFileUpload() {
        var $zone = $('#shc-drop-zone');
        var $input = $('#shc-file-input');

        $zone.on('click', function() { $input.trigger('click'); });
        $input.on('change', function() { handleFiles(this.files); });

        $zone.on('dragover', function(e) {
            e.preventDefault(); e.stopPropagation();
            $(this).addClass('drag-over');
        });
        $zone.on('dragleave drop', function(e) {
            e.preventDefault(); e.stopPropagation();
            $(this).removeClass('drag-over');
        });
        $zone.on('drop', function(e) {
            handleFiles(e.originalEvent.dataTransfer.files);
        });
    }

    function handleFiles(files) {
        var allowedExt = ['pdf', 'dwg', 'jpg', 'jpeg', 'png', 'zip', 'doc', 'docx'];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var ext = file.name.split('.').pop().toLowerCase();
            if (allowedExt.indexOf(ext) === -1) {
                alert('Nepodporovaný formát: ' + file.name + '\nPovolené: ' + allowedExt.join(', '));
                continue;
            }
            var totalSize = file.size;
            uploadedFiles.forEach(function(f) { totalSize += f.size; });
            if (totalSize > maxUploadSize) {
                alert('Celková velikost souborů překračuje 25 MB');
                break;
            }
            uploadedFiles.push(file);
        }
        renderFileList();
    }

    function renderFileList() {
        var $list = $('#shc-file-list');
        $list.empty();
        if (uploadedFiles.length === 0) { $list.hide(); return; }
        $list.show();
        uploadedFiles.forEach(function(file, idx) {
            var sizeKB = Math.round(file.size / 1024);
            $list.append(
                '<div class="shc-file-item">' +
                '<i class="fa fa-file-o"></i> ' +
                '<span>' + file.name + ' (' + sizeKB + ' KB)</span>' +
                '<a href="#" class="shc-file-remove" data-idx="' + idx + '"><i class="fa fa-times"></i></a>' +
                '</div>'
            );
        });
        $list.find('.shc-file-remove').on('click', function(e) {
            e.preventDefault();
            uploadedFiles.splice(parseInt($(this).data('idx')), 1);
            renderFileList();
        });
    }

    // --- Summary ---
    function updateSummary() {
        var selected = getSelectedFeatures();
        var $list = $('#shc-summary-features');
        $list.empty();
        selected.forEach(function(f) {
            $list.append('<li>' + (featureLabels[f] || f) + '</li>');
        });

        updatePriceEstimate();

        $('#shc-summary-building').html(
            '<li><strong>Typ:</strong> ' + $('[name="building_type"] option:selected').text() + '</li>' +
            '<li><strong>Plocha:</strong> ' + ($('[name="area"]').val() || '-') + ' m²</li>' +
            '<li><strong>Podlaží:</strong> ' + $('[name="floors"] option:selected').text() + '</li>' +
            '<li><strong>Fáze:</strong> ' + $('[name="phase"] option:selected').text() + '</li>' +
            '<li><strong>Lokalita:</strong> ' + ($('[name="location"]').val() || '-') + '</li>'
        );

        if (uploadedFiles.length > 0) {
            var html = '';
            uploadedFiles.forEach(function(f) { html += '<li>' + f.name + '</li>'; });
            $('#shc-summary-files').html(html);
            $('#shc-summary-files-wrap').show();
        } else {
            $('#shc-summary-files-wrap').hide();
        }
    }

    // --- Build FormData with config ---
    function buildFormData(action) {
        var formData = new FormData();
        formData.append('action', action);

        // Building info
        formData.append('building_type', $('[name="building_type"]').val());
        formData.append('area', $('[name="area"]').val());
        formData.append('floors', $('[name="floors"]').val());
        formData.append('rooms', $('[name="rooms"]').val() || 0);
        formData.append('phase', $('[name="phase"]').val());
        formData.append('location', $('[name="location"]').val());
        formData.append('notes', $('[name="notes"]').val());

        // Features & price
        formData.append('features', JSON.stringify(getSelectedFeatures()));
        formData.append('price_min', $('#shc-price-min').val() || 0);
        formData.append('price_max', $('#shc-price-max').val() || 0);

        // Files
        uploadedFiles.forEach(function(file) {
            formData.append('documents[]', file);
        });

        return formData;
    }

    // --- Actions (Save / Consult) ---
    function bindActions() {
        // Open save sub-step
        $('#shc-btn-save').on('click', function() {
            showSubStep('save');
        });

        // Open consult sub-step
        $('#shc-btn-consult').on('click', function() {
            showSubStep('consult');
        });

        // Back buttons
        $('#shc-btn-save-back, #shc-btn-consult-back').on('click', function() {
            showStep(4);
        });

        // After saving, user can also request consultation
        $('#shc-btn-after-save-consult').on('click', function(e) {
            e.preventDefault();
            $('#shc-thank-save').hide();
            $('#shc-configurator').show();
            showSubStep('consult');
        });

        // SAVE submit
        $('#shc-btn-save-submit').on('click', function() {
            if (!validateSave()) return;
            var $btn = $(this);
            $btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Ukládání...');

            var formData = buildFormData('save');
            formData.append('save_email', $('[name="save_email"]').val());
            formData.append('newsletter_consent', $('[name="newsletter_consent"]').is(':checked') ? '1' : '0');

            $.ajax({
                url: 'smart-home-config.php',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                dataType: 'json',
                success: function(resp) {
                    if (resp.type === 'message') {
                        $('#shc-configurator').hide();
                        $('#shc-thank-save').fadeIn(400);
                        $('html, body').animate({ scrollTop: $('#shc-thank-save').offset().top - 100 }, 300);
                        if (typeof gtag === 'function') gtag('event', 'config_saved', { event_category: 'muj_dum' });
                    } else {
                        alert(resp.text || 'Nastala chyba.');
                        $btn.prop('disabled', false).html('<i class="fa fa-check"></i> Uložit a odeslat');
                    }
                },
                error: function() {
                    alert('Chyba při komunikaci se serverem.');
                    $btn.prop('disabled', false).html('<i class="fa fa-check"></i> Uložit a odeslat');
                }
            });
        });

        // CONSULT submit
        $('#shc-btn-consult-submit').on('click', function() {
            if (!validateConsult()) return;
            var $btn = $(this);
            $btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Odesílání...');

            var formData = buildFormData('consult');
            formData.append('name', $('[name="name"]').val());
            formData.append('email', $('[name="email"]').val());
            formData.append('phone', $('[name="phone"]').val());
            formData.append('contact_preference', $('[name="contact_preference"]').val());
            formData.append('consult_note', $('[name="consult_note"]').val());
            formData.append('newsletter_consent', $('[name="newsletter_consent_consult"]').is(':checked') ? '1' : '0');

            $.ajax({
                url: 'smart-home-config.php',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                dataType: 'json',
                success: function(resp) {
                    if (resp.type === 'message') {
                        $('#shc-configurator').hide();
                        $('#shc-thank-consult').fadeIn(400);
                        $('html, body').animate({ scrollTop: $('#shc-thank-consult').offset().top - 100 }, 300);
                        if (typeof fbq === 'function') fbq('track', 'Lead');
                        if (typeof gtag === 'function') gtag('event', 'generate_lead', { event_category: 'muj_dum' });
                    } else {
                        alert(resp.text || 'Nastala chyba.');
                        $btn.prop('disabled', false).html('<i class="fa fa-paper-plane"></i> Odeslat žádost o konzultaci');
                    }
                },
                error: function() {
                    alert('Chyba při komunikaci se serverem.');
                    $btn.prop('disabled', false).html('<i class="fa fa-paper-plane"></i> Odeslat žádost o konzultaci');
                }
            });
        });
    }

    $(document).ready(init);

})(jQuery);

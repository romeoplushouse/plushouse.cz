(function () {
  var priceElements = document.querySelectorAll('[data-plan]');
  if (!priceElements.length) {
    return;
  }

  var fallback = document.getElementById('membershipFallback');
  var installRadios = document.querySelectorAll('input[name="membership_install"]');

  var planMap = {
    house_start: 'house_start',
    house_standard: 'house_standard',
    house_pro: 'house_pro'
  };

  function getInstallFactor() {
    var selected = document.querySelector('input[name="membership_install"]:checked');
    if (selected && selected.value === 'takeover') {
      return 1.3;
    }
    return 1;
  }

  function getPriceMode() {
    var params = new URLSearchParams(window.location.search);
    return (params.get('priceMode') || 'b2c').toLowerCase();
  }

  function formatPrice(value) {
    var formatted = new Intl.NumberFormat('cs-CZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
    return formatted + ' Kč / měsíc (bez DPH)';
  }

  function renderPrices(data) {
    var priceMode = getPriceMode();
    var factor = getInstallFactor();
    var rows = data && data.clenstvi ? data.clenstvi : [];
    if (!rows.length) {
      if (fallback) fallback.style.display = 'block';
      return;
    }

    priceElements.forEach(function (el) {
      var key = el.getAttribute('data-plan');
      var planKey = planMap[key];
      var row = rows.find(function (item) {
        return item.plan_key === planKey;
      });
      if (!row) {
        el.textContent = 'Cena není k dispozici';
        return;
      }
      var base = priceMode === 'b2b' ? Number(row.price_monthly_b2b) : Number(row.price_monthly_b2c);
      if (!Number.isFinite(base)) {
        el.textContent = 'Cena není k dispozici';
        return;
      }
      var finalPrice = Math.round(base * factor);
      el.textContent = formatPrice(finalPrice);
    });
  }

  function loadData() {
    fetch('/public/data/cenik.json', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Ceník nenalezen');
        }
        return response.json();
      })
      .then(function (data) {
        renderPrices(data);
      })
      .catch(function () {
        if (fallback) fallback.style.display = 'block';
      });
  }

  installRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      loadData();
    });
  });

  loadData();
})();

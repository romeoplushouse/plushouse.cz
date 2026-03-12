function $(id) {
  return document.getElementById(id);
}

function parseQuery() {
  var params = new URLSearchParams(window.location.search);
  return {
    pricing: params.get("pricing") || "/fve-configurator/configs/pricing.json",
    segment: params.get("segment") || "",
    version: params.get("v") || ""
  };
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  var num = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(num) ? num : 0;
}

function normalizeBool(value) {
  if (typeof value === "boolean") return value;
  var str = String(value).trim().toLowerCase();
  return str === "1" || str === "true" || str === "yes";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(value)) + " Kč";
}

function formatPercent(value) {
  return (value * 100).toFixed(0) + " %";
}

function sendHeight() {
  var height = document.documentElement.scrollHeight;
  if (window.parent) {
    window.parent.postMessage({ type: "FVE_CONFIG_HEIGHT", height: height }, "*");
  }
}

function debounce(fn, wait) {
  var timeout;
  return function () {
    var args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      fn.apply(null, args);
    }, wait);
  };
}

var state = {
  meta: {},
  items: {},
  systemRules: [],
  conditionalRules: [],
  regions: [],
  vatRules: [],
  segments: [],
  current: {
    segment: "",
    kwp: 5,
    hasBattery: false,
    regionCode: "",
    hasLps: false,
    isLiving: true,
    customerType: "B2C"
  }
};

function setAdminError(message) {
  var box = $("adminError");
  box.textContent = message;
  box.style.display = "block";
  sendHeight();
}

function clearAdminError() {
  var box = $("adminError");
  box.textContent = "";
  box.style.display = "none";
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeColumnName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "_");
}

function normalizeRows(rows) {
  return rows.map(function (row) {
    var next = {};
    Object.keys(row || {}).forEach(function (key) {
      next[normalizeColumnName(key)] = row[key];
    });
    return next;
  });
}

function mapItems(rows) {
  var items = {};
  rows.forEach(function (row) {
    var key = String(row.key || "").trim();
    if (!key) return;
    items[key] = {
      key: key,
      name: row.name || key,
      unit: row.unit || "",
      priceNet: toNumber(row.price_net),
      active: normalizeBool(row.active),
      wpPerPanel: toNumber(row.wp_per_panel),
      kwhPerModule: toNumber(row.kwh_per_module)
    };
  });
  return items;
}

function mapMeta(rows) {
  var meta = {};
  rows.forEach(function (row) {
    var key = String(row.key || "").trim();
    if (!key) return;
    meta[key] = row.value;
  });
  return meta;
}

function loadConfig(query) {
  return fetch(query.pricing, { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Ceník nenalezen: " + query.pricing);
      }
      return response.json();
    })
    .then(function (data) {
      var requiredSheets = [
        "Items",
        "SystemRules",
        "ConditionalRules",
        "Regions",
        "VATRules",
        "Segments",
        "Meta"
      ];
      requiredSheets.forEach(function (name) {
        ensure(Array.isArray(data[name]), "Chybí list: " + name);
      });

      state.items = mapItems(normalizeRows(data.Items || []));
      state.systemRules = normalizeRows(data.SystemRules || []);
      state.conditionalRules = normalizeRows(data.ConditionalRules || []);
      state.regions = normalizeRows(data.Regions || []);
      state.vatRules = normalizeRows(data.VATRules || []);
      state.segments = normalizeRows(data.Segments || []);
      state.meta = mapMeta(normalizeRows(data.Meta || []));

      var requiredKeys = [
        "lpsyes",
        "lpsno",
        "livinginprice",
        "nolivinginprice",
        "safety120Vpriceperkw",
        "SAFETY_120V_VICTRON_PCT_OVER10",
        "panel_basic",
        "structure"
      ];
      requiredKeys.forEach(function (key) {
        ensure(state.items[key], "Chybí položka v Items: " + key);
      });

      ensure(state.regions.some(function (row) { return normalizeBool(row.active); }), "Žádné aktivní kraje v Regions.");
      ensure(state.vatRules.length > 0, "Chybí VATRules.");
      ensure(state.segments.length > 0, "Chybí Segments.");
    });
}

function initUI(query) {
  var brandName = state.meta.company_name || "FVE konfigurátor";
  $("brandNameBadge").textContent = brandName;
  $("headline").textContent = "Konfigurátor fotovoltaiky";
  $("subhead").textContent = "Orientační kalkulace – ceny jsou bez DPH, finální nabídku připravíme individuálně.";

  var accent = state.meta.accent_color;
  if (accent) {
    document.documentElement.style.setProperty("--accent", accent);
  }
  if (state.meta.logo_url) {
    var logo = $("brandLogo");
    logo.src = state.meta.logo_url;
    logo.style.display = "block";
  }

  // Populate segment select – use first segment as default
  var segmentSelect = $("segment");
  segmentSelect.innerHTML = "";
  state.segments.forEach(function (row) {
    var option = document.createElement("option");
    option.value = row.segment;
    option.textContent = row.segment;
    segmentSelect.appendChild(option);
  });

  // Use query segment if it matches, otherwise use first segment
  var defaultSegment = state.segments[0] ? state.segments[0].segment : "";
  var matchedSegment = state.segments.find(function (row) {
    return row.segment === query.segment;
  });
  var initialSegment = matchedSegment ? query.segment : defaultSegment;
  segmentSelect.value = initialSegment;
  state.current.segment = initialSegment;

  var regionSelect = $("region");
  regionSelect.innerHTML = "<option value=\"\">Vyberte kraj</option>";
  state.regions.forEach(function (row) {
    if (!normalizeBool(row.active)) return;
    var option = document.createElement("option");
    option.value = row.region_code;
    option.textContent = row.region_name;
    regionSelect.appendChild(option);
  });

  // Set initial kWp range based on segment
  applySegmentLimits(initialSegment);

  // Default isLiving to true (checked)
  $("isLiving").checked = true;
  state.current.isLiving = true;

  var toggle = $("customerTypeToggle");
  toggle.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;
    toggle.querySelectorAll("button").forEach(function (btn) {
      btn.classList.toggle("active", btn === button);
    });
    state.current.customerType = button.dataset.value;
    render();
  });

  $("segment").addEventListener("change", function () {
    state.current.segment = segmentSelect.value;
    applySegmentLimits(state.current.segment);
    render();
  });

  $("kwpRange").addEventListener("input", function () {
    state.current.kwp = toNumber(this.value);
    $("kwpInput").value = state.current.kwp;
    render();
  });
  $("kwpInput").addEventListener("input", function () {
    state.current.kwp = toNumber(this.value);
    $("kwpRange").value = state.current.kwp;
    render();
  });

  $("hasBattery").addEventListener("change", function () {
    state.current.hasBattery = this.checked;
    render();
  });
  $("region").addEventListener("change", function () {
    state.current.regionCode = this.value;
    render();
  });
  $("hasLps").addEventListener("change", function () {
    state.current.hasLps = this.checked;
    render();
  });
  $("isLiving").addEventListener("change", function () {
    state.current.isLiving = this.checked;
    render();
  });
  $("sendBtn").addEventListener("click", handleSend);
}

function applySegmentLimits(segmentName) {
  var segRow = state.segments.find(function (row) { return row.segment === segmentName; });
  var minKwp = segRow ? Math.max(3, toNumber(segRow.min_kwp) || 3) : 3;
  var maxKwp = segRow ? Math.min(50, toNumber(segRow.max_kwp) || 50) : 50;

  $("kwpRange").min = minKwp;
  $("kwpRange").max = maxKwp;
  $("kwpInput").min = minKwp;
  $("kwpInput").max = maxKwp;

  // Clamp current kWp to new limits
  state.current.kwp = Math.min(Math.max(state.current.kwp, minKwp), maxKwp);
  $("kwpRange").value = state.current.kwp;
  $("kwpInput").value = state.current.kwp;
}

function computePanelCount(kwp) {
  var panelWp = toNumber(state.meta.panel_wp) || 450;
  return Math.ceil((kwp * 1000) / panelWp);
}

function computeBatteryModules(kwp) {
  // 1 module per ~5 kWp, minimum 1
  var kwhPerModule = toNumber(state.meta.battery_kwh_per_module) || 5.8;
  return Math.max(1, Math.ceil(kwp / kwhPerModule));
}

function computeConfig() {
  var errors = [];
  var segment = state.current.segment;
  var segRow = state.segments.find(function (row) { return row.segment === segment; });
  if (!segRow) {
    errors.push("Neznámý segment.");
  }
  var min = segRow ? Math.max(3, toNumber(segRow.min_kwp) || 3) : 3;
  var max = segRow ? Math.min(50, toNumber(segRow.max_kwp) || 50) : 50;

  var kwp = Math.min(Math.max(state.current.kwp, min), max);
  state.current.kwp = kwp;
  $("kwpRange").value = kwp;
  $("kwpInput").value = kwp;

  var system = state.current.hasBattery ? "victron_with_battery" : "fronius_no_battery";

  var items = [];
  var netTotal = 0;

  function addLine(item) {
    items.push(item);
    netTotal += item.lineTotalNet;
  }

  // --- Dynamic panel count ---
  var panelCount = computePanelCount(kwp);
  var panelItem = state.items["panel_basic"];
  addLine({
    key: "panel_basic",
    label: panelItem.name,
    unit: panelItem.unit,
    qty: panelCount,
    unitPriceNet: panelItem.priceNet,
    lineTotalNet: panelCount * panelItem.priceNet
  });

  // --- SystemRules: inverter + installation (matched by kWp range) ---
  var matchedSystemRules = state.systemRules.filter(function (row) {
    return row.system === system &&
      kwp >= toNumber(row.range_from_kwp) &&
      kwp <= toNumber(row.range_to_kwp);
  });
  if (matchedSystemRules.length === 0) {
    errors.push("Nenalezený střídač/měnič pro " + kwp + " kWp.");
  } else {
    matchedSystemRules.forEach(function (row) {
      var key = String(row.key || "").trim();
      var item = state.items[key];
      if (!item) {
        errors.push("Chybí položka: " + key);
        return;
      }
      var qty = toNumber(row.qty);
      addLine({
        key: key,
        label: item.name,
        unit: item.unit,
        qty: qty,
        unitPriceNet: item.priceNet,
        lineTotalNet: qty * item.priceNet
      });
    });
  }

  // --- Dynamic battery modules (only for Victron) ---
  if (state.current.hasBattery) {
    var batteryItem = state.items["battery_module"];
    if (batteryItem) {
      var batteryQty = computeBatteryModules(kwp);
      addLine({
        key: "battery_module",
        label: batteryItem.name,
        unit: batteryItem.unit,
        qty: batteryQty,
        unitPriceNet: batteryItem.priceNet,
        lineTotalNet: batteryQty * batteryItem.priceNet
      });
    }
  }

  // --- Montážní konstrukce ---
  var structureItem = state.items["structure"];
  if (structureItem) {
    addLine({
      key: "structure",
      label: structureItem.name,
      unit: structureItem.unit,
      qty: 1,
      unitPriceNet: structureItem.priceNet,
      lineTotalNet: structureItem.priceNet
    });
  }

  // --- Region transport ---
  var regionRow = state.regions.find(function (row) {
    return normalizeBool(row.active) && row.region_code === state.current.regionCode;
  });
  if (!regionRow) {
    errors.push("Vyberte kraj instalace.");
  } else {
    var transportNet = toNumber(regionRow.transport_price_net);
    addLine({
      key: "TRANSPORT_REGION",
      label: "Doprava (" + regionRow.region_name + ")",
      unit: "",
      qty: 1,
      unitPriceNet: transportNet,
      lineTotalNet: transportNet
    });
  }

  // --- LPS ---
  var lpsKey = state.current.hasLps ? "lpsyes" : "lpsno";
  var lpsItem = state.items[lpsKey];
  if (lpsItem.priceNet > 0) {
    addLine({
      key: lpsKey,
      label: lpsItem.name,
      unit: lpsItem.unit,
      qty: 1,
      unitPriceNet: lpsItem.priceNet,
      lineTotalNet: lpsItem.priceNet
    });
  }

  // --- Living surcharge ---
  var livingKey = state.current.isLiving ? "livinginprice" : "nolivinginprice";
  var livingItem = state.items[livingKey];
  if (livingItem.priceNet > 0) {
    addLine({
      key: livingKey,
      label: livingItem.name,
      unit: livingItem.unit,
      qty: 1,
      unitPriceNet: livingItem.priceNet,
      lineTotalNet: livingItem.priceNet
    });
  }

  // --- Safety 120V surcharges for >10 kWp ---
  if (system === "fronius_no_battery" && kwp > 10) {
    var safetyItem = state.items["safety120Vpriceperkw"];
    var qtyOver = Math.round((kwp - 10) * 10) / 10;
    addLine({
      key: "safety120Vpriceperkw",
      label: "Odpojovače 120V/string (nad 10 kWp)",
      unit: safetyItem.unit,
      qty: qtyOver,
      unitPriceNet: safetyItem.priceNet,
      lineTotalNet: qtyOver * safetyItem.priceNet
    });
  }

  if (system === "victron_with_battery" && kwp > 10) {
    var pctItem = state.items["SAFETY_120V_VICTRON_PCT_OVER10"];
    var pct = pctItem.priceNet / 100;
    var baseTotal = netTotal;
    var surcharge = baseTotal * pct;
    addLine({
      key: "SAFETY_120V_VICTRON_PCT_OVER10",
      label: "Navýšení (120V/string) – Victron nad 10 kWp (" + pctItem.priceNet + " %)",
      unit: "%",
      qty: 1,
      unitPriceNet: surcharge,
      lineTotalNet: surcharge
    });
  }

  // --- VAT ---
  var vatRule = state.vatRules.find(function (row) {
    return String(row.customer_type || "").toUpperCase() === state.current.customerType &&
      normalizeBool(row.is_living) === state.current.isLiving;
  });
  var vatRate = vatRule ? toNumber(vatRule.vat_rate) : toNumber(state.meta.vat_default_rate) || 0;
  var gross = netTotal * (1 + vatRate);

  // Summary labels in Czech
  var panelWp = toNumber(state.meta.panel_wp) || 450;
  var systemLabel = state.current.hasBattery ? "Victron (s baterií)" : "Fronius (bez baterie)";

  return {
    errors: errors,
    summary: {
      "Segment": segment,
      "Systém": systemLabel,
      "Výkon": kwp + " kWp",
      "Počet panelů": panelCount + "× " + panelWp + " Wp",
      "Kraj": regionRow ? regionRow.region_name : "–",
      "Hromosvod (LPS)": state.current.hasLps ? "Ano" : "Ne",
      "Obývaný objekt": state.current.isLiving ? "Ano" : "Ne",
      "Zákazník": state.current.customerType
    },
    items: items,
    totals: {
      net: netTotal,
      vatRate: vatRate,
      gross: gross
    }
  };
}

var SUMMARY_LABELS = {
  "Segment": "Segment",
  "Systém": "Systém",
  "Výkon": "Výkon",
  "Počet panelů": "Počet panelů",
  "Kraj": "Kraj",
  "Hromosvod (LPS)": "Hromosvod",
  "Obývaný objekt": "Obývaný",
  "Zákazník": "Zákazník"
};

function render() {
  clearAdminError();
  var result = computeConfig();
  if (result.errors.length > 0) {
    setAdminError(result.errors.join(" | "));
  }

  var summary = $("summary");
  summary.innerHTML = "";
  Object.keys(result.summary).forEach(function (key) {
    var div = document.createElement("div");
    div.className = "summary-item";
    div.innerHTML = "<small style='color:#6b7280'>" + key + "</small><br><strong>" + result.summary[key] + "</strong>";
    summary.appendChild(div);
  });

  var priceBox = $("priceBox");
  priceBox.innerHTML = "";
  var netCard = document.createElement("div");
  netCard.className = "price-card";
  netCard.innerHTML = "<span>Bez DPH</span><strong>" + formatCurrency(result.totals.net) + "</strong>";
  var vatCard = document.createElement("div");
  vatCard.className = "price-card";
  vatCard.innerHTML = "<span>DPH</span><strong>" + formatPercent(result.totals.vatRate) + "</strong>";
  var grossCard = document.createElement("div");
  grossCard.className = "price-card";
  grossCard.innerHTML = "<span>S DPH</span><strong>" + formatCurrency(result.totals.gross) + "</strong>";
  priceBox.appendChild(netCard);
  priceBox.appendChild(vatCard);
  priceBox.appendChild(grossCard);

  var tbody = $("itemsTable");
  tbody.innerHTML = "";
  result.items.forEach(function (item) {
    var tr = document.createElement("tr");
    var qtyDisplay = item.unit === "%" ? "–" : item.qty;
    tr.innerHTML =
      "<td>" + item.label + "</td>" +
      "<td>" + qtyDisplay + "</td>" +
      "<td>" + formatCurrency(item.unitPriceNet) + "</td>" +
      "<td>" + formatCurrency(item.lineTotalNet) + "</td>";
    tbody.appendChild(tr);
  });

  sendHeight();
}

function buildPayload(result) {
  var regionRow = state.regions.find(function (row) {
    return row.region_code === state.current.regionCode;
  });
  return {
    token: state.meta.lead_webhook_token || "",
    page: window.location.href,
    timestamp: new Date().toISOString(),
    customer_email: $("customerEmail").value.trim(),
    customer_name: $("customerName").value.trim(),
    segment: state.current.segment,
    system: state.current.hasBattery ? "victron_with_battery" : "fronius_no_battery",
    kWp: state.current.kwp,
    region_code: state.current.regionCode,
    region_name: regionRow ? regionRow.region_name : "",
    isB2C: state.current.customerType === "B2C",
    isLiving: state.current.isLiving,
    hasLPS: state.current.hasLps,
    price_net: result.totals.net,
    vat_rate: result.totals.vatRate,
    price_gross: result.totals.gross,
    items: result.items.map(function (item) {
      return {
        key: item.key,
        label: item.label,
        qty: item.qty,
        unit: item.unit,
        unit_price_net: item.unitPriceNet,
        line_total_net: item.lineTotalNet
      };
    }),
    brand: {
      company: state.meta.company_name || "",
      contact_name: state.meta.contact_name || "",
      phone: state.meta.company_phone || "",
      web: state.meta.company_web || "",
      email: state.meta.company_email || "",
      logo_url: state.meta.logo_url || "",
      accent: state.meta.accent_color || ""
    },
    notes: ["orientační kalkulace"]
  };
}

function validEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function handleSend() {
  var email = $("customerEmail").value.trim();
  var gdpr = $("gdprConsent").checked;
  var webhookUrl = state.meta.lead_webhook_url;
  var token = state.meta.lead_webhook_token;

  if (!validEmail(email)) {
    setAdminError("Zadejte platný e-mail.");
    return;
  }
  if (!gdpr) {
    setAdminError("Potvrďte souhlas se zpracováním osobních údajů.");
    return;
  }
  if (!webhookUrl || webhookUrl === "https://example.com/webhook") {
    setAdminError("Webhook URL není nakonfigurován. Kontaktujte správce.");
    return;
  }
  if (!token || token === "CHANGE_ME") {
    setAdminError("Webhook token není nakonfigurován. Kontaktujte správce.");
    return;
  }

  var result = computeConfig();
  if (result.errors.length > 0) {
    setAdminError(result.errors.join(" | "));
    return;
  }

  var payload = buildPayload(result);
  var btn = $("sendBtn");
  btn.disabled = true;
  btn.textContent = "Odesílám...";

  fetch(webhookUrl + "?token=" + encodeURIComponent(token), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Chyba odeslání");
      }
      btn.textContent = "Odesláno ✅";
      setTimeout(function () {
        btn.disabled = false;
        btn.textContent = "Odeslat konfiguraci e-mailem";
      }, 3000);
    })
    .catch(function () {
      setAdminError("Odeslání se nezdařilo. Zkuste to prosím později.");
      btn.disabled = false;
      btn.textContent = "Odeslat konfiguraci e-mailem";
    });
}

function init() {
  var query = parseQuery();
  loadConfig(query)
    .then(function () {
      initUI(query);
      render();
    })
    .catch(function (err) {
      setAdminError("Chyba načtení ceníku: " + err.message);
    });
}

window.addEventListener("load", function () {
  init();
  sendHeight();
});
window.addEventListener("resize", debounce(sendHeight, 200));

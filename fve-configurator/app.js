function $(id) {
  return document.getElementById(id);
}

function parseQuery() {
  var params = new URLSearchParams(window.location.search);
  return {
    pricing: params.get("pricing") || "/fve-configurator/configs/pricing.xlsx",
    segment: params.get("segment") || "RD",
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
    maximumFractionDigits: 2
  }).format(value) + " Kč";
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

function waitForXlsx(timeoutMs) {
  var waited = 0;
  return new Promise(function (resolve, reject) {
    function tick() {
      if (window.XLSX) {
        resolve();
        return;
      }
      waited += 100;
      if (waited >= timeoutMs) {
        reject(new Error("Knihovna XLSX se nepodařila načíst."));
        return;
      }
      setTimeout(tick, 100);
    }
    tick();
  });
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
    segment: "RD",
    kwp: 10,
    hasBattery: false,
    regionCode: "",
    hasLps: false,
    isLiving: false,
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

function normalizeSheetName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
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

function getSheet(workbook, name) {
  var direct = workbook.Sheets[name];
  if (direct) return direct;
  var target = normalizeSheetName(name);
  var match = Object.keys(workbook.Sheets).find(function (key) {
    return normalizeSheetName(key) === target;
  });
  return match ? workbook.Sheets[match] : null;
}

function findSheetByColumns(workbook, requiredColumns) {
  var keys = Object.keys(workbook.Sheets);
  for (var i = 0; i < keys.length; i++) {
    var sheet = workbook.Sheets[keys[i]];
    var rows = normalizeRows(XLSX.utils.sheet_to_json(sheet, { defval: "" }));
    if (!rows.length) continue;
    var header = Object.keys(rows[0]);
    var hasAll = requiredColumns.every(function (col) {
      return header.indexOf(normalizeColumnName(col)) !== -1;
    });
    if (hasAll) return sheet;
  }
  return null;
}

function sheetToObjects(workbook, name) {
  var sheet = getSheet(workbook, name);
  if (!sheet) return [];
  return normalizeRows(XLSX.utils.sheet_to_json(sheet, { defval: "" }));
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
      active: normalizeBool(row.active)
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
      return response.arrayBuffer();
    })
    .then(function (buffer) {
      var workbook = XLSX.read(buffer, { type: "array" });
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
        ensure(getSheet(workbook, name), "Chybí list: " + name);
      });

      var itemsSheet = getSheet(workbook, "Items");
      if (!itemsSheet) {
        itemsSheet = findSheetByColumns(workbook, ["key", "name", "price_net"]);
      }
      ensure(itemsSheet, "Chybí list: Items");
      state.items = mapItems(normalizeRows(XLSX.utils.sheet_to_json(itemsSheet, { defval: "" })));
      state.systemRules = sheetToObjects(workbook, "SystemRules");
      state.conditionalRules = sheetToObjects(workbook, "ConditionalRules");
      state.regions = sheetToObjects(workbook, "Regions");
      state.vatRules = sheetToObjects(workbook, "VATRules");
      state.segments = sheetToObjects(workbook, "Segments");
      state.meta = mapMeta(sheetToObjects(workbook, "Meta"));

      var requiredKeys = [
        "lpsyes",
        "lpsno",
        "livinginprice",
        "nolivinginprice",
        "safety120Vpriceperkw",
        "SAFETY_120V_VICTRON_PCT_OVER10"
      ];
      requiredKeys.forEach(function (key) {
        ensure(state.items[key], "Chybí položka v Items: " + key);
      });

      state.systemRules.forEach(function (row) {
        var key = String(row.key || "").trim();
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
  $("subhead").textContent = "Ceny a pravidla se načítají z XLSX: " + query.pricing;

  var accent = state.meta.accent_color;
  if (accent) {
    document.documentElement.style.setProperty("--accent", accent);
  }
  if (state.meta.logo_url) {
    var logo = $("brandLogo");
    logo.src = state.meta.logo_url;
    logo.style.display = "block";
  }

  var segmentSelect = $("segment");
  segmentSelect.innerHTML = "";
  state.segments.forEach(function (row) {
    var option = document.createElement("option");
    option.value = row.segment;
    option.textContent = row.segment;
    segmentSelect.appendChild(option);
  });
  segmentSelect.value = query.segment;

  var regionSelect = $("region");
  regionSelect.innerHTML = "<option value=\"\">Vyberte kraj</option>";
  state.regions.forEach(function (row) {
    if (!normalizeBool(row.active)) return;
    var option = document.createElement("option");
    option.value = row.region_code;
    option.textContent = row.region_name;
    regionSelect.appendChild(option);
  });

  var minKwp = 3;
  var maxKwp = 50;
  var segRow = state.segments.find(function (row) { return row.segment === query.segment; });
  if (segRow) {
    minKwp = Math.max(3, toNumber(segRow.min_kWp) || 3);
    maxKwp = Math.min(50, toNumber(segRow.max_kWp) || 50);
  }
  $("kwpRange").min = minKwp;
  $("kwpRange").max = maxKwp;
  $("kwpInput").min = minKwp;
  $("kwpInput").max = maxKwp;
  $("kwpRange").value = minKwp;
  $("kwpInput").value = minKwp;
  state.current.kwp = minKwp;
  state.current.segment = query.segment;

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
    var selected = state.segments.find(function (row) { return row.segment === state.current.segment; });
    if (selected) {
      var min = Math.max(3, toNumber(selected.min_kWp) || 3);
      var max = Math.min(50, toNumber(selected.max_kWp) || 50);
      $("kwpRange").min = min;
      $("kwpRange").max = max;
      $("kwpInput").min = min;
      $("kwpInput").max = max;
      state.current.kwp = Math.min(Math.max(state.current.kwp, min), max);
      $("kwpRange").value = state.current.kwp;
      $("kwpInput").value = state.current.kwp;
    }
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

function computeConfig() {
  var errors = [];
  var segment = state.current.segment;
  var segRow = state.segments.find(function (row) { return row.segment === segment; });
  if (!segRow) {
    errors.push("Neznámý segment.");
  }
  var min = segRow ? Math.max(3, toNumber(segRow.min_kWp) || 3) : 3;
  var max = segRow ? Math.min(50, toNumber(segRow.max_kWp) || 50) : 50;

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

  var matchedSystemRules = state.systemRules.filter(function (row) {
    return row.system === system &&
      kwp >= toNumber(row.range_from_kWp) &&
      kwp <= toNumber(row.range_to_kWp);
  });
  if (matchedSystemRules.length === 0) {
    errors.push("Nenalezený střídač/měnič pro " + system + " (" + kwp + " kWp).");
  } else {
    matchedSystemRules.forEach(function (row) {
      var key = String(row.key || "").trim();
      var item = state.items[key];
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

  var regionRow = state.regions.find(function (row) {
    return normalizeBool(row.active) && row.region_code === state.current.regionCode;
  });
  if (!regionRow) {
    errors.push("Vyberte kraj instalace.");
  } else {
    var transportNet = toNumber(regionRow.transport_price_net);
    addLine({
      key: "TRANSPORT_REGION",
      label: "Doprava (dle kraje)",
      unit: "",
      qty: 1,
      unitPriceNet: transportNet,
      lineTotalNet: transportNet
    });
  }

  var lpsKey = state.current.hasLps ? "lpsyes" : "lpsno";
  var lpsItem = state.items[lpsKey];
  addLine({
    key: lpsKey,
    label: lpsItem.name,
    unit: lpsItem.unit,
    qty: 1,
    unitPriceNet: lpsItem.priceNet,
    lineTotalNet: lpsItem.priceNet
  });

  var livingKey = state.current.isLiving ? "livinginprice" : "nolivinginprice";
  var livingItem = state.items[livingKey];
  addLine({
    key: livingKey,
    label: livingItem.name,
    unit: livingItem.unit,
    qty: 1,
    unitPriceNet: livingItem.priceNet,
    lineTotalNet: livingItem.priceNet
  });

  if (system === "fronius_no_battery" && kwp > 10) {
    var safetyItem = state.items["safety120Vpriceperkw"];
    var qtyOver = kwp - 10;
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
      label: "Navýšení (120V/string) – Victron nad 10 kWp",
      unit: "%",
      qty: 1,
      unitPriceNet: surcharge,
      lineTotalNet: surcharge
    });
  }

  var vatRule = state.vatRules.find(function (row) {
    return String(row.customer_type || "").toUpperCase() === state.current.customerType &&
      normalizeBool(row.is_living) === state.current.isLiving;
  });
  var vatRate = vatRule ? toNumber(vatRule.vat_rate) : toNumber(state.meta.vat_default_rate) || 0;
  var gross = netTotal * (1 + vatRate);

  return {
    errors: errors,
    summary: {
      segment: segment,
      system: system,
      kwp: kwp,
      region: regionRow ? regionRow.region_name : "",
      lps: state.current.hasLps ? "Ano" : "Ne",
      living: state.current.isLiving ? "Ano" : "Ne",
      customerType: state.current.customerType
    },
    items: items,
    totals: {
      net: netTotal,
      vatRate: vatRate,
      gross: gross
    }
  };
}

function render() {
  clearAdminError();
  var result = computeConfig();
  if (result.errors.length > 0) {
    setAdminError("admin error: " + result.errors.join(" "));
  }

  var summary = $("summary");
  summary.innerHTML = "";
  Object.keys(result.summary).forEach(function (key) {
    var div = document.createElement("div");
    div.className = "summary-item";
    div.textContent = key.toUpperCase() + ": " + result.summary[key];
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
    tr.innerHTML =
      "<td>" + item.label + "</td>" +
      "<td>" + item.qty + "</td>" +
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
    segment: result.summary.segment,
    system: result.summary.system,
    kWp: result.summary.kwp,
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
    setAdminError("admin error: zadejte platný e-mail zákazníka.");
    return;
  }
  if (!gdpr) {
    setAdminError("admin error: potvrďte souhlas GDPR.");
    return;
  }
  if (!webhookUrl || !token) {
    setAdminError("admin error: chybí webhook URL nebo token v Meta listu.");
    return;
  }

  var result = computeConfig();
  if (result.errors.length > 0) {
    setAdminError("admin error: " + result.errors.join(" "));
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
      setAdminError("admin error: odeslání selhalo.");
      btn.disabled = false;
      btn.textContent = "Odeslat konfiguraci e-mailem";
    });
}

function init() {
  var query = parseQuery();
  waitForXlsx(5000)
    .then(function () {
      return loadConfig(query);
    })
    .then(function () {
      initUI(query);
      render();
    })
    .catch(function (err) {
      setAdminError("admin error: " + err.message + " Nahrajte pricing.xlsx do /fve-configurator/configs/.");
    });
}

window.addEventListener("load", function () {
  init();
  sendHeight();
});
window.addEventListener("resize", debounce(sendHeight, 200));

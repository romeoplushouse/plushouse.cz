#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

let xlsx;
try {
  xlsx = require("xlsx");
} catch (err) {
  console.error("Chybí závislost 'xlsx'. Nainstalujte ji: npm install xlsx");
  process.exit(1);
}

const inputPath = path.resolve(__dirname, "..", "cenik.xlsx");
const outputDir = path.resolve(__dirname, "..", "public", "data");
const outputPath = path.join(outputDir, "cenik.json");

const sheetName = "clenstvi";
const requiredColumns = [
  "plan_key",
  "plan_name",
  "price_monthly_b2c",
  "price_monthly_b2b",
  "currency"
];

if (!fs.existsSync(inputPath)) {
  console.error(`Soubor ${inputPath} neexistuje.`);
  process.exit(1);
}

const workbook = xlsx.readFile(inputPath);
function normalizeSheetName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}
function getSheetByName(workbookObj, name) {
  const direct = workbookObj.Sheets[name];
  if (direct) return direct;
  const target = normalizeSheetName(name);
  const match = Object.keys(workbookObj.Sheets).find(
    (key) => normalizeSheetName(key) === target
  );
  return match ? workbookObj.Sheets[match] : null;
}
function findSheetByColumns(workbookObj, columns) {
  const keys = Object.keys(workbookObj.Sheets);
  for (const key of keys) {
    const sheet = workbookObj.Sheets[key];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    if (!rows.length) continue;
    const header = Object.keys(rows[0]);
    if (columns.every((col) => header.includes(col))) {
      return sheet;
    }
  }
  return null;
}
let sheet = getSheetByName(workbook, sheetName);
if (!sheet) {
  sheet = findSheetByColumns(workbook, requiredColumns);
}
if (!sheet) {
  console.error(`Chybí list '${sheetName}' v ${inputPath}.`);
  process.exit(1);
}

const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
if (!rows.length) {
  console.error("List clenstvi je prázdný.");
  process.exit(1);
}

requiredColumns.forEach((col) => {
  if (!(col in rows[0])) {
    console.error(`Chybí sloupec '${col}' v listu '${sheetName}'.`);
    process.exit(1);
  }
});

const data = rows.map((row) => ({
  plan_key: String(row.plan_key).trim(),
  plan_name: String(row.plan_name).trim(),
  price_monthly_b2c: Number(row.price_monthly_b2c),
  price_monthly_b2b: Number(row.price_monthly_b2b),
  currency: String(row.currency || "CZK").trim()
}));

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const output = {
  generated_at: new Date().toISOString(),
  clenstvi: data
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");
console.log(`Vygenerováno: ${outputPath}`);

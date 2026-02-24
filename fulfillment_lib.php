<?php

define('FULFILLMENT_PRODUCTS_PATH', __DIR__ . '/data/fulfillment/products.json');
define('FULFILLMENT_ORDERS_PATH', __DIR__ . '/data/fulfillment/orders.json');

const ORDER_STATES = [
  'NEW',
  'PAID',
  'READY_FOR_LOXONE_ORDER',
  'ORDERED_AT_LOXONE',
  'SHIPPED',
  'DELIVERED',
  'CLOSED'
];

function load_json_file($path) {
  if (!file_exists($path)) return [];
  $raw = file_get_contents($path);
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function save_json_file($path, $data) {
  file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function load_products() {
  $data = load_json_file(FULFILLMENT_PRODUCTS_PATH);
  $map = [];
  foreach (($data['products'] ?? []) as $p) {
    $map[$p['sku']] = $p;
  }
  return $map;
}

function load_orders() {
  $data = load_json_file(FULFILLMENT_ORDERS_PATH);
  return $data['orders'] ?? [];
}

function save_orders($orders) {
  save_json_file(FULFILLMENT_ORDERS_PATH, ['orders' => array_values($orders)]);
}

function find_order_index($orders, $id) {
  foreach ($orders as $i => $o) {
    if (($o['id'] ?? '') === $id) return $i;
  }
  return -1;
}

function can_transition($from, $to) {
  $i = array_search($from, ORDER_STATES, true);
  $j = array_search($to, ORDER_STATES, true);
  return $i !== false && $j !== false && $j === $i + 1;
}

function flatten_order_items_for_quick_order($order, $products) {
  $agg = [];
  foreach (($order['items'] ?? []) as $line) {
    $sku = $line['sku'];
    $qty = (int)($line['qty'] ?? 1);
    if (!isset($products[$sku])) continue;
    $p = $products[$sku];
    if (!empty($p['is_kit'])) {
      foreach (($p['kit_components'] ?? []) as $c) {
        $item = (string)$c['item_number'];
        $componentQty = (int)$c['qty'] * $qty;
        $agg[$item] = ($agg[$item] ?? 0) + $componentQty;
      }
    } else {
      $item = (string)$p['loxone_item_number'];
      $agg[$item] = ($agg[$item] ?? 0) + $qty;
    }
  }
  ksort($agg);
  return $agg;
}

function quick_order_csv($agg) {
  $lines = [];
  foreach ($agg as $item => $qty) {
    $lines[] = $item . ';' . $qty;
  }
  return implode("\n", $lines) . "\n";
}

function shipping_address_text($order) {
  $a = $order['shipping_address'] ?? [];
  return trim(($a['street'] ?? '') . ", " . ($a['zip'] ?? '') . " " . ($a['city'] ?? '') . ", " . ($a['country'] ?? 'CZ'));
}

function add_history(&$order, $from, $to, $note) {
  $order['history'][] = [
    'at' => date('c'),
    'from' => $from,
    'to' => $to,
    'note' => $note
  ];
}

function customer_email_paid($order) {
  return "Potvrzení objednávky {$order['id']}\n\nDěkujeme za úhradu objednávky. Zboží je expedováno z distribučního skladu Loxone / partner store. Dodací doba orientačně 1–5 pracovních dnů v CZ (dle dostupnosti).";
}

function customer_email_shipped($order) {
  return "Objednávka {$order['id']} byla odeslána\n\nDopravce: " . ($order['carrier'] ?? '') . "\nTracking: " . ($order['tracking_number'] ?? '') . "\n\nPro reklamace a vrácení zboží kontaktujte vždy PLUS HOUSE.";
}

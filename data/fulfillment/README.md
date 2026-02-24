# Loxone dropshipping fulfillment (PLUS HOUSE)

Model:
- PLUS HOUSE = merchant of record
- Loxone / partner store = fulfillment (direct shipment)

## Product model
Each product must include:
- `loxone_item_number`
- `lead_time_text`
- `is_kit` and `kit_components[{item_number, qty}]`
- warranty/returns notes

## Order workflow states
`NEW -> PAID -> READY_FOR_LOXONE_ORDER -> ORDERED_AT_LOXONE -> SHIPPED -> DELIVERED -> CLOSED`

## Admin operations
- Export Quick Order CSV (`itemnumber;quantity`)
- Set `loxone_order_ref`
- Set tracking (`tracking_number`, `carrier`)
- Audit history per order

## Compliance
No scraping/automation login to Loxone e-shop without written consent.

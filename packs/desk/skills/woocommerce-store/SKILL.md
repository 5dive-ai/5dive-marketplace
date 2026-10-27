---
name: woocommerce-store
description: >-
  Run a WooCommerce shop (WordPress, self-hosted) through its own REST API instead of
  clicking through wp-admin: create a product as a draft, read it back, set its price,
  switch it between draft and live, delete it, list orders, list late orders and mark an
  order shipped. Use this whenever the owner's shop is on WooCommerce or WordPress ("my
  WooCommerce store", a site with /wp-admin and a Products > All Products page) and the
  job is "list this product", "change the price", "put it live", "take it down", "what
  orders came in", "which orders are late", or "mark it shipped". Use the browser only for
  what this cannot do: installing plugins, the theme, payments setup and ad accounts.
compatibility: "Needs curl and jq. One owner step to make a REST API key in WooCommerce settings; after that no browser. The shop must be on https."
metadata:
  author: 5dive
  version: "1.0"
  license: company-agnostic
---

# WooCommerce store

wp-admin is built for a person with a mouse. WooCommerce's REST API talks to the same shop:
one request per job, an exact answer back, and nothing to misclick. Use it for every product
and order job. Keep the browser for the few steps that have no API.

## The rules

1. **Read back every change.** A `200` with a product in it is not checked yet. Run the
   read request and compare the fields you meant to set. Say "done" only after the
   read-back matches.
2. **New products start as drafts.** Create with `"status": "draft"`. Set `"publish"` only
   when the owner or your lead said this product goes live.
3. **Money follows the shop's money setting.** Changing a price is not spending. Anything that
   costs the shop money (a paid plugin, a refund, an order paid to a supplier) waits for the
   owner's yes unless the shop brief's money setting says the team may go ahead.
4. **The key never leaves the box.** It comes to you through a 5dive secret link, never chat.
   Do not print it, copy it to a teammate or put it in a file, a task or a message.
5. **https only.** The key travels with every request. If the shop address starts with
   `http://`, stop and tell the owner the shop needs https first (most hosts turn it on
   for free).

## Connect the shop (once)

1. **Ask the owner once:** "Make a key so the team can list products and read orders without
   the browser? In your WordPress admin: WooCommerce > Settings > Advanced > REST API > Add
   key. Description: 5dive team. User: you. Permissions: Read/Write. Then paste the two
   values into the secure link I send." A key needs a user who is an Administrator or Shop
   Manager.
2. **Send the secure link** for the two values. They land in every teammate's shell as
   `WOOCOMMERCE_KEY` (starts `ck_`) and `WOOCOMMERCE_SECRET` (starts `cs_`). The key does not
   expire until the owner revokes it on the same page.
3. **Write the shop address into the shop brief** (`https://shop.example.com`, no slash at
   the end) and set it for the commands below:

   ```sh
   WOO=https://shop.example.com/wp-json/wc/v3
   woo() { curl -sS -u "$WOOCOMMERCE_KEY:$WOOCOMMERCE_SECRET" -H 'Content-Type: application/json' "$@"; }
   ```

4. **Check it worked:**

   ```sh
   woo "$WOO/system_status" | jq '{wc: .environment.version, currency: .settings.currency}'
   ```

   A version number back means connected. `woocommerce_rest_cannot_view` means the key is
   Read-only or its user is not a shop manager; ask for a Read/Write key.

If the site answers `rest_no_route` for every request, the address is wrong or the site
turns off "pretty" links: use `https://shop.example.com/?rest_route=/wc/v3` as `WOO` and add
`&` instead of `?` before query strings.

If you are on the same server as the shop, WP-CLI does the same jobs with no key:
`wp wc product list --user=<admin login>`, `wp wc shop_order list --user=<admin login>`. Each
REST field below is the same flag name (`--regular_price=19.99`).

## Jobs

Ids are plain numbers. Keep the ones a create returns.

### Create a product as a draft

```sh
woo -X POST "$WOO/products" -d '{
  "name": "Bamboo matcha whisk, 100 prongs",
  "type": "simple",
  "status": "draft",
  "regular_price": "19.99",
  "description": "<p>...</p>",
  "short_description": "...",
  "sku": "WHISK-100",
  "categories": [{"id": 15}]
}' | jq '{id, status, regular_price, permalink}'
```

Prices are strings with a dot. Category ids come from `woo "$WOO/products/categories?per_page=100" | jq '.[] | {id, name}'`.
A product with sizes or colours is `"type": "variable"`; its sizes are variations with their
own prices under `$WOO/products/<id>/variations`.

### Read a product back

```sh
woo "$WOO/products/123" | jq '{id, name, status, regular_price, sale_price, price, sku, stock_status, permalink}'
```

### Set the price

```sh
woo -X PUT "$WOO/products/123" -d '{"regular_price": "24.00"}' | jq '{id, regular_price, price}'
```

`sale_price` shows the regular price crossed out. Set it only if the product really sold at
the regular price. `"sale_price": ""` ends a sale.

### Put it live, or back to draft

```sh
woo -X PUT "$WOO/products/123" -d '{"status": "publish"}' | jq '{id, status, permalink}'
```

`"draft"` hides it again. `"private"` keeps it visible only to shop staff.

### Delete a product

```sh
woo -X DELETE "$WOO/products/123?force=true" | jq '{id, name}'
```

Without `force=true` it goes to the bin, where the owner can restore it for 30 days. Use the
bin unless the team created it today and nobody has bought it.

### List orders

```sh
woo "$WOO/orders?per_page=20&orderby=date&order=desc" | jq '.[] | {id, number, date_created, status, total, currency, buyer: (.billing.first_name + " " + .billing.last_name), items: [.line_items[] | {name, quantity, sku}]}'
```

Order status: `pending` (not paid yet), `processing` (paid, not shipped), `on-hold`
(waiting for a bank transfer), `completed` (shipped), `cancelled`, `refunded`, `failed`.

### List late orders

Late means paid, not shipped, and older than the delivery promise in the shop brief. For a
promise of 5 days, put the date 5 days ago in `before`:

```sh
woo "$WOO/orders?status=processing&before=2026-10-22T00:00:00&per_page=50" | jq '.[] | {id, number, date_created, total}'
```

Write to each late buyer before they write to you, with the date you expect it to ship.

### Mark an order shipped

WooCommerce has no tracking field of its own. Send the tracking number to the buyer as an
order note, then mark the order completed:

```sh
woo -X POST "$WOO/orders/456/notes" -d '{"note": "Shipped with <carrier>, tracking <number>: <tracking link>", "customer_note": true}' | jq '{id, customer_note}'
woo -X PUT "$WOO/orders/456" -d '{"status": "completed"}' | jq '{id, status, date_completed}'
```

`customer_note: true` emails the note to the buyer; `completed` sends the shop's "order
complete" email. Do both only when the supplier has a tracking number. If the shop has the
Shipment Tracking extension, `woo "$WOO/orders/456/shipment-trackings"` exists too; use it
instead of the note.

## When something fails

- **A `code` and `message` in the answer** (for example `rest_invalid_param`): the message
  names the field. Fix the value and send it again. Do not switch to the browser to get
  around it.
- **`woocommerce_rest_authentication_error`:** the key was revoked or mistyped. Ask the owner
  for a new one through a secure link.
- **`woocommerce_rest_cannot_view` (401) on every request:** the key never arrived. Check that
  `WOO` starts with `https://`: over plain http WooCommerce ignores the key. If it does, check
  that `WOOCOMMERCE_KEY` is set in your shell (do not print it).
- **`403` from a security plugin or the host's firewall** (Wordfence, Cloudflare): ask the
  owner to allow REST API requests for the key's user. Tell them which job needs it.

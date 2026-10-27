---
name: shopify-store
description: >-
  Run a Shopify shop through Shopify's own command line instead of clicking through the
  admin: create a product as a draft, read it back, set its price, switch it between draft
  and active, delete it, list orders, list late orders and mark an order fulfilled. Use this
  whenever the owner's shop is on Shopify (an address ending in .myshopify.com, or "my
  Shopify store") and the job is "list this product", "change the price", "put it live",
  "take it down", "what orders came in", "which orders are late", or "mark it shipped".
  Use the browser only for what this cannot do: sign-up, bot checks, the theme, payments
  setup and ad accounts.
compatibility: "Needs Node 22.12 or newer and the Shopify CLI 4.9 or newer, installed into your own home folder (no admin rights needed). One owner yes to connect the shop; after that no browser."
metadata:
  author: 5dive
  version: "1.0"
  license: company-agnostic
---

# Shopify store

The shop's admin pages are built for a person with a mouse. Shopify's command line talks to
the same store through its Admin API: one command per job, an exact answer back, and nothing
to misclick. Use it for every product and order job. Keep the browser for the few steps that
have no API.

## The rules

1. **Read back every change.** A mutation that returns no `userErrors` has not been checked
   yet. Run the read query and compare the fields you meant to set. Say "done" only after
   the read-back matches.
2. **Changes need `--allow-mutations`.** Without it the command refuses anything that writes,
   so reads are safe by default. Add the flag only to the one command that is meant to
   change the shop.
3. **New products start as drafts.** Create with `status: DRAFT`. Set `ACTIVE` only when the
   owner or your lead said this product goes live.
4. **Money follows the shop's money setting.** Changing a price is not spending. Anything that
   costs the shop money (an app, a paid plan, a refund, an order paid to a supplier) waits
   for the owner's yes unless the shop brief's money setting says the team may go ahead.
5. **Never paste the access token anywhere.** The CLI keeps it in your own home folder
   (`~/.config/shopify-cli-store-nodejs/`). Do not print it, copy it to a teammate or put it
   in a file, a task or a message.

## Connect the shop (once per teammate)

You need the shop's address, `<shop>.myshopify.com`. It is in the admin's address bar
(`admin.shopify.com/store/<shop>`) or under Settings > Domains.

1. **Install** into your own home folder, no admin rights needed:
   `npm i -g --prefix ~/.local @shopify/cli@latest`, then `~/.local/bin/shopify version` (4.9 or
   newer). If `shopify` is not found below, call it as `~/.local/bin/shopify`.
2. **Ask the owner once:** "Connect the shop so the team can list products and read orders
   without the browser? You approve it on one Shopify page." One yes covers every teammate
   who needs it.
3. **Start the connection in the background.** It waits up to 5 minutes for the approval to
   come back to this machine:

   ```sh
   SCOPES=read_products,write_products,read_orders,write_orders,read_merchant_managed_fulfillment_orders,write_merchant_managed_fulfillment_orders
   printf '#!/bin/sh\necho "$1" > "$HOME/.shopify-auth-url"\n' > "$HOME/.shopify-open" && chmod +x "$HOME/.shopify-open"
   BROWSER="$HOME/.shopify-open" shopify store auth --store <shop>.myshopify.com --scopes "$SCOPES" > "$HOME/.shopify-auth.log" 2>&1 &
   ```

   On a machine with no screen the CLI does not print the approval link. The `BROWSER`
   line above catches it in `~/.shopify-auth-url` instead.
4. **Open that link in the browser on this machine**, in the profile where the owner is
   signed in to their Shopify admin. Opening it on the owner's phone does not work: the
   approval comes back to `127.0.0.1` on this machine. Approve the access on the page.
   If the browser is not signed in to Shopify, ask the owner to sign in there first.
5. **Check it worked:** `cat ~/.shopify-auth.log` shows "Logged in", then:

   ```sh
   shopify store execute --store <shop>.myshopify.com --query 'query { shop { name myshopifyDomain currencyCode } }'
   ```

6. **Delete the two helper files** (`~/.shopify-open`, `~/.shopify-auth-url`) and write the
   shop address into the shop brief.

If the approval page refuses the two fulfillment scopes, connect again without them. Every
product and order read still works; mark orders shipped in the admin until it is fixed.

`shopify store list` shows the shops you are connected to. If a command says the stored
login is missing or expired, run steps 3 to 5 again. The CLI renews it by itself until then.

## Jobs

Put each query in a file and its values in a JSON file, then run it:

```sh
shopify store execute --store <shop>.myshopify.com --query-file q.graphql --variable-file v.json --json
```

Add `--allow-mutations` for the ones that change the shop. Ids look like
`gid://shopify/Product/123`; keep the ones a create returns.

### Create a product as a draft

```graphql
mutation CreateDraft($product: ProductCreateInput!) {
  productCreate(product: $product) {
    product { id handle status variants(first: 1) { nodes { id price } } }
    userErrors { field message }
  }
}
```

```json
{"product": {"title": "Bamboo matcha whisk, 100 prongs", "descriptionHtml": "<p>...</p>", "vendor": "...", "productType": "Matcha tools", "tags": ["matcha"], "status": "DRAFT"}}
```

A new product gets one variant. Set its price with the next job, using the variant id
returned here.

### Read a product back

```graphql
query ReadProduct($id: ID!) {
  product(id: $id) {
    id title handle status descriptionHtml vendor productType tags
    onlineStoreUrl
    variants(first: 20) { nodes { id title sku price compareAtPrice } }
  }
}
```

### Set the price

```graphql
mutation SetPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id price compareAtPrice }
    userErrors { field message }
  }
}
```

```json
{"productId": "gid://shopify/Product/123", "variants": [{"id": "gid://shopify/ProductVariant/456", "price": "19.99"}]}
```

`compareAtPrice` is the crossed-out price. Set it only if the product really sold at that
price.

### Put it live, or back to draft

```graphql
mutation SetStatus($product: ProductUpdateInput!) {
  productUpdate(product: $product) {
    product { id status }
    userErrors { field message }
  }
}
```

```json
{"product": {"id": "gid://shopify/Product/123", "status": "ACTIVE"}}
```

`DRAFT` hides it again; `ARCHIVED` keeps it out of the shop without deleting it.

### Delete a product

```graphql
mutation DeleteProduct($input: ProductDeleteInput!) {
  productDelete(input: $input) {
    deletedProductId
    userErrors { field message }
  }
}
```

```json
{"input": {"id": "gid://shopify/Product/123"}}
```

Deleting cannot be undone. Delete only what the team created and nobody has bought. For
anything else, archive it.

### List orders

```graphql
query Orders($first: Int!, $query: String) {
  orders(first: $first, sortKey: CREATED_AT, reverse: true, query: $query) {
    nodes {
      id name createdAt
      displayFinancialStatus displayFulfillmentStatus
      totalPriceSet { shopMoney { amount currencyCode } }
      customer { displayName }
      lineItems(first: 10) { nodes { title quantity sku } }
    }
  }
}
```

```json
{"first": 20, "query": null}
```

Without extra access Shopify shows the last 60 days of orders.

### List late orders

Same query. Late means paid, not shipped, and older than the delivery promise in the shop
brief. For a promise of 5 days, put the date 5 days ago in the filter:

```json
{"first": 50, "query": "fulfillment_status:unfulfilled financial_status:paid created_at:<2026-10-22"}
```

Write to each late buyer before they write to you, with the date you expect it to ship.

### Mark an order fulfilled

First find the order's fulfillment orders:

```graphql
query FulfillmentOrders($id: ID!) {
  order(id: $id) {
    name
    fulfillmentOrders(first: 10) { nodes { id status requestStatus lineItems(first: 20) { nodes { id remainingQuantity } } } }
  }
}
```

Then fulfil the open ones with the supplier's tracking number:

```graphql
mutation MarkFulfilled($fulfillment: FulfillmentInput!) {
  fulfillmentCreate(fulfillment: $fulfillment) {
    fulfillment { id status trackingInfo { company number url } }
    userErrors { field message }
  }
}
```

```json
{"fulfillment": {"lineItemsByFulfillmentOrder": [{"fulfillmentOrderId": "gid://shopify/FulfillmentOrder/789"}], "trackingInfo": {"company": "...", "number": "...", "url": "..."}, "notifyCustomer": true}}
```

Mark it fulfilled only when the supplier has a tracking number. Shopify emails the buyer when
`notifyCustomer` is true.

## When something fails

- **`userErrors` is not empty:** read the message. It names the field. Fix the value and
  run it again. Do not switch to the browser to get around it.
- **"Access denied" on one field or job:** the shop was connected without that access.
  Connect again with the missing scope (steps 3 to 5). Tell the owner which job needs it.
- **Anything else:** Shopify's own AI Toolkit (`shopify-ai-toolkit` for Claude Code,
  `@shopify/ai-toolkit` for other agents) searches the docs and checks a query against the
  API before you run it.

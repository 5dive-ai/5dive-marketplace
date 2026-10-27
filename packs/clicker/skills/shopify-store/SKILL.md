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
5. **Keep the access token private.** The CLI saves it in
   `~/.config/shopify-cli-store-nodejs/`. On a shared machine every other teammate can read that
   folder unless you lock it, so connect with `umask 077` and `chmod 700` it after (steps 3
   and 5). Never print the token, copy it to a teammate, or put it in a file, a task or a
   message.

## Connect the shop (once per teammate)

You need the shop's address, `<shop>.myshopify.com`. It is in the admin's address bar
(`admin.shopify.com/store/<shop>`) or under Settings > Domains.

1. **Install** into your own home folder, no admin rights needed:
   `npm i -g --prefix ~/.local @shopify/cli@latest`, then `~/.local/bin/shopify version` (4.9 or
   newer). If `shopify` is not found below, call it as `~/.local/bin/shopify`.
2. **Ask the owner once:** "Connect the shop so the team can list products and read orders
   without the browser? You approve it on one Shopify page." One yes covers every teammate.
   Only the first teammate sees that page. Once the owner has approved it, every later
   teammate runs steps 1, 3 and 5 and connects with no page.
3. **Start the connection in the background.** From this moment the CLI waits **exactly 5
   minutes** for the approval. It does not wait longer, so have step 4 ready first:

   ```sh
   umask 077
   SCOPES=read_products,write_products,read_orders,write_orders,read_merchant_managed_fulfillment_orders,write_merchant_managed_fulfillment_orders
   printf '#!/bin/sh\necho "$1" > "$HOME/.shopify-auth-url"\n' > "$HOME/.shopify-open" && chmod 700 "$HOME/.shopify-open"
   BROWSER="$HOME/.shopify-open" shopify store auth --store <shop>.myshopify.com --scopes "$SCOPES" > "$HOME/.shopify-auth.log" 2>&1 &
   sleep 5; cat "$HOME/.shopify-auth.log"
   ```

   If the log already says "Authenticated", the shop was approved before: skip to step 5.
   Otherwise the approval link is in `~/.shopify-auth-url` (on a machine with no screen the
   CLI does not print it; the `BROWSER` line catches it).
4. **Open the approval page in the browser on this machine**, where the owner is signed in
   to Shopify. Not on the owner's phone: the approval comes back to `127.0.0.1` on this
   machine.
   - **Plain-Chrome mode first.** Shopify's admin runs a bot check ("Just a moment",
     "Waiting for admin.shopify.com to respond") that never clears in the automated browser
     and clears by itself in plain Chrome. Run `5dive browser config`. If it does not say
     `drive=input`, run `sudo 5dive browser config drive=input` and note the old value. If
     you have no admin rights for that, ask your lead to run it.
   - **Open it on admin.shopify.com.** The captured link is on `<shop>.myshopify.com`, which
     the browser refuses for the owner's Shopify login. Use the same query on the admin
     address:

     ```sh
     URL="https://admin.shopify.com/store/<shop>/oauth/authorize?$(cut -d'?' -f2- "$HOME/.shopify-auth-url")"
     5dive browser act shopify.com --steps="$(printf '[{"op":"goto","url":"%s"}]' "$URL")"
     5dive browser shot shopify.com
     ```

   - **Tap Install** on the page the shot shows (`5dive browser act shopify.com
     --steps='[{"op":"click","x":<x>,"y":<y>}]'`); the owner's yes in step 2 covers it. If
     the page asks for a sign-in instead, hand the window to the owner with
     `5dive browser handoff shopify.com --reason="Sign in to Shopify to connect the shop"`.
   - **Late tap:** if Install lands after the 5 minutes, the browser shows "connection
     refused" on `127.0.0.1`, but Shopify still saved the approval. Run step 3 again: it
     says "Authenticated" with no page.
   - **Put the mode back** with `sudo 5dive browser config drive=<the old value>`.
5. **Lock the folder and check it worked.** `cat ~/.shopify-auth.log` shows "Authenticated",
   then:

   ```sh
   chmod 700 ~/.config/shopify-cli-store-nodejs
   shopify store execute --store <shop>.myshopify.com --query 'query { shop { name myshopifyDomain currencyCode } }'
   node -e 'const c=require(process.env.HOME+"/.config/shopify-cli-store-nodejs/config.json");for(const v of Object.values(c))for(const s of Object.values(v.sessionsByUserId||{}))console.log(s.store,"expires",s.expiresAt)'
   ```

   The last line prints only the shop and when the login expires, never the token. Run the
   `chmod` again after every new connection: the CLI rewrites the file, not the folder.
6. **Delete the helper files** (`~/.shopify-open`, `~/.shopify-auth-url`,
   `~/.shopify-auth.log`) and write the shop address into the shop brief.

If the approval page refuses the two fulfillment scopes, connect again without them. Every
product and order read still works; mark orders shipped in the admin until it is fixed.

The login lasts 24 hours and the CLI renews it by itself. If a command says the stored
login is missing or expired, run steps 3 and 5 again; with the shop already approved there
is no page.

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

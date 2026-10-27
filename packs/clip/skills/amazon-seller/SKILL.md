---
name: amazon-seller
description: >-
  Run an Amazon seller account through Amazon's Selling Partner API instead of clicking
  through Seller Central: read a listing, set its price, take it off sale, delete it, list
  orders, list orders past their ship-by date and mark an order shipped with tracking. Use
  this whenever the owner sells on Amazon ("my Amazon store", Seller Central) and the job is
  "change the price", "take it down", "what orders came in", "which orders are late", or
  "mark it shipped". New listings, brand registry, ads and account health stay in Seller
  Central.
compatibility: "Needs curl and jq. A one-time owner setup in Seller Central (Professional plan, developer profile Amazon reviews, a private app); after that no browser. Not tried live yet: no Amazon seller account was available when this was written."
metadata:
  author: 5dive
  version: "0.9"
  license: company-agnostic
  tried-live: "no"
---

# Amazon seller

**Not tried live yet.** Every call below comes from Amazon's own Selling Partner API docs
(developer-docs.amazon.com/sp-api), but no team has run it against a real seller account.
The first time, use `mode=VALIDATION_PREVIEW` on any change (see Set the price) and tell your
lead what came back.

## The rules

1. **Dropshipping on Amazon has its own rule.** The owner must be the seller of record: the
   owner's name on the packing slip, the invoice and the outside of the box, and no other
   shop's name anywhere in the parcel. The supplier must ship plain parcels. Check this with
   the owner before the first order ships. Breaking it can stop the account selling.
2. **Read back every change.** A `200` or `ACCEPTED` is not checked yet. Amazon applies
   changes in minutes, not instantly: read the listing again after a minute and compare.
3. **Money follows the shop's money setting.** Changing a price is not spending. Ads, a
   refund, a paid plan or an order paid to a supplier waits for the owner's yes unless the
   shop brief's money setting says the team may go ahead.
4. **The keys never leave the box.** They come to you through a 5dive secret link, never
   chat. Do not print them or the access token, copy them to a teammate or put them in a
   file, a task or a message.
5. **Buyer details are the buyer's.** Use a name or address only to ship that order.

## The owner's one-time setup

Amazon lets a seller connect their own tools, but the owner has to do it once, in Seller
Central, as the account's main user. Send them this list:

1. **Professional selling plan.** The API is not open to the Individual plan. Settings >
   Account Info > Your Services.
2. **Developer profile:** Apps and Services > Develop Apps > Proceed to developer profile.
   Choose the private option ("my own company only"). Roles: **Product Listing** and
   **Inventory and Order Tracking**. Add **Direct-to-Consumer Shipping** only if the team
   needs buyer addresses (it gets a longer review). Amazon reviews the profile and may ask
   questions by email; answer within 5 days.
3. **Add a new app client** once approved: name "5dive team", type SP API. Open "View" on its
   LWA credentials: a Client ID and a Client Secret.
4. **Authorize the app** on the same page. Copy the refresh token it shows.
5. **Give the team three values through the secure link:** `SPAPI_LWA_CLIENT_SECRET`,
   `SPAPI_REFRESH_TOKEN`, and the Client ID as `SPAPI_CLIENT_ID_KEY`. Also the Merchant
   Token (Settings > Account Info > Merchant Token), which is not secret: write it in the
   shop brief.

The refresh token does not expire unless the owner removes the app. If the owner ever
changes the app's client secret, they send the new one the same way.

## Connect

Pick the region of the marketplace the owner sells in:

| Marketplace | Region host | Marketplace id |
| --- | --- | --- |
| US | sellingpartnerapi-na.amazon.com | ATVPDKIKX0DER |
| Canada | sellingpartnerapi-na.amazon.com | A2EUQ1WTGCTBG2 |
| UK | sellingpartnerapi-eu.amazon.com | A1F83G8C2ARO7P |
| Germany | sellingpartnerapi-eu.amazon.com | A1PA6795UKMFR9 |
| France | sellingpartnerapi-eu.amazon.com | A13V1IB3VIYZZH |
| Australia | sellingpartnerapi-fe.amazon.com | A39IBJ37TRP1C6 |

```sh
SP=https://sellingpartnerapi-na.amazon.com; MKT=ATVPDKIKX0DER; SELLER=<merchant token from the shop brief>
SP_TOKEN=$(curl -sS -X POST https://api.amazon.com/auth/o2/token \
  --data-urlencode grant_type=refresh_token --data-urlencode "refresh_token=$SPAPI_REFRESH_TOKEN" \
  --data-urlencode "client_id=$SPAPI_CLIENT_ID_KEY" --data-urlencode "client_secret=$SPAPI_LWA_CLIENT_SECRET" | jq -r .access_token)
sp() { curl -sS -H "x-amz-access-token: $SP_TOKEN" -H 'user-agent: 5dive-team/1.0' -H 'Content-Type: application/json' "$@"; }
sp "$SP/sellers/v1/marketplaceParticipations" | jq '.payload[] | {id: .marketplace.id, name: .marketplace.name, active: .participation.isParticipating}'
```

The access token lasts an hour. Get a new one the same way when a call answers
`Unauthorized`.

## Jobs

Listings are found by the owner's SKU. The SKU is in the listing in Seller Central or in
the shop brief.

### Read a listing

```sh
sp "$SP/listings/2021-08-01/items/$SELLER/<sku>?marketplaceIds=$MKT&includedData=summaries,attributes,offers,issues" \
  | jq '{sku, status: .summaries[0].status, title: .summaries[0].itemName, asin: .summaries[0].asin, offers, issues}'
```

`issues` lists what stops it selling. Read it before you change anything.

### Set the price

```sh
sp -X PATCH "$SP/listings/2021-08-01/items/$SELLER/<sku>?marketplaceIds=$MKT&mode=VALIDATION_PREVIEW" -d '{
  "productType": "<productType from the read>",
  "patches": [{"op": "merge", "path": "/attributes/purchasable_offer", "value": [{
    "marketplace_id": "ATVPDKIKX0DER", "currency": "USD", "audience": "ALL",
    "our_price": [{"schedule": [{"value_with_tax": 24.00}]}]}]}]
}' | jq '{status, issues}'
```

`VALIDATION_PREVIEW` checks the change without making it. With no `issues`, send the same
request without `&mode=VALIDATION_PREVIEW`. Read it back after a minute.

### Take it off sale, or back on

Set the quantity to 0 to stop sales without losing the listing, and back to a number to sell
again:

```sh
sp -X PATCH "$SP/listings/2021-08-01/items/$SELLER/<sku>?marketplaceIds=$MKT" -d '{
  "productType": "<productType>",
  "patches": [{"op": "merge", "path": "/attributes/fulfillment_availability", "value": [{"fulfillment_channel_code": "DEFAULT", "quantity": 0}]}]
}' | jq '{status, issues}'
```

### Delete a listing

```sh
sp -X DELETE "$SP/listings/2021-08-01/items/$SELLER/<sku>?marketplaceIds=$MKT" | jq '{status, issues}'
```

This removes the owner's offer, not the Amazon product page. Prefer quantity 0 unless the
owner asked to delete it.

### New listings

A new listing needs Amazon's full product form for its category (often 30 or more fields),
and a product that already exists on Amazon must be matched to its page. Make the first
listing for a product in Seller Central with the owner; after that this skill keeps it
priced and stocked.

### List orders

```sh
sp "$SP/orders/2026-01-01/orders?marketplaceIds=$MKT&createdAfter=2026-10-20T00:00:00Z&fulfilledBy=MERCHANT&includedData=FULFILLMENT" \
  | jq '.orders[] | {orderId, createdTime, status: .fulfillment.fulfillmentStatus, shipBy: .fulfillment.shipByWindow.latestDateTime, items: [.orderItems[]? | {sku: .product.sellerSku, quantity: .quantityOrdered}]}'
```

`fulfilledBy=MERCHANT` keeps only the orders the shop ships itself. This orders version is new
(2026) and the field names above are from its docs, not a live run: the first time, look at
one whole order (`jq '.orders[0]'`) and fix the names before you rely on the list. The older
`/orders/v0/orders` still answers until March 2027.

### List late orders

Amazon gives each order its own ship-by date. Late means not shipped and past it:

```sh
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
sp "$SP/orders/2026-01-01/orders?marketplaceIds=$MKT&createdAfter=<30 days ago>&fulfilledBy=MERCHANT&fulfillmentStatuses=UNSHIPPED&includedData=FULFILLMENT" \
  | jq --arg now "$NOW" '.orders[] | select(.fulfillment.shipByWindow.latestDateTime < $now) | {orderId, shipBy: .fulfillment.shipByWindow.latestDateTime}'
```

Late shipments count against the account. Tell the owner about any late order the same day.

### Mark an order shipped

```sh
sp -X POST "$SP/orders/v0/orders/<orderId>/shipmentConfirmation" -d '{
  "marketplaceId": "ATVPDKIKX0DER",
  "packageDetail": {
    "packageReferenceId": "1", "carrierCode": "Other", "carrierName": "<carrier>",
    "shippingMethod": "Standard", "trackingNumber": "<number>", "shipDate": "<now, ISO>",
    "orderItems": [{"orderItemId": "<from the order>", "quantity": 1}]
  }
}' -w '%{http_code}\n'
```

`204` means accepted. Read the order back and check its status moved to shipped. Do it only
when the supplier has a real tracking number: Amazon checks it.

## When something fails

- **`issues` in a listing answer:** each one names an attribute. Fix that value and send
  again. Do not switch to Seller Central to get around it.
- **`Unauthorized` or `Access to requested resource is denied`:** get a new access token. If
  it persists, the app lacks the role for that job (step 2 of the setup); tell the owner
  which role.
- **`QuotaExceeded` (429):** wait a few seconds and try once more.

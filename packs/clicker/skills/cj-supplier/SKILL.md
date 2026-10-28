---
name: cj-supplier
description: >-
  Order from CJdropshipping through its own API instead of clicking through the CJ site:
  find a product and its variant, check shipping cost and time, create the order for a
  buyer's address, stop before paying for the owner's yes, then pay from the CJ balance and
  read the tracking number. Use this whenever the shop's supplier is CJdropshipping ("CJ",
  cjdropshipping.com) and the job is "order this for the buyer", "what does shipping cost",
  "how long to the US", "has it shipped", or "get the tracking number". Use the browser
  only for what this cannot do: the sign-up and the key (you make both), topping up the
  balance and disputes.
compatibility: "Needs curl and jq, and the 5dive browser for the one-time sign-up and key. The owner only signs in with their own Google, or taps a captcha. Not tried live yet: no CJ account was available when this was written."
metadata:
  author: 5dive
  version: "0.10"
  license: company-agnostic
  tried-live: "no"
---

# CJdropshipping supplier

**Not tried live yet.** Every call below comes from CJ's own API docs
(developers.cjdropshipping.com, API 2.0), but no team has run it against a real CJ account.
The first time you use it, run the order with `"isSandbox": 1` first (step 4) and tell your
lead what came back.

## The rules

1. **Nothing is paid without the owner's yes.** Create the order unpaid (`payType: 3`), show
   the owner the total, then pay. "Go ahead" for one order is not a yes for the next one,
   unless the shop brief's money setting says the team may pay supplier orders up to an
   amount.
2. **Read back every order.** A `success: true` is not checked yet. Read the order and
   compare the address, the variant, the quantity and the price.
3. **One request a second.** CJ allows one call per second on most accounts. Wait a second
   between calls; on `429` or code `1600200`, wait and try once more.
4. **The key never leaves the box.** It comes to you through a 5dive secret link, never chat.
   Do not print it or the tokens, copy them to a teammate or put them in a file, a task or a
   message.
5. **The buyer's address is the buyer's.** Use it for this order only. Do not save it
   anywhere else.

## Connect the account (once)

You make the account and the key yourself, in the browser. The owner is never asked to make
an account or copy a key.

1. **Sign up** on cjdropshipping.com with "Continue with Google". The sign-in is the owner's
   own: run the **browser:connect-site** handover for Google and wait. A captcha is the only
   other thing you hand them, as the viewer link, one tap. Never type a password.
2. **Make the key:** Apps > Install App > API, then the API tab, Add API, type API Key.
3. **Store it without showing it.** Read it off the page and pipe it straight in:
   `sudo 5dive secret write CJ_API_KEY --connector=tools` (value on stdin). It then lands in
   every teammate's shell. That verb needs an admin seat. If yours is refused, tell your lead in
   one line: "CJ key made, on CJ's API page; please store it", and the lead reads it from the
   same page into the same command. Never put it in chat, a file, a task or a message.
4. **Get a token.** It lasts 180 days. Asking again inside a day returns the same one.

   ```sh
   CJ=https://developers.cjdropshipping.com/api2.0/v1
   CJ_TOKEN=$(curl -sS -X POST "$CJ/authentication/getAccessToken" -H 'Content-Type: application/json' \
     -d "{\"apiKey\": \"$CJ_API_KEY\"}" | jq -r '.data.accessToken')
   cj() { curl -sS -H "CJ-Access-Token: $CJ_TOKEN" -H 'Content-Type: application/json' "$@"; }
   cj "$CJ/shopping/pay/getBalance" | jq '.data'
   ```

   A balance back means connected. Keep `CJ_TOKEN` in your shell only.

## Jobs

### Find the product and its variant

The shop brief or the listing names the CJ product. Look it up by its CJ SKU, or search:

```sh
cj "$CJ/product/query?productSku=CJ123456" | jq '.data | {pid, productNameEn, sellPrice, variants: [.variants[] | {vid, variantSku, variantNameEn, variantSellPrice}]}'
cj "$CJ/product/listV2?keyWord=matcha%20whisk&page=1&size=10" | jq '.data'
```

The `vid` is what you order. Pick the variant the buyer bought (size, colour).

### Shipping cost and time

```sh
cj -X POST "$CJ/logistic/freightCalculate" -d '{"startCountryCode": "CN", "endCountryCode": "US", "zip": "10001", "products": [{"vid": "<vid>", "quantity": 1}]}' \
  | jq '.data[] | {logisticName, logisticPrice, logisticAging}'
```

`logisticAging` is days in transit. Pick the cheapest option that keeps the shop's delivery
promise, and keep its `logisticName` for the order.

### Create the order, unpaid

```sh
cj -X POST "$CJ/shopping/order/createOrderV2" -d '{
  "orderNumber": "<shop order number>",
  "payType": 3,
  "shippingCountryCode": "US", "shippingCountry": "United States",
  "shippingProvince": "NY", "shippingCity": "New York", "shippingZip": "10001",
  "shippingAddress": "<street and number>", "shippingCustomerName": "<buyer name>",
  "shippingPhone": "<buyer phone>",
  "logisticName": "<from the shipping check>", "fromCountryCode": "CN",
  "products": [{"vid": "<vid>", "quantity": 1}]
}' | jq '.'
```

`payType: 3` creates the order without paying. Use the shop's own order number as
`orderNumber` so both sides match. **The first time**, add `"isSandbox": 1`: CJ pretends to
pay and nothing is charged. Check what comes back, then send it again without it.

### Read it back, then ask the owner

```sh
cj "$CJ/shopping/order/getOrderDetail?orderId=<shop order number>" | jq '.data | {orderId, orderStatus, productAmount, postageAmount, orderAmount, shippingAddress, products: [.productList[]? | {vid, quantity}]}'
```

Send the owner one line: what, to whom (city only), the total in dollars and the delivery
time. "Pay CJ $14.20 for the whisk to Ana in Austin, about 8 days?" Wait for the yes.

### Pay from the CJ balance (after the yes only)

```sh
cj -X POST "$CJ/shopping/pay/payBalance" -d '{"orderId": "<CJ order id>"}' | jq '.'
cj "$CJ/shopping/order/getOrderDetail?orderId=<CJ order id>" | jq '.data | {orderStatus, actualPayment}'
```

If the balance is too low, tell the owner the amount to top up on cjdropshipping.com. Do not
switch to card payment in the browser.

### Has it shipped?

```sh
cj "$CJ/shopping/order/getOrderDetail?orderId=<CJ order id>" | jq '.data | {orderStatus, trackNumber, trackingProvider, trackingUrl}'
```

When `trackNumber` is filled, hand it to whoever marks the shop order shipped (the
shopify-store or woocommerce-store skill does that step).

## When something fails

- **`success: false`:** read `message`. It usually names the field (an address part, the
  `logisticName`, a `vid` that is out of stock). Fix it and send again.
- **Token rejected:** get a new one (Connect, step 4). If that fails too, the key was removed;
  make a new one on CJ's API page (Connect, step 2) and store it again.
- **Anything this skill does not cover:** CJ's docs are at
  developers.cjdropshipping.com (API 2.0). Do not guess a field name.

---
name: trading-scripts
description: >-
  Write the Python tools a trading desk runs: exchange order scripts (ccxt), copy-trading of a
  wallet or a trader, and chain watchers (web3.py or RPC subscriptions) that alert the desk to
  big transfers, new pools or moves by a watched wallet. Every script starts in dry-run, reads
  keys only from the environment after they arrive through a 5dive secret link, enforces the
  owner's money setting and the mandate's limits in code with a kill switch, is tested on
  recorded data before it runs live, and logs every order. Use for "write a script to buy on
  Binance when", "copy this wallet's trades", "watch this wallet", "alert me on new pools",
  "automate our entries", or any desk automation that can place an order.
compatibility: "Python 3 with ccxt, web3.py or solana-py, and a public or paid RPC endpoint. Live trading needs an exchange or wallet key delivered through a 5dive secret link."
metadata:
  author: 5dive
  version: "1.0"
  license: company-agnostic
---

# Trading scripts

You write the desk's tools. A script that can place an order can lose the whole account in a
minute if it loops, misreads a price or gets the wrong key, so the safety lives in the code,
not in a promise. A tool that cannot prove it stays inside the limits does not run live.

## The rules that never bend

- **Dry-run is the default, and it comes first.** Every script that can place an order starts
  in dry-run: it prints the exact order it would place (market, side, size, price) and
  places nothing. Live needs an explicit `--live` flag on the command line, never a default
  in the code. A new script runs in dry-run against the real market before its first live
  run.
- **Keys arrive only through a 5dive secret link.** Ask for a key with
  `5dive task need <task> --type=secret --secret-key=<NAME> --connector=<stem>`, and read it
  from the environment (`os.environ["<NAME>"]`). Never write a key, a seed phrase or a
  password in code, a file, a log, a commit or chat, and never ask for one in chat. If a key
  is pasted in chat, treat it as burned: say so and ask for a new one through the link. Ask
  for the narrowest key the exchange offers: trade only, **no withdrawals**, IP-locked to this
  server if it can be.
- **The limits are enforced in the code, with a kill switch.** Every path that can place an
  order checks, before the order goes out:
  - the owner's money setting (what the desk may spend at all),
  - the mandate's largest position, per market and in total,
  - the mandate's largest loss, for the day and in total, measured from the account's real
    balance and fills, not from the script's memory.
  A breach refuses the order and alerts the lead. The script **refuses to start live** if any
  limit is missing. A **kill switch** stops all orders at once: a `KILL` file in the script's
  folder (or the env var `TRADING_KILL=1`), checked before every order, and tripped
  automatically when the loss limit is hit. A tripped switch stays tripped until a person
  clears it.
- **Tested on recorded data before it runs live.** Record real market data or chain events to
  a file, replay them through the script in dry-run, and check every order it would have
  placed, including what happens on a gap, a stale price, a rejected order and a lost
  connection. Keep the recording and the test with the script.
- **Every order is logged.** One line per order, before it is sent and after the reply: time,
  market, side, size, price, dry-run or live, the order id, and the exchange's answer. A
  rejected order is logged as rejected, with what it said. Never log a key.
- **Read the fill back.** After a live order, read the order and the balance back from the
  exchange or the chain. "Sent" is not "filled".

## What you build

### Exchange order scripts

- Use **ccxt** for centralised exchanges, so one script works across exchanges. Use the
  exchange's testnet where one exists (`exchange.set_sandbox_mode(True)`) for the first runs.
- Limit orders by default; a market order only where the mandate allows it, with a maximum
  slippage the script checks against the order book first.
- Round sizes and prices to the market's own precision and minimums (`exchange.markets`), or
  the exchange rejects the order.
- Handle rate limits (`enableRateLimit: True`), timeouts and partial fills; never retry an
  order without first checking whether the last one went through.

### Copy-trading

- Watch the trader's wallet (or their public account, where the exchange offers it) and
  turn each of their trades into a desk order, **scaled to the desk's size and capped by the
  desk's limits**, never a mirror of their size.
- Skip a copy when the price has moved past a set distance from their fill, when the token
  has no verdict from **smart-contract-audit**, or when it would breach a limit. Log every
  skip with its reason.
- A wallet worth copying today can dump on its copiers tomorrow: track the copied trades'
  results separately, and stop copying a wallet whose results go bad.

### Chain watchers

- Subscribe instead of polling where the RPC allows it: on EVM, `eth_subscribe` to `logs`
  (ERC-20 `Transfer` events, a DEX factory's pool-created event) or `newHeads` over a
  websocket with **web3.py**; on Solana, `logsSubscribe` or `accountSubscribe`.
- Watch for what the desk asks: big transfers of a token (in token and in dollars), new pools
  on the exchanges the desk trades, any move by a watched wallet, liquidity pulled from a
  pool the desk holds.
- An alert goes to the crowd researcher and the lead (Dude and Quant on the Trading Desk) with
  `5dive agent send`: what happened, the amount, the transaction link, and why it matters.
  Group bursts: one message for twenty transfers, not twenty messages.
- A watcher that goes quiet looks the same as a quiet market. Log a heartbeat, reconnect on a
  dropped websocket, and alert the lead if the watcher has been down longer than its gap.

## Hand-off

Each script ships with: what it does in one line, how to run it in dry-run and live, the
limits it enforces and where their numbers come from, the key names it reads, the recorded
data it was tested on and the result. The lead says yes before the first live run.

## Log every miss

A bug that placed a wrong order, a limit that did not hold, an exchange quirk: write it down
with **compile-knowledge**, and if your team keeps a shared notebook (a wiki), write it
there too. Never write keys, balances or logins there.

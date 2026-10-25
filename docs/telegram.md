# Telegram for Mission Control

Mission Control's backend (`server/telegram.js`) runs a Telegram bot (ours: **@Local_LLM_Hack_bot**).
Tested end-to-end on Oct 25, 2026: phone order → Support → Procurement → Dispatch → confirmation,
plus blocked-egress alerts and Approve/Reject escalations to the ops chat.

## What it does

**Customers** (anyone who messages the bot):
- Ask about a shipment, or place an order in plain words:
  `Ship 10 pallets of avocados from Fresno to Seattle by Friday`
- They get **📦 Got it. Order PO-… created** right away, then **✅ Order PO-… confirmed**
  (route, carrier, deadline) once Dispatch schedules it. Every step shows live on the dashboard.
- Limits: one message per 30 s per chat, 500 characters.

**Ops manager** (one chat, set by `TELEGRAM_ALERT_CHAT_ID`):
- **🚨 BLOCKED by egress policy** alerts when an agent tries to send data somewhere it shouldn't.
- **⚠️ Escalation needs a human** with **✅ Approve / ❌ Reject** buttons (refunds over $5,000,
  legal threats). The decision shows on the dashboard.
- Commands only this chat can use: `/status`, `/pause`, `/surge`, `/supplier`, `/inject`.

## Setup

1. **Bot token.** In Telegram open **@BotFather** (blue checkmark) → `/newbot`, or reuse
   `@Local_LLM_Hack_bot`'s token from the team's password manager. Never commit the token.
2. **Your chat ID** (to become the ops manager): start the server once without
   `TELEGRAM_ALERT_CHAT_ID`, send `/start` to the bot, and read
   `[telegram] /start from chat <id>` in the server log.
3. **Run it** on the GB10 (bash):

```bash
read -rsp "Telegram bot token: " TELEGRAM_BOT_TOKEN && echo && export TELEGRAM_BOT_TOKEN
```

```bash
TELEGRAM_ALERT_CHAT_ID=<your chat id> MODEL=nemotron-3.5-super:120b node server/server.js
```

Or let the setup script ask for the token (hidden input): `TELEGRAM_ALERT_CHAT_ID=<id> bash setup-gb10.sh`.
On macOS (zsh) use `read -rs "?Telegram bot token: " TELEGRAM_BOT_TOKEN` instead of `read -rsp`.

The log should show `[telegram] connected as @<bot>, ops chat <id>`.

## Test it (2 minutes)

1. From your phone: `/start`, then an order (see above). Expect both replies.
2. Dashboard button **Malicious Email** (or `/inject` from the ops chat): the ops chat gets 🚨.
3. Escalation without Telegram: `curl -X POST localhost:8080/api/inbound -H 'Content-Type: application/json' -d '{"from":"Acme Corp","text":"Our load spoiled. We demand a $12,000 refund or our lawyers get involved."}'`
   The ops chat gets ⚠️ with buttons; tap one.

No phone or Telegram down? `POST /api/inbound` (`{"from","text"}`) sends the same customer message
through the swarm, handy as a demo fallback.

## Rules and gotchas

- **One process per bot token.** If two servers (e.g. a laptop and the GB10, or Mission Control
  and NemoClaw's OpenClaw) poll the same token, Telegram returns `409 Conflict`. Stop the other
  one, or give OpenClaw its own bot (see `docs/openclaw.md`).
- **Outbound only.** The bot uses long polling: the GB10 needs outgoing access to
  `api.telegram.org` (it's on the egress allowlist), no public URL or open port.
- **Wifi off.** The bot pauses; agents keep working. Messages wait on Telegram's side and are
  delivered when the network returns. Telegram errors stay in the server log, never on the dashboard.
- **Venue networks** can be slow to reach Telegram (we saw ~15 s to connect). If messages lag,
  check the log for `poll failed` and test from a phone hotspot.
- **Privacy.** Customers' chat IDs stay on the box; agents and `/api/state` never see them.

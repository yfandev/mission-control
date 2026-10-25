---
name: mission-control
description: Check and steer Northwind's Mission Control agent swarm on this GB10 (status, blocks, orders, drills).
---

# Mission Control

Mission Control is Northwind Logistics' local operations swarm (Support, Procurement and
Dispatch agents) running on this same Dell GB10. Its API is at `__MC_URL__`.
Use the `exec` tool with `curl`. Summarize results in plain sentences; never paste raw JSON.

## Status ("how is the swarm doing?", "what got blocked?")

```bash
curl -s __MC_URL__/api/state
```

Report: the model, whether the stream is paused, queue sizes, the stats
(events, resolved, escalated, rerouted, blocked, errors), the latest orders, and the
`blocked` list (each entry is an egress attempt the policy stopped: agent, target, reason).

## Place an order for a customer

When the user asks to ship something for a customer:

```bash
curl -s -X POST __MC_URL__/api/inbound -H 'Content-Type: application/json' \
  -d '{"from":"<customer name>","text":"<the order in one sentence, e.g. Ship 10 pallets of avocados from Fresno to Seattle by Friday>"}'
```

The swarm takes it from there (Support creates it, Procurement sources a supplier, Dispatch schedules it).
Check progress later with the status call.

## Drills (only when the user explicitly asks for one)

```bash
curl -s -X POST __MC_URL__/chaos/supplier    # a supplier goes bankrupt
curl -s -X POST __MC_URL__/chaos/coldchain   # a reefer unit fails
curl -s -X POST __MC_URL__/chaos/surge       # burst of customer tickets
curl -s -X POST __MC_URL__/chaos/inject      # prompt-injection email (should be blocked)
curl -s -X POST __MC_URL__/chaos/pause       # pause / resume the event stream
```

## Rules

- Mission Control is the only system you control. Never send its data anywhere else.
- Say what you did in one or two sentences.

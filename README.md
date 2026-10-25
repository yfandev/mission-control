# Mission Control · Northwind Logistics

> Cinematic, dark-theme command-center UI for a swarm of local AI agents running a logistics company's operations.

![Mission Control](https://img.shields.io/badge/Status-Offline--Capable-00ff88?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-Vanilla%20HTML5%20%7C%20CSS3%20%7C%20JS-00f0ff?style=flat-square)
![Inference](https://img.shields.io/badge/Inference-Local%20GB10-ffb700?style=flat-square)

---

## Overview

**Mission Control** is an air-gapped, zero-cloud operations dashboard designed for local AI agent swarms. It visualizes high-frequency autonomous logistics decisions across support ticketing, carrier procurement, and route dispatching with strict egress sandbox enforcement.

- **100% Local & Offline**: Self-contained single file (`ui/index.html` and `index.html`) with zero CDN dependencies, system typography, and inline SVG assets.
- **Real-Time Node Topology**: 60fps particle and pulse engine mapping interactions between the Event Stream ingress, agent swarm, and the egress quarantine sandbox.
- **Fail-Safe Mock Simulator**: Connects to same-origin SSE at `/events`; seamlessly activates built-in simulation if disconnected or initialized with `?mock=1`.

---

## Topology & Swarm Architecture

```
[ EVENT STREAM ] ─────────► [ SUPPORT AGENT ] ──────────┐
(Ingress Pipeline) ──────► [ PROCUREMENT AGENT ] ──────┼──► [ SANDBOX POLICY ]
                   ──────► [ DISPATCH AGENT ] ─────────┘   (Egress Allowlist)
                                  ▲
                         (Handoff Arcs)
```

1. **Event Stream** (`left`): Ingress pipeline capturing real-time freight signals, telematics, and EDI manifests.
2. **Support Agent** (`middle-top`): Handles temperature variance alerts, customer claims, and customs holds.
3. **Procurement Agent** (`middle-center`): Dynamically negotiates fuel surcharges, issues purchase orders, and tenders chassis.
4. **Dispatch Agent** (`middle-bottom`): Manages automated routing, carrier selection, dock appointments, and Hours-of-Service checks.
5. **Sandbox Policy** (`right`): Hardened egress security gate inspecting outbound network calls and quarantining policy violations.

---

## Real-Time SSE Specification

The client listens to `new EventSource('/events')`. Every JSON line adheres to:

```json
{
  "id": "evt-10492",
  "t": 1777134643000,
  "type": "event | action | handoff | blocked | telemetry | sys | error",
  "stats": {
    "events": 142,
    "resolved": 108,
    "escalated": 12,
    "rerouted": 19,
    "blocked": 3,
    "errors": 1
  }
}
```

### Event Payload Variations

| Type | Key Properties | Visualization Response |
| :--- | :--- | :--- |
| `event` | `agent`, `kind`, `detail` | Neon cyan particle stream to agent; agent highlight |
| `action` | `agent`, `tool`, `detail` | Emerald green particle from agent to Sandbox; tool badge display |
| `handoff` | `from`, `to`, `detail` | Amber particle traversing inter-agent arc; dual node highlight |
| `blocked` | `agent`, `host`, `detail` | Crimson particle to Sandbox, graph shake, alarm tone, 3s red alert banner |
| `telemetry` | `ms`, `tps` | Model latency and tokens/sec telemetry gauges |
| `sys` | `memUsedGB`, `memTotalGB`, `model` | VRAM / system memory bar and active model title |
| `error` | `agent`, `detail` | Rose warning outline and error log entry |

---

## Chaos Injection Endpoints

Buttons trigger `POST` requests without bodies to the same origin:

- `POST /chaos/supplier`: Simulates sudden supplier bankruptcy, triggering emergency tenders and fleet reallocations.
- `POST /chaos/surge`: Injects rapid burst of inbound freight customer inquiries across multiple distribution hubs.
- `POST /chaos/inject`: Triggers a malicious prompt injection attempting outbound key exfiltration, intercepted by the Sandbox Policy enforcer.
- `POST /chaos/pause`: Toggles event stream processing.

---

## File Structure

```
├── ui/
│   └── index.html      # Fully self-contained single-file deployment (HTML/CSS/JS)
├── index.html          # Root preview entrypoint (identical self-contained app)
├── metadata.json       # Applet metadata
├── package.json        # Dev server harness
└── README.md           # Project documentation
```

---

## Quick Start

### Local Development
```bash
npm install
npm run dev
# Opens at http://localhost:3000 (includes automatic mock simulator)
```

### Static Serving (Internet Off)
Simply open `ui/index.html` directly in any modern browser without an active network connection.
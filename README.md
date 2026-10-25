# Mission Control · Autonomous Logistics AI Factory

> High-frequency operations command center and autonomous multi-agent swarm running 100% locally on the **Dell Pro Max with NVIDIA GB10 (Grace Blackwell, 128GB Unified Memory)**.

![Status](https://img.shields.io/badge/Status-100%25%20Air--Gapped%20Offline-00ff88?style=flat-square)
![Hardware](https://img.shields.io/badge/Hardware-Dell%20Pro%20Max%20GB10%20(128GB)-ffb700?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-NemoClaw%20%7C%20OpenShell%20%7C%20OpenClaw-00f0ff?style=flat-square)
![Swarm](https://img.shields.io/badge/Swarm-15%20Autonomous%20Agents-b55fe6?style=flat-square)
![Architecture](https://img.shields.io/badge/Spec-v1%20%E2%86%92%20v2%20%E2%86%92%20v3%20Unified-3b82f6?style=flat-square)

---

## Specification Roadmap & Teammate/Agent Contribution Matrix

To ensure full transparency and seamless collaboration across our distributed engineering team, each iteration of Mission Control is documented below with clear traceability of incremental changes, responsible teammates, and their respective coding agents.

| Version | Core Architecture & Strategic Focus | Contributing Teammate | Coding Agent | Key Deliverables & Innovations |
| :--- | :--- | :--- | :--- | :--- |
| **v1** | **Core Swarm & Logistics Baseline**<br>Foundational 3-agent pipeline (Support, Procurement, Dispatch) | Distributed Systems Team | *Backend Coding Agent* | • Zero-dependency Node 18+ SSE runtime (`/events`)<br>• Core SSE schema (`event`, `action`, `handoff`, `blocked`, `telemetry`, `sys`)<br>• GB10 tuning & flash-script (`setup-gb10.sh`)<br>• Basic 4-scenario chaos suite (`supplier`, `coldchain`, `surge`, `inject`) |
| **v2** | **15-Agent Swarm & 3D Penthouse Office**<br>Autonomous enterprise scaling & executive command center | yfandev & UI Architecture Team | *Frontend / 3D Coding Agent* | • Expansion to 15 specialized agents across 4 tiers (Perception, Operations, Governance, Control)<br>• Isometric 3D Penthouse Canvas (floor-to-ceiling glass, natural sunlight, AC vents, coffee bar, living green walls, ambient acoustic audio)<br>• Procedural biped humanoid avatars with inverse-kinematics animations<br>• Incident DAG execution engine & cryptographic audit logging |
| **v3** | **24/7 Wholesale Terminal & Port Cross-Dock**<br>Physical walk-in ingress & 100% air-gapped on-premise business model | yfandev | *Architecture & Strategy Agent* | • Solves the "offline paradox" via **physical walk-in gate kiosks & dock counter terminals** (no internet needed)<br>• High-stakes fresh produce cold-chain exchange ($15M morning trading window)<br>• Sub-second local IoT reefer telemetry ingestion<br>• Walk-in order intake & rapid dispute triage workflows<br>• Ironclad Dell on-premise hardware defense |

---

# [v3 Specification] The 24/7 Wholesale Terminal & Port Cross-Dock (Physical Walk-In Model)

### 1. The Core Problem: The "Offline Paradox"
In conventional logistics software, claiming an application is "100% offline-first and on-premise" falls apart the moment a customer must connect over the public internet to submit a load order or support ticket. If cloud connectivity is required for customer ingress, an upstream ISP failure still cripples the business.

### 2. The Solution: Physical Walk-In Ingress & Local Dock Terminals
**v3** establishes the definitive, commercially viable business scenario: **Northwind operates the Regional Wholesale Terminal & Cross-Dock Logistics Facility** (modeled after high-intensity operations like the San Francisco Wholesale Produce Market or Hunts Point Terminal).

* **Zero Cloud Dependency:** Customers do not place orders from a remote web app. Commercial buyers, restaurant group purveyors, and long-haul refrigerated fleet drivers **physically walk up to the facility's dock counter terminals, drive up to weigh-station kiosks, or connect to the isolated facility intranet**.
* **High-Stakes Operating Window:** Between **2:00 AM and 6:00 AM**, over **$15,000,000 of fresh perishables** (strawberries, avocados, seafood, temperature-sensitive pharmaceuticals) change hands. Over 80 refrigerated tractor-trailers arrive, cross-dock, and dispatch within 240 minutes.
* **Cost of Downtime:** If internet connectivity drops or cloud APIs throttle, gate check-ins stall, reefer compressors burn diesel idling on city streets, and fruit temperature excursions begin. A 30-minute delay costs over $100,000 in spoiled cargo and SLA penalties.
* **The Dell On-Premise Imperative:** The entire 15-agent swarm runs locally on the **Dell Pro Max with NVIDIA GB10** installed inside the terminal dockmaster office. If outside fiber or cellular towers go dark, the wholesale terminal operates at full capacity without interruption.

```
                      PHYSICAL FACILITY PERIMETER (Zero Public Internet)
                      
  [ Physical Walk-In Buyers ]         [ Drive-Up Fleet Drivers ]       [ Local Reefer IoT Probes ]
  (Wholesale Produce Purveyors)       (Loading Bay Weigh-Stations)     (Trailer Temp & Door Sensors)
               │                                   │                                 │
               ▼                                   ▼                                 ▼
   ┌──────────────────────┐            ┌──────────────────────┐          ┌──────────────────────┐
   │ Dock Counter Kiosk   │            │ Gate Weigh Kiosk     │          │ Local Modbus / MQTT  │
   │ (Touchscreen / LAN)  │            │ (Barcode / BOL Scan) │          │ (RS-485 / Zigbee)    │
   └──────────┬───────────┘            └──────────┬───────────┘          └──────────┬───────────┘
              │                                   │                                 │
              └─────────────────┬─────────────────┴─────────────────────────────────┘
                                │ (Local Gigabit Ethernet / Isolated Warehouse LAN)
                                ▼
         ┌──────────────────────────────────────────────────────────────┐
         │     DELL PRO MAX ON-PREMISE AI FACTORY (NVIDIA GB10)         │
         │                                                              │
         │   [ Triage Controller ] ──► [ Perception & Operations Swarm] │
         │   (Walk-in Queue Triage)    (15 Agents on Nemotron-120B)     │
         │                                      │                       │
         │   [ Automated BOL Print ] ◄──────────┴──► [ Dock Bay Assign] │
         └──────────────────────────────────────────────────────────────┘
```

### 3. Walk-In Customer Workflows

#### A. Walk-In Order Placement (Bay Allocation & Load Release)
1. **Physical Customer Arrival:** At 3:15 AM, a commercial buyer from a regional supermarket chain walks up to Dock Counter Terminal #2.
2. **Order Entry via Touchscreen Kiosk:**
   * *"Release 10 pallets of Watsonville organic strawberries from Cold Vault A, add 4 pallets of Haas avocados from Bay 6, dispatch to Sacramento Depot by 08:00 AM."*
3. **Local Swarm Execution:**
   * `triage` classifies the request as a priority perishable cross-dock.
   * `procurement` verifies local warehouse inventory and assigns loading dock #4.
   * `dispatch` locks in a dual-temp reefer trailer and generates a digital Bill of Lading (BOL).
4. **Physical Output:** The counter printer immediately produces the signed physical pick-sheet and gate pass. Total time: **180 milliseconds**.

#### B. Walk-In Support & Temperature Breach Resolution
1. **Driver Dispute at Receiving Bay:** At 4:30 AM, an arriving driver at Bay 8 scans their trailer manifest. The receiving inspector flags that Pallet #4 shows a surface temperature of 45°F (exceeding the 34°F–38°F cold-chain threshold).
2. **Walk-In Ticket Submission:** The driver taps **"Report Inspection Hold"** on the Bay 8 tablet.
3. **Local Autonomous Resolution:**
   * `telematics` queries the trailer's local blackbox data logger via the dock's wireless link to determine if the temp rise occurred during transit or during dock door opening.
   * `support` inspects the contract terms and routes a claims credit request.
   * `warehouse` immediately reserves a replacement pallet from Cold Vault B to prevent the delivery truck from missing its morning delivery window.
   * If claims cost exceeds $5,000, `orchestrator` raises an immediate visual alert on the Dockmaster's physical screen for one-click human supervisor sign-off.

---

# [v2 Specification] 15-Agent Autonomous Swarm & 3D Penthouse Office

### 1. Architectural Principle: Agent as Config, Not Code
The swarm is completely configurable. No agent identities or tools are hardcoded into frontend render loops:

```typescript
interface AgentConfig {
  id: string;                         // e.g. "triage", "sentinel", "dispatch"
  name: string;                       // e.g. "Triage Controller"
  tier: "perception" | "operations" | "governance" | "control";
  model: "fast" | "main" | "deep";    // fast: 8B, main: 27B-70B, deep: 120B reasoning
  systemPrompt: string;               // Core operational directives
  tools: string[];                    // Permitted tool invocations
  policy: {
    hosts: string[];                  // Outbound network allowlist (OpenShell)
    paths: string[];                  // Filesystem sandbox directory paths
    maxRiskWithoutApproval: number;   // Dollar/risk threshold triggering human escalation
  };
  home: string;                       // Station ID in the 3D Penthouse Office
}
```

### 2. The 15 Autonomous Agents (4 Tiers)

| Tier | Badge Color | Agent ID | Agent Name | Penthouse Zone | Core Responsibility | Model Tier |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Perception** | Cyan | `triage` | Triage Controller | Ingress Counter | Inbound order classification & lane tagging | `fast` (8B) |
| **Perception** | Cyan | `doc_intake` | Document Intake | Intake Kiosk | OCR & validation of paper BOLs and customs manifests | `fast` (8B) |
| **Perception** | Cyan | `telematics` | Telematics Watch | Sensor Hub | Sub-second ingestion of reefer temps and GPS probes | `fast` (8B) |
| **Operations** | Orange | `support` | Support Agent | Service Desk | Driver claims, walk-in inquiries, dock disputes | `main` (70B) |
| **Operations** | Orange | `procurement`| Procurement Agent | Trading Counter | Spot rate index, cross-dock capacity bidding | `main` (70B) |
| **Operations** | Orange | `dispatch` | Dispatch Controller | Dispatch Deck | Bay assignments, reefer routes, driver schedules | `main` (70B) |
| **Operations** | Orange | `customs` | Customs & Compliance | Inspection Pod | Hazmat protocols, agricultural quarantine checks | `main` (70B) |
| **Operations** | Orange | `warehouse` | Warehouse & Dock | Bay Control | Dock slot booking, automated forklift routing | `main` (70B) |
| **Operations** | Orange | `maintenance`| Fleet Maintenance | Diagnostics Pod| Compressor fault detection and emergency mechanic calls | `main` (70B) |
| **Operations** | Orange | `finance` | Finance Auditor | Settlement Desk | Detention fees, instant gate billing, fuel surcharges | `main` (70B) |
| **Governance** | Purple | `sentinel` | Security Sentinel | Air-Lock Gate | Prompt-injection traps, malicious file quarantine | `fast` (8B) |
| **Governance** | Purple | `policy_engine`| Policy Engine | Security Vault | OpenShell dynamic per-agent rule enforcement | `main` (70B) |
| **Governance** | Purple | `auditor` | Cryptographic Auditor| Audit Wall | Tamper-proof SHA-256 hash-chaining of all swarm decisions | `main` (70B) |
| **Control** | Gold | `orchestrator`| Control Orchestrator| Executive Suite | Dynamic multi-agent DAG task graph coordination | `deep` (120B) |
| **Control** | Gold | `memory` | Memory Keeper | Archives Vault | Instant retrieval of historical carrier and lane incidents | `main` (70B) |

### 3. The 3D High-Rise Penthouse Command Center
The frontend delivers a 60 FPS Canvas-rendered 3D modern executive office environment designed for executive review and live hackathon presentations:
* **Architecture & Light:** Floor 68 high-rise penthouse with floor-to-ceiling panoramic glass windows looking out over a bustling downtown skyline. Dynamic sunlight shifts across matte hardwood flooring, complemented by realistic ceiling recessed spotlights and HVAC cooling vents.
* **Executive Amenities:** Integrated artisan espresso coffee bar & barista lounge, living green walls with lush vertical planters, and acoustic background audio synthesized via offline Web Audio API.
* **Humanoid Android Avatars:** 15 procedurally animated biped robots with realistic inverse-kinematic walking strides, torso sway, glowing visor eyes, role-coded chest badges, and contextual state animations (typing at desk, reviewing clipboard, carrying pneumatic transit capsules).
* **Quarantine Security Air-Lock:** Physical red laser barrier that visually locks down when malicious prompts or policy violations are detected.

---

# [v1 Specification] Core Swarm & Logistics Foundations

### 1. Foundational Architecture & Stream Topology
The original v1 foundation established the real-time event-driven communication model:

```
[ EVENT STREAM ] ─────────► [ SUPPORT AGENT ] ──────────┐
(Ingress Pipeline) ──────► [ PROCUREMENT AGENT ] ──────┼──► [ SANDBOX POLICY ]
                   ──────► [ DISPATCH AGENT ] ─────────┘   (Egress Allowlist)
                                  ▲
                         (Handoff Arcs)
```

### 2. Core Server-Sent Events (SSE) Contract
The browser listens to `GET /events`. All messages follow a strict backward-compatible JSON schema:

```typescript
interface CoreSSEMessage {
  id: string;                     // e.g. "evt-10492"
  t: number;                      // Unix millisecond timestamp
  type: "event" | "action" | "handoff" | "blocked" | "telemetry" | "sys" | "error";
  agent?: string;                 // Originating agent ID
  detail?: string;                // Human-readable action summary
  stats: {
    events: number;               // Total events processed
    resolved: number;             // Successful load/ticket resolutions
    escalated: number;            // Actions requiring human review
    rerouted: number;             // Trucks dynamically redirected
    blocked: number;              // Malicious or unauthorized egress attempts
    errors: number;               // Processing exceptions
  };
}
```

### 3. Baseline Chaos Testing Suite
Interactive endpoints to stress-test swarm resilience during live demos:
* `POST /chaos/supplier`: Simulates sudden regional supplier insolvency, triggering automated carrier re-tendering.
* `POST /chaos/coldchain`: Injects a catastrophic compressor failure (+8°F variance) on an active reefer truck, triggering instant route diversion to the nearest cold-storage depot.
* `POST /chaos/surge`: Floods the intake queue with 20 concurrent walk-in customer load requests.
* `POST /chaos/inject`: Simulates a prompt injection payload attempting to exfiltrate private API keys, intercepted by the security sentinel and quarantine airlock.
* `POST /chaos/pause`: Halts and resumes the simulation loop.

---

## Hardware Validation & Running on Dell GB10

### 1. Prerequisites on the GB10
- **Node.js**: v18+
- **Ollama**: v0.32.9 or newer
- **Target Model**: `nemotron-3-super:120b` (loaded from local NVRAM / LLMDRIVE)

### 2. Launch Commands
```bash
# Automated GB10 setup, model verification, and benchmark
bash setup-gb10.sh

# Start the on-premise Mission Control server
MODEL=nemotron-3-super:120b node server/server.js
```
The server binds to `http://localhost:8080` (or `http://0.0.0.0:8080` on the warehouse intranet). Customers access local kiosks without internet access, and the dockmaster displays the 3D command dashboard at 60 FPS.

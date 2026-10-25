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

# [v3 Specification] The 24/7 Wholesale Terminal & Port Cross-Dock (Physical Walk-In Model)

### 1. Commercial Foundation: Why "Local" is a Business Necessity, Not a Technical Gimmick

In high-velocity perishables and cross-dock freight logistics, **running 100% on-premises on local Dell hardware is not a technical hackathon preference—it is a mandatory operational requirement driven directly by customer economics, physical inspection workflows, and federal legal compliance.**

```
                               THE CUSTOMER & TERMINAL BUSINESS REALITY
                               
   ┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
   │         THE CUSTOMER'S BUSINESS ANGLE        │       │       THE CONTROL CENTER'S BUSINESS ANGLE    │
   │  (Wholesale Buyers, Purveyors, Fleet Drivers)│       │          (Dockmaster, Terminal Operator)     │
   ├──────────────────────────────────────────────┤       ├──────────────────────────────────────────────┤
   │ 1. The "Sensory & Brix" Inspection Test:     │       │ 1. Industrial Cold Rooms are Faraday Cages:  │
   │    Buyers inspect physical pallets in-person │       │    12-inch insulated steel panels block cell │
   │    at 3 AM before committing capital. Must   │       │    and cloud signals. Wired local Ethernet   │
   │    lock that exact physical lot instantly.   │       │    to on-prem Dell is the only reliable link.│
   │                                              │       │                                              │
   │ 2. Costly Detention & HOS Driver Clocks:     │       │ 2. Federal FDA FSMA Rule 204 Liability:      │
   │    Truckers face $150/hr detention fines     │       │    Strict chain-of-custody tracking. If      │
   │    and legal 11-hr drive limits. Local BOL   │       │    cloud drops, trucks leave undocumented    │
   │    printing & gate release in <2 seconds.    │       │    creating severe regulatory & food liability.│
   │                                              │       │                                              │
   │ 3. Fierce Spot-Market Margin Privacy:        │       │ 3. Sub-Second Machinery Automation Safety:   │
   │    Hourly price swings based on overnight    │       │    Forklifts, dock levelers, & thermal doors │
   │    harvests. Shippers refuse to expose spot  │       │    require deterministic <200ms agent loops; │
   │    rates to public cloud model aggregators.  │       │    cloud jitter causes dock collisions & lag.│
   └──────────────────────────────────────────────┘       └──────────────────────────────────────────────┘
```

---

### 2. The Customer's Perspective: Why Wholesale Clients Demand On-Premise Operations

#### A. Physical Inspection Precedes Financial Commitment ("The Sensory & Brix Test")
* **The Reality:** Unlike standard e-commerce or dry freight, **commercial produce and high-value perishables are never bought blind over a remote website**.
* **The Workflow:** At 3:15 AM, buyers from supermarket chains (Safeway, Kroger) and high-end restaurant purveyors arrive in work boots with flashlights, pulp thermometers, and digital refractometers (brix sugar testers). They walk into Cold Room A, open boxes, measure flesh firmness, check leaf crispness, and test core pulp temperatures.
* **Why Cloud Fails Them:** Once a buyer verifies that Pallet #14 is prime quality, they walk straight to the dock counter kiosk to claim that **specific inspected physical pallet**. In a cloud-dependent system, network latency or eventual database consistency means another buyer across the floor could claim the same lot seconds earlier. A local on-premise system provides instantaneous, atomic, zero-latency lot locking right on the warehouse floor.

#### B. Driver Detention Penalties and DOT Hours-of-Service (HOS) Mandates
* **The Reality:** Arriving long-haul refrigerated truckers operate under strict federal Department of Transportation (DOT) Electronic Logging Device (ELD) regulations. Drivers are legally capped at 11 hours of drive time.
* **The Cost of Cloud Lag:** If a driver is delayed past 2 hours waiting at a gate or receiving bay, **detention penalties of $100 to $150 per hour** kick in against the shipper or terminal. Worse, if a driver runs out of HOS legal hours while idling in a line on the street, the truck must shut down on the shoulder, missing the morning supermarket delivery window.
* **Why Local Matters:** The driver pulls up to the weigh-station kiosk, scans their physical Bill of Lading, validates reefer temperatures, receives their bay assignment, and gets their signed digital gate pass in **under 2 seconds**. There are zero loading spinners, no mobile carrier timeouts, and no cloud outages.

#### C. Absolute Secrecy of Real-Time Spot Margins
* **The Reality:** Terminal wholesale pricing is a dynamic spot market that changes minute-by-minute based on overnight harvest volume from Salinas, Central Valley, or cross-border refrigerated rail traffic.
* **Why Customers Demand Zero Egress:** Shippers, carriers, and buyers consider their negotiated discount tiers, spot fuel surcharges, and volume margins fiercely confidential trade secrets. They strictly refuse to route live bids or contract settlements through public multi-tenant cloud AI APIs (OpenAI, AWS, Anthropic), where prompts could be logged, analyzed, or leveraged to train competitor pricing algorithms. An air-gapped on-premise Dell workstation guarantees that negotiation data never leaves the facility's physical perimeter.

---

### 3. The Control Center's Perspective: Why the Terminal Cannot Run in the Cloud

#### A. Cold Storage Warehouses are Physical Faraday Cages
* Modern cold-storage cross-docks are engineered with **12-inch insulated polyurethane panels, corrugated steel cladding, and deep reinforced concrete floors** to maintain temperatures from -20°F (deep freeze) to 34°F (chill).
* These physical construction materials virtually obliterate external cellular (5G/LTE) signals and create heavy RF attenuation for Wi-Fi. Relying on an uplink to external cloud data centers inside an industrial freezer facility creates constant packet drops and unresponsive interfaces. High-speed, local Cat6e/fiber Ethernet connected directly to an on-premise Dell GB10 controller is the only architecture that delivers 100.000% uptime.

#### B. FDA Food Safety Modernization Act (FSMA Rule 204) Compliance & Criminal Liability
* Under federal FSMA Section 204, receiving and cross-docking facilities must record immutable, timestamped **Key Data Elements (KDEs)** and **Critical Tracking Events (CTEs)** the exact moment perishable food transfers custody.
* If a cloud outage occurs while 40 trucks are unloading, the terminal operator faces an impossible choice: halt operations and let $15M of produce rot at the gate, or release trucks without federally mandated custody records. If an *E. coli* or *Listeria* recall occurs weeks later, the facility is held legally and criminally liable without an audit trail. An on-premise AI factory continues recording cryptographic, hash-chained custody logs without a single millisecond of interruption.

#### C. Sub-Second Physical Facility Automation and Worker Safety
* The Terminal Control Center is not an abstract reporting tool; it actively commands physical machinery:
  - Rapid-roll insulated bay doors opening and closing to prevent temperature loss.
  - Hydraulic dock levelers matching trailer floor heights.
  - Automated guided forklifts and pallet jacks moving 2,000-lb loads at 12 mph across cross-dock corridors.
* Industrial automation cannot tolerate the 150ms–2500ms latency jitter of cloud API roundtrips. A local multi-agent swarm running on NVIDIA GB10 unifies sensor inputs, detects safety violations, assigns dock bays, and updates inventory in deterministic **sub-50ms cycles**.

---

### 4. Walk-In Customer Workflows & Use Cases

#### Use Case 1: Pre-Dawn Inspected Lot Lock & Cross-Dock Requisition (Order Placement)
1. **Physical Inspection (03:15 AM):** Commercial buyer for a 40-location grocery cooperative walks into Cold Vault 2, inspects Pallet Lot `LOT-8821` (organic Watsonville strawberries), probes core temp (34.2°F), and inspects berry firmess.
2. **Kiosk Input (03:18 AM):** Buyer walks 20 paces to Dockmaster Counter Terminal #2 and selects:
   * *"Release LOT-8821 (10 pallets), add LOT-4412 (4 pallets Hass avocados), route to Bay 6 for cross-dock loading onto Trailer TR-902, dispatch to Reno Hub by 07:30 AM."*
3. **Local Swarm Processing (<200ms):**
   * `triage` tags the ticket as perishable express cross-dock.
   * `warehouse` locks `LOT-8821` in local memory to prevent duplicate sales, and commands Bay 6 dock leveler.
   * `dispatch` generates the electronic Bill of Lading (BOL) and assigns a dual-temp reefer carrier.
4. **Physical Output:** The counter printer immediately prints the thermal gate pass and barcoded pallet release tags.

#### Use Case 2: Dockside Temperature Excursion Dispute (Support Ticket)
1. **Receiving Dispute (04:10 AM):** Driver at Inbound Bay 3 scans their inbound manifest. The receiving inspector flags that Pallet #2 registered 44°F (exceeding the strict 38°F maximum).
2. **Kiosk Ticket Entry (04:12 AM):** The driver taps **"Report Inspection Hold"** on the Bay 3 tablet.
3. **Local Autonomous Resolution:**
   * `telematics` interrogates the trailer’s local data logger via the dock's wireless link to check the 6-hour transit graph. It discovers the reefer compressor ran a 25-minute defrost cycle 30 miles out.
   * `support` cross-references the shipper SLA, calculates a 15% quality allowance discount, or immediately commands `warehouse` to reserve a pristine replacement lot from Cold Vault B.
   * `finance` issues a digital credit memo on the spot. Total elapsed resolution time: **under 30 seconds**, preventing the delivery driver from missing their morning departure window.


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

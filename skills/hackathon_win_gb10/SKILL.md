---
name: "dell-nvidia-hackathon-winning-playbook"
description: >
  Operational protocol to win the Dell Technologies × NVIDIA AI Factory Hackathon (SF, Oct 25, 2026).
  Hardware: Dell Pro Max with GB10 (Grace Blackwell, 128GB unified memory, 20-core Arm, 1 petaFLOP FP4).
  Target: Always-on enterprise logistics agent swarm running 100% locally with zero cloud calls.
  Enforces single definitive path decision making, high-contrast demo-ready visuals, and strict rule compliance.
---

# Dell Technologies × NVIDIA Hackathon Strategy & Execution Skill

## 1. Golden Rules of Engagement
- **No Competing Routes**: Never present multiple options or ask the user to pick between branches. Provide the single best, authoritative, winning path immediately.
- **Judge Criteria Alignment**:
  1. **Technical Execution**: Seamless multi-agent collaboration (Support, Procurement, Dispatch), sandbox policy egress quarantining, real-time SSE streaming.
  2. **Business Value**: Mission-critical logistics enterprise workflow (temperature alerts, reefer fleet reroutes, spot fuel bidding, fraud/exfiltration protection).
  3. **Local-First Design**: Zero cloud calls, 100% on-device inference on NVIDIA GB10 (128GB unified memory), offline-capable with WiFi off.
  4. **Demo Quality**: Cinematic 60fps high-contrast dark UI optimized for projector presentation at Frontier Tower, instant chaos test buttons for dramatic live demo moments (especially the red "BLOCKED" egress sandbox banner).

## 2. Technical Hardware & Stack Baseline
- **Box**: Dell Pro Max with NVIDIA GB10 Grace Blackwell Superchip (128GB LPDDR5X, 200B parameter model support).
- **Stack**: NemoClaw, OpenClaw, OpenShell.
- **Protocol**: EventSource (`/events`), strictly local same-origin endpoints (`/chaos/supplier`, `/chaos/surge`, `/chaos/inject`, `/chaos/pause`).
- **Telemetry**: Report local model latency (<200ms), tokens/sec (>80 tps), and memory footprint (~18-24GB / 128GB).

## 3. GitHub & Deployment Discipline
- Commit and push clean, verifiable units directly to `main` at `https://github.com/yfandev/mission-control`.
- Single-command token authentication with zero manual guesswork for the user.

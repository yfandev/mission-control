# OpenClaw ops assistant (NemoClaw + OpenShell) on the GB10

> Written from NVIDIA's NemoClaw docs (latest, checked Oct 25, 2026) and the DGX Spark
> playbook. **Not yet run end-to-end on our GB10**: expect to adjust small details
> (notably the binary path in the policy file, see Troubleshooting).

## Do we need OpenClaw?

Mission Control runs without it: the swarm (`server/`) is plain Node calling Ollama.
But NemoClaw / OpenClaw / OpenShell is the hackathon's stack, so we add it where it
strengthens the story:

- **OpenClaw** = an always-on **ops assistant** the operations manager chats with on Telegram:
  "How is the swarm doing?", "What got blocked today?", "Place this order", "Run a supplier drill".
- **OpenShell** = the sandbox it lives in. Its network policy lets it reach **only** Mission
  Control's API. Anything else (a random website, an attacker's server) is blocked and shown
  in `openshell term` for a human to approve or deny.
- **NemoClaw** = the installer and CLI that wires OpenClaw + OpenShell + local Ollama together.
- Same **local Nemotron** model for everything. Nothing leaves the box.

```
Ops manager (Telegram: ops bot)
        │
        ▼
┌───────────────── OpenShell sandbox ─────────────────┐
│ OpenClaw agent ── skill: mission-control (curl) ────┼──► only http://<GB10-IP>:8080
│        │ inference.local                            │      GET  /api/state
└────────┼────────────────────────────────────────────┘      POST /api/inbound, /chaos/*
         ▼                                                    │
   Ollama on the GB10 (nemotron-3.5-super:120b) ◄──────── Mission Control swarm (server/)
                                                              │
                              Customers (Telegram: @Local_LLM_Hack_bot) ┘
```

## Before you start

- [ ] Mission Control is running on the GB10 (`MODEL=nemotron-3.5-super:120b node server/server.js`,
      see `docs/model-runtime.md`) and `curl http://localhost:8080/api/state` answers.
- [ ] Ollama is **v0.32.9 or newer** (NemoClaw's minimum; we run v0.40.11) and the model is loaded.
- [ ] A **second Telegram bot** for the ops assistant (step 1). Only one program can use a bot
      token at a time, and Mission Control already uses `@Local_LLM_Hack_bot`.
- [ ] Internet for the install itself (NemoClaw installer, Node packages). Not needed afterwards.

## 1. Create the ops bot

In Telegram, open **@BotFather** (blue checkmark) → `/newbot` → name it e.g. `Northwind Ops` →
username e.g. `NorthwindOps_bot`. Keep the token in a password manager. Never commit it.

## 2. Install NemoClaw with local Ollama + Telegram

On the GB10, in a terminal:

```bash
read -rsp "Ops bot token: " TELEGRAM_BOT_TOKEN && echo && export TELEGRAM_BOT_TOKEN
```

```bash
export NEMOCLAW_PROVIDER=ollama NEMOCLAW_MODEL=nemotron-3.5-super:120b
```

```bash
curl -fsSL https://www.nvidia.com/nemoclaw.sh | bash
```

- Use `export` (not `VAR=... curl ... | bash`), otherwise the installer never sees the variables.
- Setting `NEMOCLAW_PROVIDER` skips "Express" mode, which would otherwise download a different
  model (Qwen3.6-35B) for vLLM over the shared wifi.
- **Use the same model as the swarm.** If OpenClaw picks a different model, Ollama loads a second
  80+ GB model and the GB10 runs out of memory.

In the wizard: agent **OpenClaw**, sandbox name **`my-assistant`**, skip Brave web search,
messaging **Telegram** (uses the token above; restrict it to your own Telegram user ID when
offered), policy **Balanced**.

## 3. Check it works

```bash
nemoclaw my-assistant status
```

It should show provider **ollama** and model **nemotron-3.5-super:120b**. Then message the ops bot
"hello" on Telegram; it should answer.

## 4. Connect it to Mission Control

From the repo root on the GB10:

```bash
bash openclaw/install.sh my-assistant
```

This (a) uploads `openclaw/skills/mission-control/` into the sandbox at
`/sandbox/.openclaw/workspace/skills/`, filled in with the GB10's IP, and (b) adds the OpenShell
preset `openclaw/policy/mission-control.yaml.template`, which allows only `GET /api/state`,
`POST /api/inbound` and `POST /chaos/*` on `<GB10-IP>:8080`. It shows a dry run before applying.
Override the address with `MC_HOST=… MC_PORT=…` if needed.

Then in the ops bot chat send `/new` (starts a session that sees the new skill).

## 5. Try it

- "How is Mission Control doing?"
- "What got blocked today?"
- "Ship 6 pallets of strawberries from Watsonville to Portland by Thursday for Fresh Farms."
- "Run a supplier failure drill."

## 6. Demo moment: OpenShell blocks the assistant too

In a terminal on the projector:

```bash
openshell term
```

Select the sandbox (`j`/`k`, `Enter`), press `r` for **Network Rules**. Ask the ops assistant
something that needs a host outside its policy, e.g. "Fetch https://example.com and summarize it".
OpenShell blocks the request and shows it as pending (host, port, binary). Press **`x`** to deny.

That is the two-layer story: Mission Control's egress policy stops the swarm from leaking
data, and OpenShell stops the assistant at the network level, with a human approving any new
destination.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Telegram `409 Conflict` | Two programs use the same bot token. The ops assistant needs its **own** bot (step 1). |
| Wizard can't use Ollama / "upgrade Ollama" | Needs v0.32.9+ on both the CLI and the running daemon (`ollama --version`). If the sandbox can't reach a loopback-only Ollama, see NVIDIA's "Verify the Sandbox Inference Route" page. |
| Assistant says it can't reach Mission Control | Open `openshell term`, find the blocked request, and copy the exact **binary** path into `openclaw/policy/mission-control.yaml.template` (default `/usr/bin/curl`), then rerun `install.sh`. Or approve it once in the TUI with `a`. |
| Mission Control unreachable at `<GB10-IP>:8080` | The server must listen on the LAN address (Node's default does). Note: anyone on the same wifi can then reach port 8080. For the demo, prefer a wired/isolated network or a firewall rule. |
| The skill doesn't show up | Send `/new` in the chat, or restart the sandbox: `nemoclaw my-assistant stop`, then `nemoclaw my-assistant recover`. |
| GB10 runs out of memory | OpenClaw and the swarm must use the **same** model tag. Keep `OLLAMA_NUM_PARALLEL=4`. |

Useful: `nemoclaw my-assistant dashboard-url --quiet` (web UI; treat the URL as a password),
`nemoclaw onboard` (rerun the wizard), `nemoclaw uninstall --yes` (remove; keeps Ollama models).

## Sources

- NemoClaw on DGX Spark playbook: https://build.nvidia.com/spark/nemoclaw/instructions
- Set Up Ollama: https://docs.nvidia.com/nemoclaw/latest/user-guide/openclaw/inference/local-inference/set-up-ollama.md
- Set Up Telegram: https://docs.nvidia.com/nemoclaw/latest/user-guide/openclaw/manage-sandboxes/messaging-channels/set-up-telegram.md
- Create Custom Policy Presets: https://docs.nvidia.com/nemoclaw/latest/user-guide/openclaw/network-policy/configure-policies/create-custom-policy-presets.md
- Approve or Deny Network Requests: https://docs.nvidia.com/nemoclaw/latest/user-guide/openclaw/network-policy/approve-network-requests.md
- Transfer State Manually (upload): https://docs.nvidia.com/nemoclaw/latest/user-guide/openclaw/manage-sandboxes/state-and-backups/transfer-state-manually.md
- OpenClaw skills: https://docs.openclaw.ai/tools/creating-skills

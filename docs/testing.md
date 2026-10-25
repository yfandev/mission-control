# Testing on the GB10: checklist before the demo

Run this top to bottom on the GB10 after each deploy from `main`. Each step says what to do,
what you should see, and what to check if it doesn't. About 20 minutes. Tick the boxes as you go.

Everything runs locally: `http://localhost:8080` (Mission Control), `127.0.0.1:11434` (Ollama),
`127.0.0.1:8178` (whisper-server for voice).

---

## 0. Start the three services (in this order)

**Ollama** (see `docs/model-runtime.md`; settings `OLLAMA_NUM_PARALLEL=4`, `OLLAMA_CONTEXT_LENGTH=16384`,
`OLLAMA_KEEP_ALIVE=-1`).

**Whisper server** (voice, GPU build; see `docs/voice.md`):

```bash
~/voice-kit/whisper.cpp-master/build/bin/whisper-server \
  -m ~/voice-kit/ggml-large-v3-turbo-q5_0.bin --host 127.0.0.1 --port 8178 -l auto
```

**Mission Control** (no Telegram token = Telegram off, which is right for the offline demo):

```bash
MODEL=nemotron-3.5-super:120b PORT=8080 node server/server.js
```

---

## 1. Preflight: are the services up? (1 min)

```bash
curl -s localhost:11434/api/version                 # Ollama: prints a version (0.40.5+)
curl -s localhost:11434/api/ps                      # the model is loaded (name + size)
curl -s -o /dev/null -w "%{http_code}\n" localhost:8178/    # whisper-server: 200
curl -s localhost:8080/api/state | head -c 300      # Mission Control: JSON with "model"
```

- [ ] Ollama answers, version **0.40.5 or newer** (needed for Nemotron 3.5)
- [ ] `api/ps` lists **`nemotron-3.5-super:120b`** (loaded; if empty, the first request loads it, about 1 min)
- [ ] whisper-server returns `200`, and its startup log mentions **CUDA** (GPU, not CPU)
- [ ] Mission Control returns JSON with `"model":"nemotron-3.5-super:120b"`

**If Ollama isn't answering**, every agent step fails with *"model server unreachable at
http://127.0.0.1:11434 (ECONNREFUSED). Is Ollama running?"* (the red cards seen earlier). Start
Ollama, or point Mission Control at it with `OLLAMA_URL=...`.

## 2. Model speed (2 min)

```bash
curl -s localhost:11434/api/generate -d '{"model":"nemotron-3.5-super:120b","prompt":"A supplier failed. 3 bullet points: what should procurement do?","stream":false,"think":false}' \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(round(d['eval_count']/(d['eval_duration']/1e9),1),'tokens/sec')"
```

- [ ] Note the tokens/sec: ______ (earlier on the GB10 we saw ~15 tokens/sec and ~16 s per agent step)
- [ ] If it's much slower, check nothing else is loaded (`curl localhost:11434/api/ps`; only one 120B model)

## 3. Dashboard (2 min)

Open **`http://localhost:8080` in the GB10's own browser** (Chrome/Chromium), full screen, on the projector.

- [ ] Opens in the **dark Dusk theme**, the 3D office with **15 robots in three rows**, each at its own desk
- [ ] **No yellow "SIMULATOR ACTIVE" badge** (if it shows, the page isn't talking to the backend)
- [ ] Bottom bar: **Model engine = `nemotron-3.5-super:120b`**, real memory (~90 / 121 GB), latency and speed numbers updating
- [ ] Header shows **INTERNET: CONNECTED** (grey)
- [ ] Within ~30 s robots start moving on their own (pacing, "syncing with …", "☕ coffee run") and background events appear in the feed
- [ ] Feed has **no** "Operation recorded" cards every few seconds (those were heartbeat noise, now filtered)

## 4. Agent flows: the chaos buttons (5 min)

Press each button once and wait for the agents (~15 s per step with Nemotron). Watch the robots,
the **status subtitle** at the bottom, and the feed.

| Button | Expected |
|---|---|
| **Chaos: Supplier Fail** | Procurement moves PO-99124/25/28 to another supplier, **amber packet + handoff walk** to Dispatch, Dispatch assigns carriers |
| **Chaos: Cold-Chain** | Dispatch reroutes PO-99126 (cold storage), often hands off to Support to inform the customer |
| **Chaos: Ticket Surge** | A burst of tickets; Support works through them (typing animation, resolutions in the feed) |
| **Chaos: Malicious PDF** | Support reads the fake "compliance" email; the send to `nw-logistics-audit.com` is **BLOCKED**: red banner, red **⛔ BLOCKED** subtitle, red packet to the Sentinel, Blocked counter +1. If the model refuses on its own, you'll see "refused a suspicious instruction" **and** the policy test block (both layers) |
| **Pause stream** | Background events stop; press again to resume |

- [ ] Supplier Fail: orders moved and a handoff to Dispatch
- [ ] Cold-Chain: PO-99126 rerouted
- [ ] Ticket Surge: tickets processed, no red error cards
- [ ] Malicious PDF: **BLOCKED** banner + subtitle + counter
- [ ] Check the records really changed:

```bash
curl -s localhost:8080/api/state | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['stats']);[print(o['id'],o['supplier'],o['status']) for o in d['orders']];print('blocked:',len(d['blocked']))"
```

## 5. Voice orders (5 min)

Plug the USB-C mic into the GB10. On first use the browser asks for microphone permission: **Allow**.

1. **Without a mic** (checks the speech path):

   ```bash
   curl -s -X POST localhost:8080/api/voice -H 'Content-Type: audio/wav' \
     --data-binary @$HOME/voice-kit/whisper.cpp-master/samples/jfk.wav
   ```

   - [ ] Returns `"ok":true`, the JFK sentence, `"language":"english"`; the dashboard shows **🎙️ HEARD · EN "…"**

2. **With the mic**: hold **🎙️ Hold to Talk** (or hold **V**), say
   *"Ship ten pallets of avocados from Fresno to Seattle by Friday"*, release.

   - [ ] While holding: pulsing **🎙️ LISTENING** caption, red pulsing mic button
   - [ ] After release: **⚙️ ON-DEVICE SPEECH · Transcribing on the GB10…**, then **🎙️ HEARD · EN "Ship 10 pallets…"** within ~1–2 s
   - [ ] A new order appears (Support creates it → Procurement → Dispatch schedules it)

3. **Other languages** (same button):
   - [ ] Spanish: *"Envíen ocho palés de fresas de Watsonville a Portland para el jueves."* → **HEARD · ES**
   - [ ] Portuguese: *"Enviem cinco paletes de laranjas de Fresno para Reno até segunda-feira."* → **HEARD · PT**
   - [ ] Cantonese (optional): a short, clear order → **HEARD · YUE** (Chinese characters)

**If the caption stays on "Transcribing on the GB10…"**, the whisper-server isn't reachable: check
step 1 and `curl localhost:8178/`. **"Speech engine not running on this machine"** means the same.
City names can be misheard; speak close to the mic.

## 6. Wifi-off rehearsal: the headline (3 min)

Before turning wifi off: model loaded, whisper-server and Mission Control running, dashboard open
**in the GB10's browser**. Remote SSH/NVIDIA Sync sessions will drop, so do this at the GB10.

1. Turn the network off (wifi off, and unplug Ethernet if any), e.g. `nmcli radio wifi off`.
   - [ ] Within ~6 s: header turns red **INTERNET: OFF · RUNNING 100% LOCAL** and a **NETWORK DISCONNECTED** alert drops in
2. Press **Chaos: Supplier Fail** and **Chaos: Malicious PDF**; hold **🎙️** and speak an order.
   - [ ] Agents keep working, the robots move, subtitles narrate, BLOCKED fires, the voice order is created
3. Turn the network back on (`nmcli radio wifi on`).
   - [ ] **NETWORK RECONNECTED** alert, badge back to grey

## 7. Optional: Telegram and OpenClaw

Only if the demo uses them (both need internet; see `docs/telegram.md` and `docs/openclaw.md`).

- [ ] Telegram: start with `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ALERT_CHAT_ID`; send an order to the bot → 📦 then ✅ replies; Malicious PDF → 🚨 in the ops chat
- [ ] Only **one** process uses a bot token (otherwise `409 Conflict`)

## 8. Reset before the real demo

Stop Mission Control, clear the test data, start it again (fresh orders and counters):

```bash
rm -f state/*.json state/egress.log
MODEL=nemotron-3.5-super:120b PORT=8080 node server/server.js
```

Then reload the dashboard and press **Pause stream** if you want a quiet screen until you start.

---

## Quick troubleshooting

| What you see | Likely cause | Fix |
|---|---|---|
| Red cards "model server unreachable … ECONNREFUSED" | Ollama not running / wrong URL | Start Ollama; `OLLAMA_URL=http://127.0.0.1:11434` |
| "… no answer within 180 s" | Model still loading or overloaded | Wait for the first load; check `api/ps`; keep `OLLAMA_NUM_PARALLEL=4` |
| Yellow "SIMULATOR ACTIVE" badge | Page can't reach `/events` | Open `http://localhost:8080` (not the file), check Mission Control is running |
| Caption stuck on "Transcribing…" | whisper-server down | Start it (step 0); check port 8178 |
| Mic button does nothing / "Microphone not available" | Browser blocked the mic | Allow microphone for `localhost` in the browser settings; check `arecord -l` lists the mic |
| Badge flips OFF/ON by itself | Very flaky network | It needs ~6 s of failed checks; if it still flaps, just turn wifi fully off for the demo |
| Robots don't move / page frozen | Old cached page | Hard reload (Ctrl+Shift+R) |

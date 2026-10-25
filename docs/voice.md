# Voice orders, fully offline (whisper.cpp on the GB10)

**Goal:** with **all networking off** (no internet, no wifi, no Telegram), someone speaks into a USB-C
microphone on the GB10: *"Ship 10 pallets of avocados from Fresno to Seattle by Friday"*, and the
order flows Support → Procurement → Dispatch live on the dashboard. Speech-to-text runs on the GB10.

> Status (Oct 25, 13:05): **working end-to-end on Vincent's Mac.** Spoken orders in English, Spanish
> and Portuguese were transcribed on-device, detected the language, and became real orders
> (Support → Procurement → Dispatch). The kit is on **LLMDRIVE/voice-kit/** (checksums verified).
> Remaining: build whisper.cpp on the GB10 and run the same test there.

## What we use

| Piece | Choice | Size |
|---|---|---|
| Engine | [whisper.cpp](https://github.com/ggml-org/whisper.cpp) (C++, no Python, builds on ARM + CUDA) | ~10 MB source |
| Model (main) | `ggml-large-v3-turbo-q5_0.bin`: best accuracy for its speed, handles accents/noise, **multilingual**, auto-detects the language. Size 574,041,195 bytes, SHA1 `e050f7970618a659205450ad97eb95a18d69c9ee` | ~575 MB |
| Model (fallback) | `ggml-base.en.bin`: small and fast, English only. Size 147,964,211 bytes, SHA1 `137c40403d78fd54d454da0f9bd998f78703390c` | 148 MB |
| Mic | Vincent's USB-C microphone, plugged into the GB10 | — |

The venue wifi is ~0.1 MB/s, so **nothing is downloaded on the GB10**. Vincent has everything in
`~/Downloads/voice-kit/` (downloaded over a phone hotspot) and brings it on a USB drive / LLMDRIVE.

## Languages

`large-v3-turbo` auto-detects the language: **English, Spanish and Portuguese** are very accurate;
**Cantonese** works (Whisper v3 added it as its own language) but is less accurate and comes out as
Chinese characters, so keep Cantonese commands short and clear. The transcript is passed to the
agents in the language spoken (Nemotron reads all four); we don't use Whisper's "translate to
English" mode, which is weak in the turbo model.

## GB10 setup (Claudio)

1. **Copy the kit** from the USB drive to the GB10, e.g. `~/voice-kit/`:
   `whisper.cpp-master/`, `ggml-large-v3-turbo-q5_0.bin`, `ggml-base.en.bin`.

2. **Build tools present?**

   ```bash
   cmake --version && g++ --version && nvcc --version
   ```

   If `cmake` is missing: `sudo apt-get install -y cmake` (needs internet for a few MB), or build
   CPU-only on another ARM box. `nvcc` is optional (GPU build); the CPU build is fast enough for
   `base.en` and acceptable for `large-v3-turbo`.

3. **Build** (GPU if CUDA is there):

   ```bash
   cd ~/voice-kit/whisper.cpp-master
   cmake -B build -DCMAKE_BUILD_TYPE=Release -DGGML_CUDA=1     # drop -DGGML_CUDA=1 for CPU-only
   cmake --build build --config Release -j 20 --target whisper-cli
   ```

   Mac-only note: Apple clang may fail with `unknown target CPU 'apple-m3'`; add `-DGGML_NATIVE=OFF`.
   Not needed on the GB10 (gcc on Linux).

4. **Smoke test** with the bundled sample (no mic, no network):

   ```bash
   ./build/bin/whisper-cli -m ~/voice-kit/ggml-large-v3-turbo-q5_0.bin -f samples/jfk.wav -nt
   ```

   Verify the model first if it came off a USB drive: `sha1sum ~/voice-kit/ggml-large-v3-turbo-q5_0.bin`
   must print `e050f7970618a659205450ad97eb95a18d69c9ee`.

   Expected: *"And so my fellow Americans, ask not what your country can do for you…"*

5. **Mic test**: plug in the USB-C mic, then:

   ```bash
   arecord -l                                              # the mic should be listed
   arecord -f S16_LE -r 16000 -c 1 -d 5 /tmp/order.wav     # speak an order for 5 s
   ./build/bin/whisper-cli -m ~/voice-kit/ggml-large-v3-turbo-q5_0.bin -f /tmp/order.wav -nt
   ```

   whisper.cpp wants **16 kHz mono 16-bit WAV**, which is exactly what that `arecord` line records.

## Run it on the GB10

After building (steps above), start the speech server **once**; it keeps the model in memory so each
command takes about a second instead of reloading 575 MB:

```bash
~/voice-kit/whisper.cpp-master/build/bin/whisper-server \
  -m ~/voice-kit/ggml-large-v3-turbo-q5_0.bin --host 127.0.0.1 --port 8178 -l auto
```

For that, build the server target too: `cmake --build build --config Release -j 20 --target whisper-server`.

Then start Mission Control as usual (it finds the speech server at `http://127.0.0.1:8178`):

```bash
MODEL=nemotron-3.5-super:120b node server/server.js
```

Open `http://localhost:8080` **in the GB10's own browser**, allow the microphone, then **hold
🎙️ Hold to Talk** (or hold the **V** key), speak, and release.

Quick test without a mic: `curl -X POST localhost:8080/api/voice -H 'Content-Type: audio/wav' --data-binary @~/voice-kit/whisper.cpp-master/samples/jfk.wav`

## How it works

```
Dashboard (GB10 browser)  🎙️ hold to talk
   │  records the mic, converts to 16 kHz mono WAV in the page (no ffmpeg needed)
   ▼
POST /api/voice  (audio/wav, max 10 MB)
   │  server/voice.js → whisper-server (model in memory) → text + detected language
   │  (fallback: spawns whisper-cli if WHISPER_BIN + WHISPER_MODEL are set)
   ▼
same path as Telegram / POST /api/inbound → Support → Procurement → Dispatch
```

Backend settings (environment variables, all optional):

| Variable | Default | Purpose |
|---|---|---|
| `WHISPER_URL` | `http://127.0.0.1:8178` | Running whisper-server |
| `WHISPER_BIN` | — | Fallback: path to `whisper-cli` |
| `WHISPER_MODEL` | — | Fallback: path to the model |

## Live subtitles (dashboard)

- **Voice caption** (big, typewriter effect): `🎙️ LISTENING…` while the button is held, then
  `⚙️ ON-DEVICE SPEECH · Transcribing on the GB10…`, then `🎙️ HEARD · ES "Envíen ocho palés…"`
  with the detected language (EN / ES / PT / YUE).
- **Status caption** underneath: a plain-English line for every agent step, e.g.
  "Support Agent 📦 created PO-99133…", "Procurement → Dispatch handoff…", and a red
  **⛔ BLOCKED** line when the egress policy stops an exfiltration attempt.
- The dashboard now opens in the **dark Dusk theme** (add `?theme=day` for daylight).

## Tested (Mac, Oct 25)

| Spoken (Mac text-to-speech voice) | Heard | Result |
|---|---|---|
| EN "Ship ten pallets of avocados from Fresno to Seattle by Friday." | exact | PO-99133 scheduled |
| ES "Envíen ocho palés de fresas de Watsonville a Portland para el jueves." | "…de Batzonville a Portland…" (language: spanish) | PO-99134 created |
| PT "Enviem cinco paletes de laranjas de Fresno para Reno até segunda-feira." | "…para reino…" (language: portuguese) | PO-99135 scheduled |

City names are the weak spot (with a synthetic voice); a real person close to the mic does better.

## No-internet demo: Telegram is optional

Telegram needs internet, so for the fully offline demo just **don't set `TELEGRAM_BOT_TOKEN`**; the
bridge stays off (`[telegram] disabled`) and nothing else changes. Voice is the ordering channel.
The Telegram code stays in place for when we want it.

## Demo line

*"Wifi off. Cable out. No Telegram. Just talk to it."* Speak the order; the transcript appears, the
agents take it, and the confirmation lands on the dashboard. Everything runs on the GB10.

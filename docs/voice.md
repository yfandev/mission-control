# Voice orders, fully offline (whisper.cpp on the GB10)

**Goal:** with **all networking off** (no internet, no wifi, no Telegram), someone speaks into a USB-C
microphone on the GB10: *"Ship 10 pallets of avocados from Fresno to Seattle by Friday"*, and the
order flows Support → Procurement → Dispatch live on the dashboard. Speech-to-text runs on the GB10.

> Status (Oct 25, 12:30): models and engine source downloaded on Vincent's Mac; integration
> (backend endpoint + dashboard button) in progress. This page is the GB10 setup plan.

## What we use

| Piece | Choice | Size |
|---|---|---|
| Engine | [whisper.cpp](https://github.com/ggml-org/whisper.cpp) (C++, no Python, builds on ARM + CUDA) | ~10 MB source |
| Model (main) | `ggml-large-v3-turbo-q5_0.bin`: best accuracy for its speed, handles accents/noise, **multilingual** (Spanish/Portuguese orders work too) | ~575 MB |
| Model (fallback) | `ggml-base.en.bin`: small and fast, English only. SHA1 `137c40403d78fd54d454da0f9bd998f78703390c` | 148 MB |
| Mic | Vincent's USB-C microphone, plugged into the GB10 | — |

The venue wifi is ~0.1 MB/s, so **nothing is downloaded on the GB10**. Vincent has everything in
`~/Downloads/voice-kit/` (downloaded over a phone hotspot) and brings it on a USB drive / LLMDRIVE.

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

4. **Smoke test** with the bundled sample (no mic, no network):

   ```bash
   ./build/bin/whisper-cli -m ~/voice-kit/ggml-large-v3-turbo-q5_0.bin -f samples/jfk.wav -nt
   ```

   Expected: *"And so my fellow Americans, ask not what your country can do for you…"*

5. **Mic test**: plug in the USB-C mic, then:

   ```bash
   arecord -l                                              # the mic should be listed
   arecord -f S16_LE -r 16000 -c 1 -d 5 /tmp/order.wav     # speak an order for 5 s
   ./build/bin/whisper-cli -m ~/voice-kit/ggml-large-v3-turbo-q5_0.bin -f /tmp/order.wav -nt
   ```

   whisper.cpp wants **16 kHz mono 16-bit WAV**, which is exactly what that `arecord` line records.

## How it plugs into Mission Control (being built)

```
Dashboard (GB10 browser)  🎙️ hold to talk
   │  records mic, converts to 16 kHz mono WAV in the page (no ffmpeg needed)
   ▼
POST /api/voice  (audio/wav)
   │  server runs whisper-cli locally → text
   ▼
same path as Telegram/POST /api/inbound → Support → Procurement → Dispatch
   │
   ▼
dashboard shows the transcript + the order moving through the agents
```

Backend settings (environment variables):

| Variable | Example |
|---|---|
| `WHISPER_BIN` | `~/voice-kit/whisper.cpp-master/build/bin/whisper-cli` |
| `WHISPER_MODEL` | `~/voice-kit/ggml-large-v3-turbo-q5_0.bin` |

The browser allows the microphone on `http://localhost`, so open the dashboard **on the GB10 itself**
(it's also the only option with networking off).

## Demo line

*"Wifi off. Cable out. No Telegram. Just talk to it."* Speak the order; the transcript appears, the
agents take it, and the confirmation lands on the dashboard. Everything runs on the GB10.

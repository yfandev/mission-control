# GB10 — Current Status (verified live, Oct 25, 2026)

Single source of truth for how Mission Control actually runs on the Dell
Pro Max GB10 at Frontier Tower today. Everything below was verified on
the machine itself. Where older docs disagree, this file wins.

## Model

- **Running: `nemotron-3-super:120b` (GGUF, 86.8 GB)** — 100% on GPU:
  `/api/ps` reports `size_vram` equal to the full model size (zero CPU
  offload), pinned with `OLLAMA_KEEP_ALIVE=-1`, so it never unloads and
  there are no cold starts.
- Generation ≈ 14–15.5 tok/s.
- **`nemotron-3.5-super:120b` does NOT run on this machine.** It is
  MLX-format, and Ollama 0.40.11 for arm64 (tarball and official Docker
  image) ships no MLX runtime — every load attempt fails with
  "MLX runtime is not available" (the MLX build exists only for amd64).
  Do not set `MODEL` to the 3.5.
- Under full swarm load a fresh request's first token can wait
  ~10–14 s. That is Ollama slot queueing behind the swarm's own agent
  turns — not CPU offload, not a cold load.

## Engine

- Ollama **0.40.11**, official **Docker** container, API on
  `127.0.0.1:11434`.
- `OLLAMA_MODELS=/models-final` — repaired manifests plus a blob symlink
  farm (the LLMDRIVE copy of the 3.5 manifest was corrupt). The container
  must mount BOTH `/home/dell/models-final` and `/home/dell/.ollama`,
  because the blob symlinks are absolute paths.
- `OLLAMA_NUM_PARALLEL=4`, `OLLAMA_CONTEXT_LENGTH=16384`,
  `OLLAMA_LOAD_TIMEOUT=30m`.
- Models were copied locally from the team LLMDRIVE — never downloaded.
  The only network fetch was the Ollama engine itself.

## Swarm — all three versions live (v1 ⊂ v2 ⊂ v3)

- **v3 — port 8080** (the big screen): the modular `server/` backend,
  `MODEL=nemotron-3-super:120b`.
- **v2 — port 8082**: same backend, earlier scope (no voice), separate
  `STATE_DIR`.
- **v1 — port 8090**: the zero-dependency core swarm from PR #1
  (3-agent Support → Procurement → Dispatch).
- GB10 runtime patch (local, not yet in this repo): `server/llm.js` caps
  generation with `num_predict` from env `NUM_PREDICT` (default 220) to
  bound Ollama slot occupancy under swarm load.
- After any Ollama restart, restart the swarm too, or its stats keep
  accumulating the outage as errors. Pre-demo reset per
  `docs/testing.md`: clear `state/*.json` + `state/egress.log`, restart.

## Voice

- whisper.cpp built with **CUDA** (`-DGGML_CUDA=1`); `whisper-server`
  on `127.0.0.1:8178`; the startup log shows
  `ggml_cuda_init: found 1 CUDA devices — NVIDIA GB10`.
  Measured: 12 s of audio transcribed in **0.52 s** on GPU.
- Models from the team voice kit (SHA1-verified):
  `ggml-large-v3-turbo-q5_0.bin`, fallback `ggml-base.en.bin`.
  Language is auto-detected end to end (EN/ES/PT verified) — no language
  is locked anywhere.
- Dashboard: Hold-to-Talk button, or hold **V**.
- **Hands-free:** an always-listening loop feeds the swarm only on the
  pattern **"Nemotron, … Dell"** (fuzzy wake word; "Dell" is the send
  terminator). Everything else is captioned, never acted on.
- This GB10 has **no speaker output** (the USB device is mic-only; the
  only audio sink is dummy). The model answers on screen: Operations
  Feed + subtitles.

## Dashboard (GB10 copy)

- Subtitles live in a slim bar at the top of the screen.
- Default camera is **top-down**. Note for the UI work in progress: in
  this engine a *positive* pitch places the camera **below** the floor
  plane; the top-down preview uses pitch `−0.95` for the default and
  Overview views.
- A large typed-order bar (bottom-left) posts to `/api/inbound`, and a
  **"Nemotron answered"** box shows the model's own reply for that
  ticket.
- A team UI update is in progress and will redeploy over these local
  tweaks.

## Watch-outs

- Keep the GB10's front air intake uncovered: covered, the GPU hit
  91 °C under load (82 °C uncovered).
- `docs/openclaw.md` is still not run end-to-end on our GB10.

# Model & Runtime — GB10 (updated Oct 25, 2026)

**Project model: `nemotron-3-super:120b`** — run the backend with it:

```bash
MODEL=nemotron-3-super:120b PORT=8080 node server/server.js
```

## Rules

- **`nemotron-3.5-super:120b` cannot run on the GB10.** It is
  MLX-format, and Ollama's arm64 builds (tarball and official Docker
  image, v0.40.11) ship no MLX runtime — loads fail with
  "MLX runtime is not available". The 3-super (GGUF) is the project
  model; it runs 100% on GPU. Full evidence: `docs/gb10-status.md`.
- **Models are never downloaded.** Both Nemotron 120B models (156 GB)
  are copied locally from the team's LLMDRIVE. The only network fetch
  allowed is the Ollama engine itself.
- **Engine:** Ollama v0.40.11, official Docker container, serving on
  `127.0.0.1:11434` — the backend talks to it through the native
  `/api/chat` (see `server/config.js`, `server/llm.js`). Models are
  served from `OLLAMA_MODELS=/models-final` (repaired manifests; the
  drive's 3.5 manifest was corrupt).
- **Settings for the swarm:** `OLLAMA_NUM_PARALLEL=4`,
  `OLLAMA_CONTEXT_LENGTH=16384`, `OLLAMA_KEEP_ALIVE=-1`.
- Inference is 100% on-device on the Dell Pro Max with GB10 (128 GB).
  No remote LLM calls at runtime — event rule, not a preference.

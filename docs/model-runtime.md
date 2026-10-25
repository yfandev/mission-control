# Model & Runtime — GB10 (decided Oct 25, 2026)

**Project model: `nemotron-3.5-super:120b`** — run the backend with it:

```bash
MODEL=nemotron-3.5-super:120b PORT=8080 node server/server.js
```

## Rules

- **Test order: the 3.5 goes first.** The swarm gets validated against
  `nemotron-3.5-super:120b` before anything else; `nemotron-3-super:120b`
  (the config default) is the fallback.
- **Models are never downloaded.** Both Nemotron 120B models (156 GB) are
  copied locally from the team's LLMDRIVE into `~/.ollama/models`.
  The only network fetch allowed is the Ollama engine itself.
- **Engine:** Ollama v0.40.11, user-space install at `~/ollama-bin`
  (no sudo needed), serving on `127.0.0.1:11434` — the backend talks to
  it through the native `/api/chat` (see `server/config.js`, `server/llm.js`).
- **Settings for the swarm:** `OLLAMA_NUM_PARALLEL=4`,
  `OLLAMA_CONTEXT_LENGTH=16384`, `OLLAMA_KEEP_ALIVE=-1`.
- Inference is 100% on-device on the Dell Pro Max with GB10 (128 GB).
  No remote LLM calls at runtime — event rule, not a preference.

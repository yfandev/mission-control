// Calls the local model through Ollama's native /api/chat, which (unlike the
// OpenAI-compatible endpoint) reports exact token counts and timings and lets
// us switch reasoning off per request.
import { config } from './config.js';
import { emit } from './bus.js';

export async function chat(messages, tools) {
  const started = Date.now();
  const res = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages,
      tools,
      stream: false,
      think: config.think,
      keep_alive: -1,
      options: { temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(180_000),
  }).catch((err) => {
    // Say exactly what failed (on the dashboard and in the log) instead of a bare "fetch failed".
    const why = err.name === 'TimeoutError' ? 'no answer within 180 s' : err.cause?.code || err.message;
    throw new Error(`model server unreachable at ${config.ollamaUrl} (${why}). Is Ollama running?`);
  });
  if (!res.ok) throw new Error(`model server ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();

  // Real telemetry for the dashboard: wall-clock latency and generation speed.
  const ms = Date.now() - started;
  const tps = data.eval_count && data.eval_duration ? data.eval_count / (data.eval_duration / 1e9) : 0;
  emit({ type: 'telemetry', ms, tps: Number(tps.toFixed(1)) });

  return data.message || { role: 'assistant', content: '' };
}

export async function modelLoaded() {
  try {
    const res = await fetch(`${config.ollamaUrl}/api/ps`, { signal: AbortSignal.timeout(3000) });
    const { models = [] } = await res.json();
    return models.find((m) => m.name === config.model || m.model === config.model) || null;
  } catch {
    return null;
  }
}

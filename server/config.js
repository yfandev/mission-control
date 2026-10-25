// Runtime configuration, all from environment variables so the same code runs
// on a Mac (small test model) and on the GB10 (Nemotron) without edits.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const list = (v, d) => (v || d).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

export const config = {
  root: ROOT,
  uiFile: path.join(ROOT, 'ui', 'index.html'),
  stateDir: process.env.STATE_DIR || path.join(ROOT, 'state'),
  port: Number(process.env.PORT) || 8080,

  // Local model server (Ollama native API).
  ollamaUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
  model: process.env.MODEL || 'nemotron-3-super:120b',
  think: process.env.THINK === '1', // reasoning off by default: faster agent turns
  maxToolRounds: Number(process.env.MAX_TOOL_ROUNDS) || 4,

  // Background event stream: one ordinary event every N ms (0 disables).
  streamIntervalMs: Number(process.env.STREAM_INTERVAL_MS ?? 9000),

  // Egress policy: the only hosts any agent (or the Telegram bridge) may reach.
  internalDomain: 'northwind-logistics.com',
  allowDomains: list(
    process.env.EGRESS_ALLOW,
    'northwind-logistics.com,acmecorp.com,globex.com,initech.com,hooli.com,soylent.com,' +
      'pacificfreight.com,coastline-carriers.com,summit-reefer.com,api.telegram.org',
  ),

  // Internet check for the dashboard's offline badge (TCP connect, no DNS).
  netProbes: (process.env.NET_PROBES || '1.1.1.1:443,8.8.8.8:53').split(',').map((s) => s.trim()).filter(Boolean),

  // Offline voice orders (whisper.cpp). A running whisper-server is preferred;
  // WHISPER_BIN + WHISPER_MODEL is the slower per-request fallback.
  whisperUrl: process.env.WHISPER_URL || 'http://127.0.0.1:8178',
  whisperBin: process.env.WHISPER_BIN || '',
  whisperModel: process.env.WHISPER_MODEL || '',

  // Optional Telegram bridge.
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramAlertChat: process.env.TELEGRAM_ALERT_CHAT_ID || '',
};

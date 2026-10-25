// Event bus: every message goes to all SSE clients (the UI) and to in-process
// listeners (the Telegram bridge). Message shapes follow the README's SSE spec.

export const stats = { events: 0, resolved: 0, escalated: 0, rerouted: 0, blocked: 0, errors: 0 };

const clients = new Set();
const listeners = new Set();
let seq = 0;

export function emit(msg) {
  const full = { id: `evt-${++seq}`, t: Date.now(), ...msg, stats };
  const line = `data: ${JSON.stringify(full)}\n\n`;
  for (const res of clients) res.write(line);
  for (const fn of listeners) {
    try {
      fn(full);
    } catch (err) {
      console.error('[bus] listener failed:', err.message);
    }
  }
  if (msg.type !== 'telemetry' && msg.type !== 'sys') {
    const who = msg.agent || (msg.from ? `${msg.from}->${msg.to}` : '');
    console.log(`[${msg.type}] ${who} ${msg.tool || msg.kind || msg.host || ''} ${msg.detail || ''}`.slice(0, 220));
  }
  return full;
}

export function onEmit(fn) {
  listeners.add(fn);
}

export function addClient(res) {
  clients.add(res);
  res.on('close', () => clients.delete(res));
}

export function clientCount() {
  return clients.size;
}

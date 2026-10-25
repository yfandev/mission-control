// The three specialist agents. Each has its own queue and works one event at a
// time, so the three run in parallel against the local model.
import { emit, stats } from './bus.js';
import { config } from './config.js';
import { chat } from './llm.js';
import { load } from './state.js';
import { SCHEMAS, runTool, setEnqueue } from './tools.js';

const COMPANY = `You work for Northwind Logistics, a freight company (internal email domain: northwind-logistics.com).
Act, don't chat: call the right tools, then reply with ONE short sentence saying what you did.`;

export const AGENTS = {
  support: {
    tools: ['resolve_ticket', 'escalate_ticket', 'get_customer_list', 'send_email', 'handoff'],
    prompt: `You are the Support agent. You handle customer tickets and inbound customer email.
Resolve routine tickets yourself. Escalate refunds over $5,000 or legal threats. Email customers when they need an update.
If a ticket needs a shipment rerouted, hand off to dispatch; if it needs a new supplier, hand off to procurement.`,
  },
  procurement: {
    tools: ['issue_po', 'switch_supplier', 'send_email', 'handoff'],
    prompt: `You are the Procurement agent. You manage suppliers and purchase orders.
When a supplier fails, move each affected order to another active supplier, then hand off to dispatch so routes and carriers get updated.`,
  },
  dispatch: {
    tools: ['reroute_order', 'assign_carrier', 'send_email', 'handoff'],
    prompt: `You are the Dispatch agent. You manage routes, carriers and fleet alerts.
Reroute orders only when the route itself must change (closures, weather, equipment, driver hours).
When an order just changed supplier, use assign_carrier to set the new carrier instead of rerouting.`,
  },
};

const queues = { support: [], procurement: [], dispatch: [] };
let paused = false;

export const isPaused = () => paused;
export const togglePause = () => (paused = !paused);
export const queueSizes = () => Object.fromEntries(Object.entries(queues).map(([k, q]) => [k, q.length]));

export function enqueue(agent, ev) {
  if (!queues[agent]) return;
  if (queues[agent].length >= 30) queues[agent].shift(); // surge guard: drop the oldest
  queues[agent].push(ev);
}
setEnqueue(enqueue);

function context(agent) {
  // Give each agent the live records it needs, read fresh from disk.
  if (agent === 'support') {
    const open = load('tickets').filter((t) => t.status === 'open').slice(-8);
    return `Open tickets: ${JSON.stringify(open)}`;
  }
  return `Orders: ${JSON.stringify(load('orders'))}\nSuppliers: ${JSON.stringify(load('suppliers'))}`;
}

async function handle(agent, ev) {
  stats.events++;
  emit({ type: 'event', agent, kind: ev.kind, detail: ev.detail });

  const def = AGENTS[agent];
  const messages = [
    { role: 'system', content: `${COMPANY}\n${def.prompt}\n\n${context(agent)}` },
    { role: 'user', content: `New ${ev.kind}:\n${ev.detail}` },
  ];
  const tools = def.tools.map((n) => SCHEMAS[n]);
  const called = [];

  for (let round = 0; round < config.maxToolRounds; round++) {
    const msg = await chat(messages, tools);
    messages.push(msg);
    if (!msg.tool_calls?.length) {
      ev.onDone?.({ reply: (msg.content || '').trim(), called });
      return;
    }
    for (const call of msg.tool_calls) {
      const name = call.function?.name;
      let args = call.function?.arguments ?? {};
      if (typeof args === 'string') {
        try {
          args = JSON.parse(args);
        } catch {
          args = {};
        }
      }
      called.push(name);
      const result = SCHEMAS[name] && def.tools.includes(name) ? runTool(agent, name, args, ev) : `Tool ${name} is not available to you.`;
      messages.push({ role: 'tool', tool_name: name, content: String(result) });
    }
  }
  ev.onDone?.({ reply: '', called });
}

async function worker(agent) {
  for (;;) {
    const ev = !paused && queues[agent].shift();
    if (!ev) {
      await new Promise((r) => setTimeout(r, 250));
      continue;
    }
    try {
      await handle(agent, ev);
    } catch (err) {
      stats.errors++;
      emit({ type: 'error', agent, detail: `${ev.kind}: ${err.message}` });
    }
  }
}

export function startAgents() {
  for (const agent of Object.keys(AGENTS)) worker(agent);
}

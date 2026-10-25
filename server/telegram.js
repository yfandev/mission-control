// Optional Telegram bridge (enabled when TELEGRAM_BOT_TOKEN is set).
// Customers: any message goes to the Support agent. Orders ("ship 12 pallets
//   Fresno -> Seattle by Friday") flow Support -> Procurement -> Dispatch and the
//   customer gets an instant acknowledgement plus a confirmation when scheduled.
// Ops manager (TELEGRAM_ALERT_CHAT_ID only): blocked-egress alerts, escalations
//   with Approve / Reject buttons, and the demo commands /status /pause /surge
//   /supplier /inject.
// Uses long polling, so the box needs no public URL or open port. Only one
// process may poll a bot token at a time.
import { emit, onEmit, stats } from './bus.js';
import { config } from './config.js';
import { enqueue, isPaused, queueSizes, togglePause } from './agents.js';
import { CHAOS, customerMessage } from './scenarios.js';
import { checkEgress } from './policy.js';
import { onOrder } from './tools.js';

const API = () => `https://api.telegram.org/bot${config.telegramToken}`;
const OPS = String(config.telegramAlertChat || '');
const MAX_LEN = 500;
const COOLDOWN_MS = 30_000;
const lastMessageAt = new Map();

async function tg(method, body) {
  // The bridge obeys the same egress policy as the agents.
  if (!checkEgress({ agent: 'telegram', target: 'api.telegram.org' }).allowed) return null;
  const res = await fetch(`${API()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(40_000),
  });
  const data = await res.json();
  if (!data.ok) console.error(`[telegram] ${method}: ${data.description}`);
  return data.result;
}

const say = (chat_id, text, extra = {}) => chat_id && tg('sendMessage', { chat_id, text, ...extra });
const isOps = (chat) => OPS !== '' && String(chat) === OPS;

function onMessage(m) {
  const chat = m.chat.id;
  const text = (m.text || '').trim();
  if (!text) return;
  const cmd = text.startsWith('/') ? text.split(/[\s@]/)[0].toLowerCase() : '';

  if (cmd === '/start' || cmd === '/whoami') {
    console.log(`[telegram] /start from chat ${chat}${m.from?.username ? ` (@${m.from.username})` : ''}`);
    return say(chat, 'Northwind Logistics. Tell us what to ship (e.g. "Ship 10 pallets of avocados from Fresno to Seattle by Friday") or ask about a shipment. Our AI team runs entirely on a local Dell GB10.');
  }

  if (cmd) {
    if (!isOps(chat)) return say(chat, 'That command is for the operations team.');
    if (cmd === '/status') {
      return say(chat, `Mission Control\nmodel: ${config.model}\npaused: ${isPaused()}\nqueues: ${JSON.stringify(queueSizes())}\nstats: ${JSON.stringify(stats)}`);
    }
    if (cmd === '/pause') return say(chat, togglePause() ? 'Event stream paused.' : 'Event stream resumed.');
    if (['/surge', '/supplier', '/inject'].includes(cmd)) return say(chat, `Chaos: ${CHAOS[cmd.slice(1)]()}`);
    return say(chat, 'Commands: /status /pause /surge /supplier /inject');
  }

  // Customer message: rate-limit and size-limit so one phone can't flood the queue.
  const now = Date.now();
  if (!isOps(chat) && now - (lastMessageAt.get(chat) || 0) < COOLDOWN_MS) {
    return say(chat, 'Thanks, we are still working on your last message. Try again in a few seconds.');
  }
  lastMessageAt.set(chat, now);

  const who = m.from?.username ? `@${m.from.username}` : m.from?.first_name || 'Telegram customer';
  const ev = customerMessage(`${who} (Telegram)`, text.slice(0, MAX_LEN), chat);
  ev.onDone = ({ reply, called }) => {
    if (called.includes('create_order')) return; // order replies come from the order hooks
    say(chat, reply || 'Thanks, our team has picked this up.');
  };
  enqueue('support', ev);
}

async function onCallback(q) {
  if (!isOps(q.message.chat.id)) return tg('answerCallbackQuery', { callback_query_id: q.id, text: 'Not allowed' });
  const [verdict, ticket] = String(q.data || '').split(':');
  const approved = verdict === 'approve';
  emit({ type: 'action', agent: 'support', tool: 'human_decision', detail: `Ops manager ${approved ? 'APPROVED' : 'REJECTED'} ${ticket} via Telegram` });
  await tg('answerCallbackQuery', { callback_query_id: q.id, text: approved ? 'Approved' : 'Rejected' });
  await tg('editMessageReplyMarkup', { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } });
  await say(q.message.chat.id, `${ticket}: ${approved ? '✅ approved' : '❌ rejected'} by ops manager.`);
}

export function startTelegram() {
  if (!config.telegramToken) return console.log('[telegram] disabled (no TELEGRAM_BOT_TOKEN)');
  if (!OPS) console.log('[telegram] TELEGRAM_ALERT_CHAT_ID not set: ops alerts and commands are off. Send /start to the bot and read your chat id here.');

  onOrder((kind, order) => {
    if (!order.chat) return;
    if (kind === 'created') say(order.chat, `📦 Got it. Order ${order.id} created: ${order.cargo}, ${order.route}. Sourcing a supplier now…`);
    if (kind === 'scheduled') say(order.chat, `✅ Order ${order.id} confirmed\nRoute: ${order.route}\nCarrier: ${order.carrier}\nDeliver by: ${order.deadline}`);
  });

  onEmit((m) => {
    if (!OPS) return;
    if (m.type === 'blocked') say(OPS, `🚨 BLOCKED by egress policy\nagent: ${m.agent}\nhost: ${m.host}\n${m.detail}`);
    if (m.type === 'action' && m.tool === 'escalate_ticket') {
      const ticket = m.detail.split(' ')[0];
      say(OPS, `⚠️ Escalation needs a human\n${m.detail}`, {
        reply_markup: { inline_keyboard: [[{ text: '✅ Approve', callback_data: `approve:${ticket}` }, { text: '❌ Reject', callback_data: `reject:${ticket}` }]] },
      });
    }
  });

  (async () => {
    const me = await tg('getMe', {});
    console.log(`[telegram] connected as @${me?.username}${OPS ? `, ops chat ${OPS}` : ''}`);
    let offset = 0;
    for (;;) {
      try {
        const updates = (await tg('getUpdates', { offset, timeout: 30 })) || [];
        for (const u of updates) {
          offset = u.update_id + 1;
          if (u.message) onMessage(u.message);
          if (u.callback_query) onCallback(u.callback_query);
        }
      } catch (err) {
        console.error('[telegram] poll failed:', err.message);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  })();
}

// Optional Telegram bridge (enabled when TELEGRAM_BOT_TOKEN is set).
// In:  any message to the bot becomes a customer ticket for the Support agent,
//      and the agent's answer goes back to that chat. /status /pause /surge
//      /supplier /inject control the demo from a phone.
// Out: blocked egress attempts and escalations alert the ops manager's chat,
//      escalations with Approve / Reject buttons.
// Uses long polling, so the box needs no public URL or open port.
import { emit, onEmit, stats } from './bus.js';
import { config } from './config.js';
import { enqueue, queueSizes, togglePause, isPaused } from './agents.js';
import { CHAOS, supportTicket } from './scenarios.js';
import { checkEgress } from './policy.js';

const API = () => `https://api.telegram.org/bot${config.telegramToken}`;
let alertChat = config.telegramAlertChat;

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

function onMessage(m) {
  const chat = m.chat.id;
  const text = (m.text || '').trim();
  if (!text) return;
  if (!alertChat) alertChat = chat; // first person to talk to the bot gets ops alerts

  const cmd = text.split(/[\s@]/)[0].toLowerCase();
  if (cmd === '/start') return say(chat, 'Northwind Logistics support. Describe your shipment issue and our AI team (running locally on a Dell GB10) will handle it.');
  if (cmd === '/status') {
    return say(chat, `Mission Control\nmodel: ${config.model}\npaused: ${isPaused()}\nqueues: ${JSON.stringify(queueSizes())}\nstats: ${JSON.stringify(stats)}`);
  }
  if (cmd === '/pause') return say(chat, togglePause() ? 'Event stream paused.' : 'Event stream resumed.');
  if (cmd === '/surge' || cmd === '/supplier' || cmd === '/inject') return say(chat, `Chaos: ${CHAOS[cmd.slice(1)]()}`);

  const who = m.from?.username ? `@${m.from.username}` : m.from?.first_name || 'Telegram customer';
  const ev = supportTicket(`${who} (Telegram)`, text);
  ev.kind = 'telegram ticket';
  ev.onDone = ({ reply }) => say(chat, reply || 'Thanks — our team has picked this up.');
  enqueue('support', ev);
}

async function onCallback(q) {
  const [verdict, ticket] = String(q.data || '').split(':');
  const approved = verdict === 'approve';
  emit({ type: 'action', agent: 'support', tool: 'human_decision', detail: `Ops manager ${approved ? 'APPROVED' : 'REJECTED'} ${ticket} via Telegram` });
  await tg('answerCallbackQuery', { callback_query_id: q.id, text: approved ? 'Approved' : 'Rejected' });
  await tg('editMessageReplyMarkup', { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } });
  await say(q.message.chat.id, `${ticket}: ${approved ? '✅ approved' : '❌ rejected'} by ops manager.`);
}

export function startTelegram() {
  if (!config.telegramToken) return console.log('[telegram] disabled (no TELEGRAM_BOT_TOKEN)');

  onEmit((m) => {
    if (m.type === 'blocked') say(alertChat, `🚨 BLOCKED by egress policy\nagent: ${m.agent}\nhost: ${m.host}\n${m.detail}`);
    if (m.type === 'action' && m.tool === 'escalate_ticket') {
      const ticket = m.detail.split(' ')[0];
      say(alertChat, `⚠️ Escalation needs a human\n${m.detail}`, {
        reply_markup: { inline_keyboard: [[{ text: '✅ Approve', callback_data: `approve:${ticket}` }, { text: '❌ Reject', callback_data: `reject:${ticket}` }]] },
      });
    }
  });

  (async () => {
    const me = await tg('getMe', {});
    console.log(`[telegram] connected as @${me?.username}`);
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

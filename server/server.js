// Mission Control backend: zero dependencies, Node 18+.
//   GET  /                 the dashboard (ui/index.html)
//   GET  /events           Server-Sent Events stream for the dashboard
//   POST /chaos/:name      supplier | surge | inject | pause
//   GET  /api/state        queues, stats and company records (for debugging)
import fs from 'node:fs';
import http from 'node:http';
import { addClient, clientCount, emit, stats } from './bus.js';
import { config } from './config.js';
import { enqueue, isPaused, queueSizes, startAgents, togglePause } from './agents.js';
import { CHAOS, customerMessage, startStream } from './scenarios.js';
import { load, seedIfMissing } from './state.js';
import { startTelegram } from './telegram.js';
import { startTelemetry, sysMessage } from './telemetry.js';

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.createReadStream(config.uiFile).pipe(res);
  }

  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    addClient(res);
    res.write(`data: ${JSON.stringify({ id: 'hello', t: Date.now(), ...(await sysMessage()), stats })}\n\n`);
    const ping = setInterval(() => res.write(': ping\n\n'), 15000);
    res.on('close', () => clearInterval(ping));
    return;
  }

  if (req.method === 'POST' && url.pathname.startsWith('/chaos/')) {
    const name = url.pathname.split('/')[2];
    if (name === 'pause') {
      const p = togglePause();
      emit({ type: 'action', agent: 'dispatch', tool: 'stream_control', detail: p ? 'Event stream PAUSED' : 'Event stream RESUMED' });
      return json(res, 200, { paused: p });
    }
    if (!CHAOS[name]) return json(res, 404, { error: `unknown chaos ${name}` });
    return json(res, 200, { ok: true, result: CHAOS[name]() });
  }

  if (req.method === 'POST' && url.pathname === '/api/inbound') {
    // A customer message without Telegram (testing, or a fallback if Telegram is down).
    let body = '';
    for await (const chunk of req) body += chunk;
    let msg;
    try {
      msg = JSON.parse(body || '{}');
    } catch {
      return json(res, 400, { error: 'body must be JSON: {"from": "...", "text": "..."}' });
    }
    if (!msg.text) return json(res, 400, { error: 'missing "text"' });
    const ev = customerMessage(String(msg.from || 'Web customer').slice(0, 80), String(msg.text).slice(0, 500));
    enqueue('support', ev);
    return json(res, 202, { ok: true, ticket: ev.ticketId });
  }

  if (req.method === 'GET' && url.pathname === '/api/state') {
    return json(res, 200, {
      model: config.model,
      paused: isPaused(),
      clients: clientCount(),
      queues: queueSizes(),
      stats,
      orders: load('orders'),
      suppliers: load('suppliers'),
      tickets: load('tickets').slice(-20),
      outbox: load('outbox').slice(-20),
    });
  }

  json(res, 404, { error: 'not found' });
});

seedIfMissing();
startAgents();
startStream();
startTelemetry();
startTelegram();

server.listen(config.port, () => {
  console.log(`Mission Control on http://localhost:${config.port}  model=${config.model}  ollama=${config.ollamaUrl}`);
});

// System telemetry for the dashboard: real memory use, the real model name, and
// whether the box can reach the internet at all. On the GB10, CPU and GPU share
// one 128 GB pool, so /proc/meminfo is the honest number.
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import { emit } from './bus.js';
import { config } from './config.js';
import { modelLoaded } from './llm.js';

function memory() {
  try {
    const info = fs.readFileSync('/proc/meminfo', 'utf8');
    const kb = (k) => Number(info.match(new RegExp(`${k}:\\s+(\\d+)`))?.[1] || 0);
    return { total: kb('MemTotal') / 1048576, used: (kb('MemTotal') - kb('MemAvailable')) / 1048576 };
  } catch {
    return { total: os.totalmem() / 2 ** 30, used: (os.totalmem() - os.freemem()) / 2 ** 30 };
  }
}

// Internet check: a plain TCP connect to well-known public endpoints (no DNS,
// no data sent). Online if any of them answers within the timeout.
function reachable(target, timeoutMs = 1500) {
  const [host, port] = target.split(':');
  return new Promise((resolve) => {
    const sock = net.connect({ host, port: Number(port) });
    const done = (ok) => {
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(timeoutMs, () => done(false));
    sock.once('connect', () => done(true));
    sock.once('error', () => done(false));
  });
}

let label = config.model;
let online = null; // unknown until the first check

export async function sysMessage() {
  const m = memory();
  return {
    type: 'sys',
    model: label,
    memUsedGB: Number(m.used.toFixed(1)),
    memTotalGB: Number(m.total.toFixed(1)),
    ...(online === null ? {} : { online }),
  };
}

// Venue wifi drops single packets, so one failed check must not flip the badge:
// go OFF only after OFFLINE_AFTER failed checks in a row (~6 s); come back ON at once.
const OFFLINE_AFTER = 3;
let failures = 0;

async function checkNetwork() {
  const results = await Promise.all(config.netProbes.map((t) => reachable(t)));
  failures = results.some(Boolean) ? 0 : failures + 1;
  const now = online === null ? failures === 0 : failures < OFFLINE_AFTER;
  if (now !== online) {
    const first = online === null;
    online = now;
    console.log(`[network] internet ${now ? 'CONNECTED' : 'OFF: agents keep running on the local model'}`);
    if (!first) emit(await sysMessage()); // tell the dashboard right away, not at the next tick
  }
}

export function startTelemetry() {
  setInterval(async () => emit(await sysMessage()), 3000);
  const refresh = async () => {
    const loaded = await modelLoaded();
    label = loaded ? config.model : `${config.model} (loading…)`;
  };
  refresh();
  setInterval(refresh, 10000);
  checkNetwork();
  setInterval(checkNetwork, 2000);
}

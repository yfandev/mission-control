// System telemetry for the dashboard: real memory use and the real model name.
// On the GB10, CPU and GPU share one 128 GB pool, so /proc/meminfo is the
// honest number.
import fs from 'node:fs';
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

let label = `${config.model} · local`;

export async function sysMessage() {
  const m = memory();
  return { type: 'sys', model: label, memUsedGB: Number(m.used.toFixed(1)), memTotalGB: Number(m.total.toFixed(1)) };
}

export function startTelemetry() {
  setInterval(async () => emit(await sysMessage()), 3000);
  const refresh = async () => {
    const loaded = await modelLoaded();
    label = loaded ? `${config.model} · ${(loaded.size / 1e9).toFixed(0)} GB loaded` : `${config.model} · loading…`;
  };
  refresh();
  setInterval(refresh, 10000);
}

// Offline voice orders: the dashboard posts a 16 kHz mono WAV, whisper.cpp turns it
// into text on this machine, and the text enters the same path as a Telegram order.
// Prefers a running whisper-server (model stays in memory: fast); falls back to
// spawning whisper-cli per request.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { emit } from './bus.js';
import { config } from './config.js';

// Languages the dashboard can force (Whisper codes). 'auto' lets Whisper detect it.
export const VOICE_LANGS = ['auto', 'en', 'es', 'pt', 'yue'];

async function viaServer(wav, lang) {
  const form = new FormData();
  form.append('file', new Blob([wav], { type: 'audio/wav' }), 'order.wav');
  form.append('response_format', 'verbose_json');
  form.append('language', lang);
  form.append('temperature', '0.0');
  const res = await fetch(`${config.whisperUrl}/inference`, { method: 'POST', body: form, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`whisper-server ${res.status}`);
  const data = await res.json();
  return { text: String(data.text || '').replace(/\s+/g, ' ').trim(), language: data.detected_language || data.language || null };
}

function viaCli(wav, lang) {
  if (!config.whisperBin || !config.whisperModel) throw new Error('no whisper-server running and WHISPER_BIN/WHISPER_MODEL not set');
  const file = path.join(os.tmpdir(), `mc-voice-${Date.now()}.wav`);
  fs.writeFileSync(file, wav);
  return new Promise((resolve, reject) => {
    execFile(config.whisperBin, ['-m', config.whisperModel, '-f', file, '-nt', '-np', '-l', lang], { timeout: 120_000 }, (err, stdout) => {
      fs.rm(file, () => {});
      if (err) return reject(err);
      resolve({ text: stdout.replace(/\s+/g, ' ').trim(), language: null });
    });
  });
}

export async function transcribe(wav, lang = 'auto') {
  try {
    return await viaServer(wav, lang);
  } catch (err) {
    if (!config.whisperBin) throw err;
    return viaCli(wav, lang);
  }
}

// Whisper sometimes returns these for silence or noise; treat them as "heard nothing".
const NOISE = /^\s*(\[.*\]|\(.*\)|you|thank you\.?|thanks for watching!?|\.+)\s*$/i;

export async function handleVoice(wav, lang = 'auto') {
  if (!VOICE_LANGS.includes(lang)) lang = 'auto';
  emit({ type: 'voice', stage: 'transcribing', forced: lang !== 'auto' ? lang : null });
  const started = Date.now();
  const { text, language } = await transcribe(wav, lang);
  const ms = Date.now() - started;
  if (!text || NOISE.test(text)) {
    emit({ type: 'voice', stage: 'error', text: "Didn't catch that. Hold the mic button and speak clearly." });
    return { text: '' };
  }
  emit({ type: 'voice', stage: 'heard', text, language: language || (lang !== 'auto' ? lang : null), ms });
  return { text, language, ms };
}

// Egress policy: every outbound action is checked here before it happens.
// Two rules: (1) the destination host must be on the allowlist, and
// (2) bulk customer data may never leave for a non-internal address.
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

function hostOf(target) {
  const t = String(target || '').trim().toLowerCase();
  if (t.includes('@')) return t.split('@').pop().replace(/[>\s]/g, '');
  try {
    return new URL(t.includes('://') ? t : `https://${t}`).hostname;
  } catch {
    return t;
  }
}

const allowed = (host) => config.allowDomains.some((d) => host === d || host.endsWith(`.${d}`));

export function checkEgress({ agent, target, body = '', customerEmails = [] }) {
  const host = hostOf(target);
  let verdict = { allowed: true, host, reason: 'allowlisted destination' };

  if (!allowed(host)) {
    verdict = { allowed: false, host, reason: `destination ${host} is not on the egress allowlist` };
  } else {
    const external = host !== config.internalDomain && !host.endsWith(`.${config.internalDomain}`);
    const leaked = customerEmails.filter((e) => body.toLowerCase().includes(e.toLowerCase()));
    if (external && leaked.length >= 3) {
      verdict = { allowed: false, host, reason: `bulk customer data (${leaked.length} customer contacts) to an external address` };
    }
  }

  fs.mkdirSync(config.stateDir, { recursive: true });
  fs.appendFileSync(
    path.join(config.stateDir, 'egress.log'),
    JSON.stringify({ t: new Date().toISOString(), agent, target, ...verdict }) + '\n',
  );
  return verdict;
}

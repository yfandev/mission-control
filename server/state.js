// Company state lives in JSON files under state/, so every tool call visibly
// changes something on disk. Seeded on first run with a fictional company.
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const SEED = {
  customers: [
    { id: 'C-100', name: 'Acme Corp', contact: 'ops@acmecorp.com' },
    { id: 'C-101', name: 'Globex', contact: 'shipping@globex.com' },
    { id: 'C-102', name: 'Initech', contact: 'logistics@initech.com' },
    { id: 'C-103', name: 'Hooli', contact: 'supply@hooli.com' },
    { id: 'C-104', name: 'Soylent', contact: 'freight@soylent.com' },
  ],
  suppliers: [
    { id: 'S-1', name: 'Pacific Freight', contact: 'dispatch@pacificfreight.com', status: 'active' },
    { id: 'S-2', name: 'Coastline Carriers', contact: 'bookings@coastline-carriers.com', status: 'active' },
    { id: 'S-3', name: 'Summit Reefer', contact: 'ops@summit-reefer.com', status: 'active' },
  ],
  orders: [
    { id: 'PO-99124', customer: 'Acme Corp', supplier: 'Pacific Freight', route: 'Oakland -> Denver', carrier: 'Pacific Freight', status: 'in_transit' },
    { id: 'PO-99125', customer: 'Globex', supplier: 'Pacific Freight', route: 'Long Beach -> Phoenix', carrier: 'Pacific Freight', status: 'scheduled' },
    { id: 'PO-99126', customer: 'Initech', supplier: 'Summit Reefer', route: 'Fresno -> Seattle', carrier: 'Summit Reefer', status: 'in_transit' },
    { id: 'PO-99127', customer: 'Hooli', supplier: 'Coastline Carriers', route: 'San Jose -> Portland', carrier: 'Coastline Carriers', status: 'scheduled' },
    { id: 'PO-99128', customer: 'Soylent', supplier: 'Pacific Freight', route: 'Stockton -> Salt Lake City', carrier: 'Pacific Freight', status: 'scheduled' },
  ],
  tickets: [],
  outbox: [],
};

const file = (name) => path.join(config.stateDir, `${name}.json`);

export function load(name) {
  try {
    return JSON.parse(fs.readFileSync(file(name), 'utf8'));
  } catch {
    return structuredClone(SEED[name] ?? []);
  }
}

export function save(name, data) {
  fs.mkdirSync(config.stateDir, { recursive: true });
  fs.writeFileSync(file(name), JSON.stringify(data, null, 2));
}

export function seedIfMissing() {
  for (const name of Object.keys(SEED)) if (!fs.existsSync(file(name))) save(name, SEED[name]);
}

export function update(name, fn) {
  const data = load(name);
  const result = fn(data);
  save(name, data);
  return result;
}

let ticketSeq = 4100;
export function createTicket(customer, subject) {
  const ticket = { id: `T-${++ticketSeq}`, customer, subject, status: 'open', opened: new Date().toISOString() };
  update('tickets', (t) => t.push(ticket));
  return ticket;
}

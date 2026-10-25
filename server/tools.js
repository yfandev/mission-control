// Agent tools. Each one changes real state on disk and reports an `action`
// to the dashboard. Every outbound send goes through the egress policy first.
import { emit, stats } from './bus.js';
import { checkEgress } from './policy.js';
import { load, update } from './state.js';

const fn = (name, description, properties, required = Object.keys(properties)) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required } },
});
const str = (description) => ({ type: 'string', description });

export const SCHEMAS = {
  resolve_ticket: fn('resolve_ticket', 'Mark a customer ticket resolved with a short resolution note.', {
    ticket_id: str('Ticket id, e.g. T-4101'),
    resolution: str('What was done for the customer'),
  }),
  escalate_ticket: fn('escalate_ticket', 'Escalate a ticket to the human ops manager for approval.', {
    ticket_id: str('Ticket id'),
    reason: str('Why a human must decide'),
  }),
  get_customer_list: fn('get_customer_list', 'Return all customer accounts with their contact emails.', {}),
  send_email: fn('send_email', 'Send an email from Northwind Logistics.', {
    to: str('Recipient email address'),
    subject: str('Subject line'),
    body: str('Email body'),
  }),
  issue_po: fn('issue_po', 'Issue a purchase order to a supplier.', {
    supplier: str('Supplier name'),
    item: str('What is being bought'),
    quantity: str('Quantity'),
  }),
  switch_supplier: fn('switch_supplier', 'Move an order to a different supplier.', {
    order_id: str('Order id, e.g. PO-99124'),
    new_supplier: str('Name of an active supplier'),
    reason: str('Why'),
  }),
  reroute_order: fn('reroute_order', 'Change the route of an order.', {
    order_id: str('Order id'),
    new_route: str('New route, e.g. "Oakland -> Reno -> Denver"'),
    reason: str('Why'),
  }),
  assign_carrier: fn('assign_carrier', 'Assign a carrier to an order.', {
    order_id: str('Order id'),
    carrier: str('Carrier name'),
  }),
  handoff: fn('handoff', 'Hand a task to another agent (support, procurement or dispatch).', {
    to: { type: 'string', enum: ['support', 'procurement', 'dispatch'] },
    detail: str('What the other agent must do'),
  }),
};

// Set by agents.js to avoid a circular import.
let enqueue = () => {};
export const setEnqueue = (f) => (enqueue = f);

const action = (agent, tool, detail) => emit({ type: 'action', agent, tool, detail });

export function runTool(agent, name, args = {}, ctx = {}) {
  switch (name) {
    case 'resolve_ticket': {
      const ok = update('tickets', (t) => {
        const tk = t.find((x) => x.id === args.ticket_id);
        if (tk) Object.assign(tk, { status: 'resolved', resolution: args.resolution });
        return !!tk;
      });
      if (!ok) return `No ticket ${args.ticket_id}.`;
      stats.resolved++;
      action(agent, name, `${args.ticket_id} resolved: ${args.resolution}`);
      return `Ticket ${args.ticket_id} resolved.`;
    }
    case 'escalate_ticket': {
      update('tickets', (t) => {
        const tk = t.find((x) => x.id === args.ticket_id);
        if (tk) Object.assign(tk, { status: 'escalated', reason: args.reason });
      });
      stats.escalated++;
      action(agent, name, `${args.ticket_id} escalated to ops manager: ${args.reason}`);
      return `Ticket ${args.ticket_id} escalated; a human will approve or reject it.`;
    }
    case 'get_customer_list': {
      const customers = load('customers');
      action(agent, name, `read ${customers.length} customer records`);
      return JSON.stringify(customers);
    }
    case 'send_email': {
      const customerEmails = load('customers').map((c) => c.contact);
      const verdict = checkEgress({ agent, target: args.to, body: `${args.subject}\n${args.body}`, customerEmails });
      if (!verdict.allowed) {
        stats.blocked++;
        emit({ type: 'blocked', agent, host: verdict.host, detail: `send_email to ${args.to} blocked: ${verdict.reason}` });
        return `BLOCKED by egress policy: ${verdict.reason}. The email was not sent.`;
      }
      update('outbox', (o) => o.push({ t: new Date().toISOString(), from: agent, ...args }));
      action(agent, name, `email to ${args.to}: ${args.subject}`);
      return `Email sent to ${args.to}.`;
    }
    case 'issue_po': {
      action(agent, name, `PO issued to ${args.supplier}: ${args.quantity} x ${args.item}`);
      return `Purchase order issued to ${args.supplier}.`;
    }
    case 'switch_supplier': {
      const ok = update('orders', (o) => {
        const ord = o.find((x) => x.id === args.order_id);
        if (ord) Object.assign(ord, { supplier: args.new_supplier, carrier: args.new_supplier });
        return !!ord;
      });
      if (!ok) return `No order ${args.order_id}.`;
      action(agent, name, `${args.order_id} -> ${args.new_supplier} (${args.reason})`);
      return `${args.order_id} moved to ${args.new_supplier}.`;
    }
    case 'reroute_order': {
      const ok = update('orders', (o) => {
        const ord = o.find((x) => x.id === args.order_id);
        if (ord) Object.assign(ord, { route: args.new_route, status: 'rerouted' });
        return !!ord;
      });
      if (!ok) return `No order ${args.order_id}.`;
      stats.rerouted++;
      action(agent, name, `${args.order_id} rerouted via ${args.new_route} (${args.reason})`);
      return `${args.order_id} rerouted.`;
    }
    case 'assign_carrier': {
      const ok = update('orders', (o) => {
        const ord = o.find((x) => x.id === args.order_id);
        if (ord) ord.carrier = args.carrier;
        return !!ord;
      });
      if (!ok) return `No order ${args.order_id}.`;
      action(agent, name, `${args.order_id} carrier -> ${args.carrier}`);
      return `${args.carrier} assigned to ${args.order_id}.`;
    }
    case 'handoff': {
      const to = String(args.to || '').toLowerCase();
      if (to === agent || !['support', 'procurement', 'dispatch'].includes(to)) return 'Invalid handoff target.';
      if ((ctx.hops || 0) >= 2) return 'Handoff limit reached; finish the task yourself.';
      emit({ type: 'handoff', from: agent, to, detail: args.detail });
      enqueue(to, { kind: `handoff from ${agent}`, detail: args.detail, hops: (ctx.hops || 0) + 1 });
      return `Handed off to ${to}.`;
    }
    default:
      return `Unknown tool ${name}.`;
  }
}

// v1.10.85 - Records: old bills, quotations, challans and work orders kept
// with a few details and their files (PDF, scan, photo), listed next to the
// documents made in the app, and work orders with what was billed against
// them. Records never reach reports or GST returns: those read bills only.
// Pure functions (no fetch / React), tested by scripts/records-test.mjs.
import { toCsvLine, getFinancialYearLabel, parseLocalDate, isCancelledBill } from '../utils.js';
import { rowsToRecords, toNum, toIsoDate, dateOrderNote } from './bulkCsv.js';

// billed: +1 adds to the amount billed on a work order, -1 takes it off.
export const RECORD_KINDS = [
  { id: 'invoice', label: 'Tax invoice', billed: 1 },
  { id: 'quotation', label: 'Quotation' },
  { id: 'challan', label: 'Delivery challan' },
  { id: 'work-order', label: 'Work order' },
  { id: 'proforma', label: 'Proforma invoice' },
  { id: 'credit-note', label: 'Credit note', billed: -1 },
  { id: 'other', label: 'Other' },
];
export const kindLabel = (id) => RECORD_KINDS.find((k) => k.id === id)?.label || 'Other';
const billedSign = (id) => RECORD_KINDS.find((k) => k.id === id)?.billed || 0;

// The app's own document types, as record kinds.
const BILL_KIND = {
  'tax-invoice': 'invoice', 'bill-of-supply': 'invoice', composition: 'invoice',
  quotation: 'quotation', proforma: 'proforma', 'credit-note': 'credit-note', 'delivery-challan': 'challan',
};
const BILL_LABEL = { 'bill-of-supply': 'Bill of supply', composition: 'Bill of supply' };

// Files that can be attached, and what the browser is told they are.
export const RECORD_FILE_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.xls', '.xlsx', '.doc', '.docx', '.csv'];
export const RECORD_FILE_LIMIT_MB = 25;

// "UPLC/WO/2026/142" and "uplc/wo/2026/142 " are the same work order.
export const workOrderKey = (s) => String(s || '').toUpperCase().replace(/\s+/g, '');

export const financialYearOf = (date) => (date ? getFinancialYearLabel(parseLocalDate(date)) : '');

// Only the fields a record has; anything else in the object is dropped.
export function cleanRecord(r) {
  const amount = r?.amount === '' || r?.amount === null || r?.amount === undefined ? null : Number(r.amount);
  return {
    ...(r?.id ? { id: String(r.id) } : {}),
    kind: RECORD_KINDS.some((k) => k.id === r?.kind) ? r.kind : 'other',
    number: String(r?.number || '').trim(),
    date: String(r?.date || '').trim(),
    party: String(r?.party || '').trim(),
    amount: Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null,
    workOrderNo: r?.kind === 'work-order' ? '' : String(r?.workOrderNo || '').trim(),
    notes: String(r?.notes || '').trim(),
    files: (Array.isArray(r?.files) ? r.files : [])
      .filter((f) => f && typeof f.name === 'string' && f.name)
      .map((f) => ({ name: f.name, originalName: String(f.originalName || f.name), size: Number(f.size) || 0 })),
    ownerGstin: String(r?.ownerGstin || ''),
    ownerName: String(r?.ownerName || ''),
    ...(r?.createdAt ? { createdAt: String(r.createdAt) } : {}),
    ...(r?.updatedAt ? { updatedAt: String(r.updatedAt) } : {}),
  };
}

// Why a record cannot be saved, in words; '' when it can.
export function recordProblem(r) {
  if (!r.number) return 'Enter the document number.';
  if (!r.date || !toIsoDate(r.date)) return 'Enter the date.';
  if (r.amount !== null && r.amount !== undefined && r.amount !== '' && !Number.isFinite(Number(r.amount))) return 'The amount must be a number.';
  return '';
}

// Old records and the app's documents as one list, newest first. A work order
// is its own work order, so it links to the documents made against it.
export function documentRows(records = [], bills = []) {
  const rows = [
    ...records.map((r) => ({
      key: `rec:${r.id}`, source: 'old', kind: r.kind, typeLabel: kindLabel(r.kind),
      number: r.number, date: r.date, party: r.party, amount: r.amount,
      workOrderNo: r.kind === 'work-order' ? r.number : r.workOrderNo || '',
      cancelled: false, files: r.files || [], notes: r.notes || '', record: r,
    })),
    ...bills.map((b) => {
      const type = b.invoiceType || b.data?.invoiceType || 'tax-invoice';
      const kind = BILL_KIND[type] || 'other';
      return {
        key: `bill:${b.id}`, source: 'app', kind, typeLabel: BILL_LABEL[type] || kindLabel(kind),
        number: b.invoiceNumber || b.id, date: b.invoiceDate || '', party: b.clientName || b.data?.client?.name || '',
        amount: Number.isFinite(Number(b.totalAmount)) ? Number(b.totalAmount) : null,
        workOrderNo: String(b.data?.details?.buyerOrderNo || '').trim(),
        cancelled: isCancelledBill(b), files: [], notes: '', bill: b,
      };
    }),
  ];
  return rows.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.number).localeCompare(String(a.number)));
}

// One entry per work order: the order (when it is recorded) and every
// document that names it. billed = invoices less credit notes, cancelled
// ones left out; balance only when the order's value is known.
export function workOrderSummary(rows = []) {
  const groups = new Map();
  for (const row of rows) {
    const key = workOrderKey(row.workOrderNo);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, { key, number: row.workOrderNo, order: null, docs: [] });
    const g = groups.get(key);
    if (row.kind === 'work-order' && !g.order) { g.order = row; g.number = row.number; } else g.docs.push(row);
  }
  return [...groups.values()].map((g) => {
    const live = g.docs.filter((d) => !d.cancelled);
    const billed = Math.round(live.reduce((s, d) => s + billedSign(d.kind) * (Number(d.amount) || 0), 0) * 100) / 100;
    const value = g.order && g.order.amount !== null && g.order.amount !== undefined ? Number(g.order.amount) : null;
    const dates = [g.order?.date, ...g.docs.map((d) => d.date)].filter(Boolean).sort();
    return {
      ...g,
      date: g.order?.date || dates[0] || '',
      party: g.order?.party || g.docs.find((d) => d.party)?.party || '',
      value, billed,
      balance: value === null ? null : Math.round((value - billed) * 100) / 100,
      counts: Object.fromEntries(RECORD_KINDS.map((k) => [k.id, live.filter((d) => d.kind === k.id).length])),
    };
  }).sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.number.localeCompare(b.number));
}

// ------------------------------------------------------------- CSV import --

const RECORD_FIELDS = {
  kind: ['type', 'document type', 'document', 'kind'],
  number: ['number', 'no', 'document no', 'document number', 'bill no', 'invoice no', 'doc no'],
  date: ['date', 'document date', 'bill date', 'invoice date'],
  party: ['party', 'party name', 'client', 'client name', 'customer', 'customer name', 'buyer', 'name'],
  amount: ['amount', 'total', 'total amount', 'value', 'grand total'],
  workOrderNo: ['work order no', 'work order', 'work order number', 'wo no', 'po no', 'order no'],
  notes: ['notes', 'note', 'remarks', 'description'],
};

// What people write in a "Type" column -> a kind; '' when it is not one.
export function kindFromText(v) {
  const s = String(v || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!s) return '';
  if (/^(taxinvoice|invoice|inv|bill|sale|salesinvoice|billofsupply)$/.test(s)) return 'invoice';
  if (/^(quotation|quote|qtn|quo|estimate)$/.test(s)) return 'quotation';
  if (/^(deliverychallan|challan|dc)$/.test(s)) return 'challan';
  if (/^(workorder|wo|purchaseorder|po|order)$/.test(s)) return 'work-order';
  if (/^(proforma|proformainvoice|pi)$/.test(s)) return 'proforma';
  if (/^(creditnote|cn)$/.test(s)) return 'credit-note';
  if (s === 'other') return 'other';
  return '';
}

const dupKey = (r) => `${r.kind}|${workOrderKey(r.number)}`;

// Text -> { list, skipped, errors, warning }. A row with a problem is left out
// and named in errors; a type + number already saved is skipped, so the same
// file imported twice adds nothing.
export function recordsCsvToList(text, existing = []) {
  const { records } = rowsToRecords(text, RECORD_FIELDS);
  const out = { list: [], skipped: 0, errors: [], warning: '' };
  const order = dateOrderNote(records.map((r) => r.date));
  if (order.error) { out.errors.push(order.error); return out; }
  out.warning = order.warning || '';
  const known = new Set(existing.map(dupKey));
  for (const r of records) {
    if (!Object.entries(r).some(([k, v]) => k !== '_line' && v)) continue;
    const label = `Row ${r._line}${r.number ? ` (${r.number})` : ''}`;
    const kind = kindFromText(r.kind);
    if (!kind) { out.errors.push(`${label}: Type must be Invoice, Quotation, Challan, Work order, Proforma, Credit note or Other`); continue; }
    if (!r.number) { out.errors.push(`${label}: the number is empty`); continue; }
    const date = toIsoDate(r.date);
    if (!date) { out.errors.push(`${label}: the date is missing or not a date (use DD-MM-YYYY)`); continue; }
    const amount = toNum(r.amount, null);
    if (amount !== null && !Number.isFinite(amount)) { out.errors.push(`${label}: the amount must be a number`); continue; }
    const rec = cleanRecord({ kind, number: r.number, date, party: r.party, amount, workOrderNo: r.workOrderNo, notes: r.notes });
    if (known.has(dupKey(rec))) { out.skipped++; continue; }
    known.add(dupKey(rec));
    out.list.push(rec);
  }
  return out;
}

export const RECORDS_SAMPLE = [
  toCsvLine(['Type', 'Number', 'Date', 'Party', 'Amount', 'Work Order No', 'Notes']),
  toCsvLine(['Work order', 'UPLC/WO/2025/088', '12-06-2025', 'UP Electronics Corporation Limited', '485000', '', '20 laptops for the district office']),
  toCsvLine(['Delivery challan', 'GSPL-DC/2025-26/14', '02-07-2025', 'UP Electronics Corporation Limited', '', 'UPLC/WO/2025/088', '']),
  toCsvLine(['Invoice', 'GSPL/2025-26/31', '05-07-2025', 'UP Electronics Corporation Limited', '485000', 'UPLC/WO/2025/088', '']),
].join('\r\n') + '\r\n';

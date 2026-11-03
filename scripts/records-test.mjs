// v1.10.85 - Records: old documents next to the app's own, work orders with
// what was billed against them, and the CSV import.
//
// Run: `node scripts/records-test.mjs`

import { cleanRecord, recordProblem, documentRows, workOrderSummary, recordsCsvToList, kindFromText, RECORDS_SAMPLE, financialYearOf } from '../src/utils/records.js';

let passed = 0, failed = 0;
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label}\n     expected: ${e}\n     actual:   ${a}`); }
}

console.log('\nA record keeps only its own fields');
const c = cleanRecord({ kind: 'challan', number: ' DC/1 ', date: '2025-07-02', amount: '1200.555', workOrderNo: 'WO/1', files: [{ name: 'a.pdf', originalName: 'scan.pdf', size: 10, path: 'C:/x' }], extra: 'dropped' });
eq(c.number, 'DC/1', 'number trimmed');
eq(c.amount, 1200.56, 'amount rounded to paise');
eq(c.files, [{ name: 'a.pdf', originalName: 'scan.pdf', size: 10 }], 'file entries keep name, original name and size only');
eq('extra' in c, false, 'unknown fields dropped');
eq(cleanRecord({ kind: 'nonsense' }).kind, 'other', 'an unknown type becomes Other');
eq(cleanRecord({ amount: '' }).amount, null, 'blank amount stays blank, not 0');
eq(cleanRecord({ kind: 'work-order', number: 'WO/9', workOrderNo: 'WO/1' }).workOrderNo, '', 'a work order does not point at another work order');
eq(recordProblem(cleanRecord({ number: '', date: '2025-01-01' })), 'Enter the document number.', 'number required');
eq(recordProblem(cleanRecord({ number: 'X', date: '' })), 'Enter the date.', 'date required');
eq(recordProblem(cleanRecord({ number: 'X', date: '2025-01-01' })), '', 'number and date are enough');
eq(financialYearOf('2025-03-31'), '2024-25', '31 March is the old financial year');
eq(financialYearOf('2025-04-01'), '2025-26', '1 April starts the new one');

console.log('\nOld records and app documents in one list, linked by work order');
const records = [
  { id: 'r1', kind: 'work-order', number: 'UPLC/WO/2025/088', date: '2025-06-12', party: 'UPLC', amount: 485000 },
  { id: 'r2', kind: 'challan', number: 'DC/14', date: '2025-07-02', party: 'UPLC', amount: null, workOrderNo: 'uplc/wo/2025/088 ' },
  { id: 'r3', kind: 'invoice', number: 'GSPL/2025-26/31', date: '2025-07-05', party: 'UPLC', amount: 300000, workOrderNo: 'UPLC/WO/2025/088' },
];
const bills = [
  { id: 'GSPL/2026-27/17', invoiceNumber: 'GSPL/2026-27/17', invoiceDate: '2026-11-02', invoiceType: 'tax-invoice', clientName: 'UPLC', totalAmount: 152900, data: { details: { buyerOrderNo: 'UPLC/WO/2025/088' } } },
  { id: 'C1', invoiceNumber: 'GSPL-CN/1', invoiceDate: '2026-11-03', invoiceType: 'credit-note', clientName: 'UPLC', totalAmount: 2900, data: { details: { buyerOrderNo: 'UPLC/WO/2025/088' } } },
  { id: 'X1', invoiceNumber: 'GSPL/2026-27/18', invoiceDate: '2026-11-03', invoiceType: 'tax-invoice', status: 'cancelled', clientName: 'UPLC', totalAmount: 99999, data: { details: { buyerOrderNo: 'UPLC/WO/2025/088' } } },
  { id: 'Q1', invoiceNumber: 'QUO/1', invoiceDate: '2025-06-01', invoiceType: 'quotation', clientName: 'Other Co', totalAmount: 5000, data: { details: {} } },
];
const rows = documentRows(records, bills);
eq(rows.length, 7, 'every record and bill is listed');
eq(rows[0].date >= rows[1].date, true, 'newest first');
eq(rows.find((r) => r.number === 'GSPL/2026-27/17').source, 'app', 'app bill marked as made in the app');
eq(rows.find((r) => r.number === 'DC/14').typeLabel, 'Delivery challan', 'record type label');
eq(rows.find((r) => r.number === 'GSPL-CN/1').kind, 'credit-note', 'app credit note kind');
const wo = workOrderSummary(rows);
eq(wo.length, 1, 'one work order (the quotation names none)');
eq(wo[0].value, 485000, 'order value from the work-order record');
eq(wo[0].billed, 450000, 'billed = old invoice + app invoice - credit note, cancelled left out');
eq(wo[0].balance, 35000, 'balance left to bill');
eq(wo[0].counts.challan, 1, 'challan counted (number matched ignoring case and spaces)');
eq(wo[0].docs.length, 5, 'all documents against it, cancelled included');
const orphan = workOrderSummary(documentRows([], [bills[0]]));
eq([orphan[0].value, orphan[0].balance, orphan[0].billed], [null, null, 152900], 'a work order only named on bills: billed shown, no value or balance');

console.log('\nCSV import');
eq(['Invoice', 'Tax Invoice', 'quote', 'D.C.', 'Work Order', 'PO', 'Credit note', 'P.I.', 'xyz'].map(kindFromText),
  ['invoice', 'invoice', 'quotation', 'challan', 'work-order', 'work-order', 'credit-note', 'proforma', ''], 'type spellings');
const sample = recordsCsvToList(RECORDS_SAMPLE);
eq([sample.list.length, sample.errors.length], [3, 0], 'the sample file imports cleanly');
eq(sample.list[0], { kind: 'work-order', number: 'UPLC/WO/2025/088', date: '2025-06-12', party: 'UP Electronics Corporation Limited', amount: 485000, workOrderNo: '', notes: '20 laptops for the district office', files: [], ownerGstin: '', ownerName: '' }, 'sample work order read in full');
eq(sample.list[1].amount, null, 'blank amount stays blank');
eq(recordsCsvToList(RECORDS_SAMPLE, sample.list).skipped, 3, 'importing the same file twice adds nothing');
const bad = recordsCsvToList('Type,Number,Date,Amount\nLetter,A1,01-01-2025,\nInvoice,,01-01-2025,\nInvoice,B1,32-01-2025,\nInvoice,B2,01-01-2025,abc\nInvoice,B3,"1,250.50"\n');
eq(bad.errors.length, 5, 'bad type, no number, bad date, bad amount, missing date each reported');
eq(bad.list.length, 0, 'none of them imported');
eq(recordsCsvToList('Type,Number,Date\nInvoice,A1,10/25/2025\n').errors.length, 1, 'a month-first file is refused');
eq(recordsCsvToList('Type,Number,Date,Total\nInvoice,A1,05-07-2025,"1,250.50"\n').list[0].amount, 1250.5, 'Total column and Indian number formatting');
eq(Boolean(recordsCsvToList('Type,Number,Date\nInvoice,A1,05-07-2025\n').warning), true, 'an ambiguous date gets a warning');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

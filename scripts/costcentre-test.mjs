// v1.10.83 (#112) - cost centre report maths.
//
// Run: `node scripts/costcentre-test.mjs`
//
// Sales per centre follow the Profit & Loss tab (credit notes subtract,
// cancelled, quotes and challans count for nothing); purchases and expenses
// are without GST; profit = sales taxable - purchases - expenses.

import { costCentreReport, matchesCentre, centresForBusiness, rekeyCentres, centreFields, UNTAGGED } from '../src/utils/costCentres.js';

let passed = 0, failed = 0;
function eq(actual, expected, label) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) { passed++; console.log(`  ok ${label}`); }
  else { failed++; console.log(`  FAIL ${label}\n     expected: ${JSON.stringify(expected)}\n     actual:   ${JSON.stringify(actual)}`); }
}

const centres = [
  { id: 'cc_a', name: 'Site A - Ludhiana', code: 'SA' },
  { id: 'cc_b', name: 'Branch: Jalandhar' },
  { id: 'cc_old', name: 'Project Mehta House', archived: true },
  { id: 'cc_idle', name: 'Closed shop', archived: true },
];
// An invoice keeps its centre in data.details.
const bill = (no, date, total, tax, centre, extra = {}) => ({
  invoiceNumber: no, invoiceDate: date, totalAmount: total, totalTaxAmount: tax,
  invoiceType: 'tax-invoice', status: 'unpaid',
  data: { details: centre ? { costCentre: centre, costCentreName: 'snap' } : {}, totals: {} },
  ...extra,
});
const bills = [
  bill('1', '2026-04-01', 1180, 180, 'cc_a'),                                   // first day of the range
  bill('2', '2026-04-30', 590, 90, 'cc_a'),
  bill('3', '2026-04-15', 2360, 360, 'cc_b'),
  bill('CN1', '2026-04-20', 118, 18, 'cc_a', { invoiceType: 'credit-note' }),  // subtracts
  bill('X', '2026-04-10', 5000, 900, 'cc_a', { status: 'cancelled' }),         // left out
  bill('Q', '2026-04-10', 7000, 0, 'cc_b', { invoiceType: 'proforma' }),       // a quote: left out
  bill('4', '2026-04-12', 1000, 0, ''),                                        // untagged
  bill('5', '2026-05-01', 9999, 0, 'cc_a'),                                    // day after the range
  bill('6', '2026-03-31', 9999, 0, 'cc_a'),                                    // day before
  bill('7', '2026-04-05', 1062, 162, 'cc_old'),                                // archived centre still reported
  bill('8', '2026-04-06', 1100, 50, 'cc_b', { data: { details: { costCentre: 'cc_b' }, totals: { tcsAmount: 50 } } }), // TCS is not income
];
const purchases = [
  { date: '2026-04-02', taxableAmount: 400, totalTax: 72, totalAmount: 472, costCentre: 'cc_a', costCentreName: 'Site A - Ludhiana' },
  { date: '2026-04-30', totalAmount: 236, totalTax: 36, costCentre: 'cc_b' },  // no taxableAmount: total - tax
  { date: '2026-04-09', taxableAmount: 50, totalAmount: 59 },                  // untagged
  { date: '2026-05-01', taxableAmount: 999, totalAmount: 999, costCentre: 'cc_a' },
  { date: '2026-04-03', taxableAmount: 10, totalAmount: 10, costCentre: 'cc_gone', costCentreName: 'Old godown' }, // not in the list any more
];
const expenses = [
  { date: '2026-04-03', amount: 118, gstAmount: 18, costCentre: 'cc_a' },
  { date: '2026-04-04', amount: 300, gstAmount: 0, costCentre: 'cc_b' },
  { date: '2026-04-04', amount: 25, gstAmount: 0 },
  { date: '2026-03-31', amount: 777, gstAmount: 0, costCentre: 'cc_b' },
];

const { rows, total } = costCentreReport({ bills, purchases, expenses, centres, from: '2026-04-01', to: '2026-04-30' });
const by = Object.fromEntries(rows.map((r) => [r.id, r]));

console.log('\n[#112] Sales per cost centre');
eq([by.cc_a.salesTotal, by.cc_a.salesTax, by.cc_a.salesTaxable], [1652, 252, 1400], 'Site A: 1180 + 590 - credit note 118; cancelled left out; range edges included');
eq([by.cc_b.salesTotal, by.cc_b.salesTax, by.cc_b.salesTaxable], [3460, 460, 3000], 'Branch: proforma left out, TCS counted with the tax');
eq([by[UNTAGGED].salesTotal, by[UNTAGGED].salesTaxable], [1000, 1000], 'untagged invoice goes to Untagged');

console.log('\n[#112] Purchases and expenses, without GST');
eq(by.cc_a.purchases, 400, 'purchase taxable value');
eq(by.cc_b.purchases, 200, 'purchase without taxableAmount: total less tax');
eq(by.cc_a.expenses, 100, 'expense less its GST');
eq(by.cc_b.expenses, 300, 'expense dated before the range left out');
eq([by[UNTAGGED].purchases, by[UNTAGGED].expenses], [50, 25], 'untagged purchase and expense');

console.log('\n[#112] Profit');
eq(by.cc_a.profit, 900, 'Site A: 1400 - 400 - 100');
eq(by.cc_b.profit, 2500, 'Branch: 3000 - 200 - 300');
eq(by[UNTAGGED].profit, 925, 'Untagged: 1000 - 50 - 25');

console.log('\n[#112] Archived and unknown centres');
eq([by.cc_old?.salesTaxable, by.cc_old?.archived], [900, true], 'archived centre with sales is still reported');
eq(by.cc_idle, undefined, 'archived centre with nothing in the period is left out');
eq([by.cc_gone?.name, by.cc_gone?.purchases], ['Old godown', 10], 'centre missing from the list uses the name saved on the document');
eq(rows[rows.length - 1].id, UNTAGGED, 'Untagged is the last row');

console.log('\n[#112] Totals add up');
eq([total.salesTotal, total.salesTaxable, total.purchases, total.expenses, total.profit], [7174, 6300, 660, 425, 5215], 'total row');
eq(total.profit, rows.reduce((s, r) => s + r.profit, 0), 'total profit = sum of rows');

console.log('\n[#112] Nothing tagged, no range');
const plain = costCentreReport({ bills: [bill('1', '2025-01-01', 100, 0, '')], centres: [] });
eq(plain.rows.map((r) => [r.name, r.salesTotal]), [['Untagged', 100]], 'only an Untagged row');
eq(costCentreReport({ centres }).rows.map((r) => r.id), ['cc_a', 'cc_b', UNTAGGED], 'no documents: active centres + Untagged, zeros');

console.log('\n[#112] Filters and helpers');
eq(bills.filter((b) => matchesCentre(b, 'cc_a')).length, 6, 'filter by centre reads invoice details');
eq(purchases.filter((p) => matchesCentre(p, UNTAGGED)).length, 1, 'No cost centre filter');
eq(expenses.filter((e) => matchesCentre(e, '')).length, 4, 'All cost centres');
eq(centreFields('', 'x'), {}, 'clearing a centre writes no fields');
eq(centreFields('cc_a', 'Site A'), { costCentre: 'cc_a', costCentreName: 'Site A' }, 'tagging writes id + name');
const list = [{ id: '1', business: '03AAAAA0000A1Z5' }, { id: '2', business: 'NAME:other' }, { id: '3' }];
eq(centresForBusiness(list, { gstin: '03aaaaa0000a1z5' }).map((c) => c.id), ['1', '3'], 'per business, plus centres with no business');
eq(rekeyCentres(list, '03AAAAA0000A1Z5', '03BBBBB0000B1Z5')[0].business, '03BBBBB0000B1Z5', 'a new GSTIN keeps its centres');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);

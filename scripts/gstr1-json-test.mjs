// v1.10.83 (#133) - GSTR-1 JSON parts the GST portal is strict about.
// Run: `node scripts/gstr1-json-test.mjs`
import { hsnSplitFrom, hsnTable, stripEmpty } from '../src/utils/gstr1Json.js';

let passed = 0, failed = 0;
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label}\n     expected: ${e}\n     actual:   ${a}`); }
}

console.log('\n[#133] HSN summary split into B2B and B2C from May 2025');
eq(hsnSplitFrom('082026'), true, 'August 2026 is split');
eq(hsnSplitFrom('052025'), true, 'May 2025 is the first split month');
eq(hsnSplitFrom('042025'), false, 'April 2025 still uses one list');
const rows = [
  { b2b: true, hsn_sc: '4802', desc: 'A4 Copier Paper (500 sheets) premium bright white', uqc: 'PAC', qty: 20, rt: 12, txval: 5600, iamt: 0, camt: 336, samt: 336, csamt: 0 },
  { b2b: false, hsn_sc: '998314', desc: 'Website design', uqc: 'NA', qty: 0, rt: 18, txval: 1000, iamt: 180, camt: 0, samt: 0, csamt: 0 },
  { b2b: true, hsn_sc: '4820', desc: 'Notebook', uqc: 'NOS', qty: 40, rt: 12, txval: 2200, iamt: 0, camt: 132, samt: 132, csamt: 0 },
];
const split = hsnTable(rows, '082026');
eq(Object.keys(split), ['hsn_b2b', 'hsn_b2c'], 'the file has hsn_b2b and hsn_b2c, not data');
eq(split.hsn_b2b.map((r) => `${r.num}:${r.hsn_sc}`), ['1:4802', '2:4820'], 'B2B rows only, numbered from 1');
eq(split.hsn_b2c.map((r) => `${r.num}:${r.hsn_sc}`), ['1:998314'], 'B2C rows numbered from 1 on their own');
eq(split.hsn_b2b[0].desc.length <= 30, true, 'a description is cut to 30 characters');
eq('b2b' in split.hsn_b2b[0], false, 'the sorting flag is not written to the file');
eq(Object.keys(hsnTable(rows, '032025')), ['data'], 'a return before May 2025 keeps one list');

console.log('\n[#133] Blank values are not written');
eq(stripEmpty({ gstin: '03AAA', b2b: [], b2cs: [{ pos: '03', rt: 0, txval: 0, etin: '' }], cdnr: [], hsn: { hsn_b2b: [], hsn_b2c: [{ num: 1 }] }, doc_issue: { doc_det: [] } }),
  { gstin: '03AAA', b2cs: [{ pos: '03', rt: 0, txval: 0 }], hsn: { hsn_b2c: [{ num: 1 }] } },
  'empty lists, empty objects and "" go; 0 stays');

console.log('\n────────────────────────────────────────');
console.log(`Passed: ${passed}   Failed: ${failed}`);
if (failed) process.exit(1);

// v1.10.83 - HSN / SAC rate suggestions follow the GST rates in force
// since 22 Sep 2025, and codes whose rate depends on price, size or
// packing are shown but never auto-filled.
//
// Run: `node scripts/hsnrates-test.mjs`

import { HSN_RATES, SAC_RATES, suggestGstRate, autoFillRate, rateText } from '../src/utils/hsnRates.js';

let passed = 0, failed = 0;
function eq(actual, expected, label) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) { passed++; console.log(`  ok ${label}`); }
  else { failed++; console.log(`  FAIL ${label}\n     expected: ${JSON.stringify(expected)}\n     actual:   ${JSON.stringify(actual)}`); }
}

console.log('\n[hsn rates] Rates since 22 Sep 2025 are auto-filled');
{
  const current = {
    '1806': 5,      // chocolate 18 -> 5
    '1704': 5,      // confectionery 18 -> 5
    '0802': 5,      // nuts 12 -> 5
    '2201': 5,      // mineral water 18 -> 5
    '19053100': 5,  // sweet biscuits 18 -> 5
    '22021010': 40, // aerated sweetened drinks 28 -> 40
    '8528': 18,     // TVs 28 -> 18
    '2523': 18,     // cement 28 -> 18
    '4011': 18,     // tyres 28 -> 18
    '3004': 5,      // medicines 12 -> 5
    '3005': 5,      // bandages 12 -> 5
    '9609': 0,      // pencils 12 -> 0
    '9615': 5,      // combs 12 -> 5
    '481910': 5,    // corrugated cartons 12 -> 5
    '8471': 18,
    '998314': 18,
    '999721': 5,    // salon / spa 18 -> 5
  };
  for (const [code, rate] of Object.entries(current)) eq(autoFillRate(code), rate, `${code} fills ${rate}%`);
}

console.log('\n[hsn rates] Codes that depend on price / size / packing do not auto-fill');
{
  for (const code of ['6109', '6205', '6403', '8703', '8711', '9004', '1905', '2202', '4802', '4820', '1006', '9963', '9997']) {
    eq(autoFillRate(code), null, `${code} is not auto-filled`);
    eq(Array.isArray(suggestGstRate(code)?.rates), true, `${code} still shows a hint`);
  }
  eq(rateText(suggestGstRate('9004')), '5% / 18%', 'Spectacles hint lists both rates');
  eq(suggestGstRate('6109').label.includes('₹2,500'), true, 'Garment hint names the ₹2,500 limit');
  eq(rateText(suggestGstRate('1806')), '5%', 'Single-rate hint');
}

console.log('\n[hsn rates] Table sanity');
{
  const all = Object.values({ ...HSN_RATES, ...SAC_RATES });
  eq(all.filter(e => e.rate === 12 || e.rate === 28).length, 0, 'No entry suggests the old 12% or 28% slab');
  eq(all.every(e => typeof e.rate === 'number' || (Array.isArray(e.rates) && e.rates.length > 1)), true, 'Every entry has one rate or a list');
  eq(suggestGstRate('12'), null, 'Too-short code: no match');
  eq(suggestGstRate('abcd'), null, 'Non-numeric code: no match');
  eq(suggestGstRate('0000'), null, 'Unknown code: no match');
}

console.log('\n────────────────────────────────────────');
console.log(`Passed: ${passed}   Failed: ${failed}`);
if (failed) process.exit(1);

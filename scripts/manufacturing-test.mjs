// v1.10.83 (#115) - manufacturing: bill of materials and production entries.
//
// Run: `node scripts/manufacturing-test.mjs`
//
// The example from the docs: 1 chair = 4 legs + 1 seat + 0.2 kg screws.
// Making 10 chairs must take exactly 40 legs, 10 seats and 2 kg screws out
// and put 10 chairs in; deleting the entry must undo exactly that.

import { findBomLoop, bomError, unitCost, materialsNeeded, productionStock, reverseProductionStock, buildProduction, shortages } from '../src/utils/manufacturing.js';
import { closingStock } from '../src/utils/products.js';
import { stockDelta } from '../src/utils.js';

let passed = 0, failed = 0;
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label}\n     expected: ${e}\n     actual:   ${a}`); }
}

const legs = { id: 'legs', name: 'Chair leg', unit: 'Pcs', stock: 100, purchasePrice: 50 };
const seat = { id: 'seat', name: 'Seat', unit: 'Pcs', stock: 20, purchasePrice: 300 };
const screws = { id: 'screws', name: 'Screws', unit: 'Kg', stock: 5, purchasePrice: 400 };
const chair = { id: 'chair', name: 'Chair', unit: 'Pcs', stock: 3, purchasePrice: 0, madeHere: true,
  bom: [{ productId: 'legs', qty: 4 }, { productId: 'seat', qty: 1 }, { productId: 'screws', qty: 0.2 }] };
const products = [legs, seat, screws, chair];

console.log('\n[#115] Materials list checks');
eq(bomError('chair', chair.bom, products), '', 'The chair list is fine');
eq(bomError('chair', [], products), 'Add at least one raw material.', 'An empty list is refused');
eq(bomError('chair', [{ productId: 'chair', qty: 1 }], products), 'Chair cannot be a raw material of itself.', 'A product cannot be in its own list');
eq(bomError('chair', [{ productId: 'legs', qty: 0 }], products), 'Quantity of Chair leg must be more than 0.', 'Zero quantity is refused');
eq(bomError('chair', [{ productId: 'legs', qty: -1 }], products), 'Quantity of Chair leg must be more than 0.', 'Negative quantity is refused');
eq(bomError('chair', [{ productId: 'legs', qty: 'abc' }], products), 'Quantity of Chair leg must be more than 0.', 'Text quantity is refused');
eq(bomError('chair', [{ productId: '', qty: 1 }], products), 'Choose a product for every raw material line.', 'A line with no product is refused');
eq(/twice/.test(bomError('chair', [{ productId: 'legs', qty: 1 }, { productId: 'legs', qty: 2 }], products)), true, 'The same material twice is refused');
{
  // Seat is made here from chair (silly, but a loop): editing chair to use seat closes it.
  const loopy = [legs, { ...seat, madeHere: true, bom: [{ productId: 'chair', qty: 1 }] }, screws, chair];
  eq(findBomLoop('chair', chair.bom, loopy), 'Chair -> Seat -> Chair', 'A uses B, B uses A is found');
  eq(/use each other/.test(bomError('chair', chair.bom, loopy)), true, '...and refused');
  const longLoop = [{ id: 'a', name: 'A', madeHere: true, bom: [{ productId: 'b', qty: 1 }] },
    { id: 'b', name: 'B', madeHere: true, bom: [{ productId: 'c', qty: 1 }] }, { id: 'c', name: 'C' }];
  eq(findBomLoop('c', [{ productId: 'a', qty: 1 }], longLoop), 'C -> A -> B -> C', 'A three-step loop is found');
  const notMade = [legs, { ...seat, madeHere: false, bom: [{ productId: 'chair', qty: 1 }] }, screws, chair];
  eq(findBomLoop('chair', chair.bom, notMade), '', 'A list on a product no longer "Made here" does not count');
}

console.log('\n[#115] Cost per unit');
eq(unitCost(chair, products), 580, '4 x 50 + 1 x 300 + 0.2 x 400 = 580');
{
  const table = { id: 'table', name: 'Table', madeHere: true, bom: [{ productId: 'chair', qty: 2 }, { productId: 'legs', qty: 1 }] };
  eq(unitCost(table, [...products, table]), 1210, 'A made material with no purchase price is costed from its own list (2 x 580 + 50)');
  eq(unitCost({ ...legs }, products), 0, 'A product not made here has no materials cost');
}

console.log('\n[#115] Making 10 chairs');
const rows = materialsNeeded(chair, 10, products);
eq(rows.map((m) => [m.productId, m.qtyUsed, m.stockAfter]), [['legs', 40, 60], ['seat', 10, 10], ['screws', 2, 3]], 'Uses 40 legs, 10 seats, 2 kg screws; stock left 60, 10, 3');
eq(rows.map((m) => m.cost), [2000, 3000, 800], 'Cost of each material at purchase price');
const stock = productionStock('chair', 10, rows);
eq(stock, { legs: -40, seat: -10, screws: -2, chair: 10 }, 'Stock moves: materials down, chairs up by 10');
eq(reverseProductionStock({ stockApplied: stock }), { legs: 40, seat: 10, screws: 2, chair: -10 }, 'Deleting it moves exactly the reverse');
eq(stockDelta(stock, {}), reverseProductionStock({ stockApplied: stock }), '...the same as the invoices\' stockDelta to nothing');

console.log('\n[#115] Fractions are rounded the app\'s way (roundQty)');
eq(materialsNeeded(chair, 3, products)[2].qtyUsed, 0.6, '0.2 kg x 3 is 0.6, not 0.6000000000000001');
eq(materialsNeeded({ ...chair, bom: [{ productId: 'screws', qty: 0.1 }] }, 3, products)[0].qtyUsed, 0.3, '0.1 x 3 is 0.3');
eq(materialsNeeded({ ...chair, bom: [{ productId: 'screws', qty: 0.3333 }] }, 3, products)[0].qtyUsed, 1, '0.3333 x 3 rounds to 3 decimals: 1');
eq(productionStock('chair', 2.5, materialsNeeded(chair, 2.5, products)), { legs: -10, seat: -2.5, screws: -0.5, chair: 2.5 }, 'Half units work');

console.log('\n[#115] Low stock');
eq(shortages(materialsNeeded(chair, 30, products)).map((m) => [m.name, m.stockAfter]), [['Chair leg', -20], ['Seat', -10], ['Screws', -1]], 'Making 30 chairs: legs, seat and screws would go below zero');
eq(shortages(rows).length, 0, 'Making 10 chairs: enough of everything');

console.log('\n[#115] The entry that is saved');
{
  const owner = { gstin: '27AAAAA0000A1Z5', businessName: 'DiceCodes' };
  const { entry } = buildProduction({ product: chair, qty: '10', date: '2026-10-20', note: ' Batch 1 ', products, owner, id: 'mfg_1' });
  eq([entry.qty, entry.cost, entry.note, entry.ownerGstin, entry.productName], [10, 5800, 'Batch 1', '27AAAAA0000A1Z5', 'Chair'], 'Qty, total cost, note, business and product are kept');
  eq(entry.stockApplied, stock, 'It keeps its own stock record');
  eq(buildProduction({ product: chair, qty: 0, date: '2026-10-20', products }).error, 'Quantity made must be more than 0.', 'Zero made is refused');
  eq(buildProduction({ product: chair, qty: 1, date: '', products }).error, 'Enter the date it was made.', 'A date is needed');
  eq(buildProduction({ product: legs, qty: 1, date: '2026-10-20', products }).error, 'Chair leg is not marked "Made here".', 'Only a made-here product can be made');
  eq(/Choose a product/.test(buildProduction({ product: chair, qty: 1, date: '2026-10-20', products: [chair, seat, screws] }).error), true, 'A raw material deleted from Products stops the entry');

  // Stock report: an entry dated after the month end is undone for that month.
  const after = products.map((p) => ({ ...p, stock: p.stock + (stock[p.id] || 0) }));
  const sept = closingStock(after, [], [], '2026-09-30', [entry]);
  eq([sept.get('legs'), sept.get('chair')], [100, 3], 'Closing stock on 30 Sep is as before the 20 Oct production');
  const oct = closingStock(after, [], [], '2026-10-31', [entry]);
  eq([oct.get('legs'), oct.get('chair')], [60, 13], 'Closing stock on 31 Oct includes it');
  eq(closingStock(after, [], [], '2026-09-30').get('legs'), 60, 'Without productions passed, nothing changes (old callers)');
}

console.log('\n────────────────────────────────────────');
console.log(`Passed: ${passed}   Failed: ${failed}`);
if (failed) process.exit(1);

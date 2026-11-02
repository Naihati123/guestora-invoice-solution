// v1.10.83 (#115) - simple manufacturing: a bill of materials (BOM) on a
// product and production entries ("Make") that use it. Pure functions only,
// unit-tested in scripts/manufacturing-test.mjs; the screens are in
// components/Manufacturing.jsx and the server applies the stock.
//
// A product made here carries  madeHere: true, bom: [{ productId, qty }]
// where qty is how much of that raw material goes into ONE unit made.
// A production entry keeps its own stock record (stockApplied, the same idea
// as an invoice's), so deleting it puts back exactly what it moved.
import { roundQty, stockDelta } from '../utils.js';

const byId = (products) => new Map((products || []).map((p) => [p.id, p]));

// A loop in the materials lists, e.g. chair uses seat, seat uses chair.
// Returns the names along the loop ("Chair -> Seat -> Chair") or ''.
export const findBomLoop = (productId, bom, products) => {
  const map = byId(products);
  const nameOf = (id) => map.get(id)?.name || id;
  const listOf = (id) => (id === productId ? bom : (map.get(id)?.madeHere ? map.get(id)?.bom : null)) || [];
  const walk = (id, path) => {
    for (const line of listOf(id)) {
      const next = line?.productId;
      if (!next) continue;
      if (next === productId) return [...path, next];
      if (path.includes(next)) continue; // a loop that does not pass through this product: not ours to report
      const found = walk(next, [...path, next]);
      if (found) return found;
    }
    return null;
  };
  const loop = walk(productId, [productId]);
  return loop ? loop.map(nameOf).join(' -> ') : '';
};

// What is wrong with a materials list, in plain words, or '' when it is fine.
export const bomError = (productId, bom, products) => {
  const map = byId(products);
  if (!bom?.length) return 'Add at least one raw material.';
  const seen = new Set();
  for (const line of bom) {
    const m = map.get(line?.productId);
    if (!m) return 'Choose a product for every raw material line.';
    if (productId && line.productId === productId) return `${m.name} cannot be a raw material of itself.`;
    if (seen.has(line.productId)) return `${m.name} is in the list twice. Add the quantities together on one line.`;
    seen.add(line.productId);
    const q = Number(line.qty);
    if (!Number.isFinite(q) || q <= 0) return `Quantity of ${m.name} must be more than 0.`;
  }
  const loop = productId ? findBomLoop(productId, bom, products) : '';
  return loop ? `These products use each other: ${loop}. Remove one of them from the list.` : '';
};

// Cost of ONE unit made, from the raw materials' current purchase prices.
// A raw material that is itself made here with no purchase price is costed
// from its own materials list.
export const unitCost = (product, products, seen = new Set()) => {
  if (!product?.madeHere || !product.bom?.length || seen.has(product.id)) return 0;
  const map = byId(products);
  const next = new Set([...seen, product.id]);
  const total = product.bom.reduce((s, line) => {
    const m = map.get(line.productId);
    const price = Number(m?.purchasePrice) || unitCost(m, products, next);
    return s + price * (Number(line.qty) || 0);
  }, 0);
  return Math.round(total * 100) / 100;
};

// What making `qty` of a product uses: one row per raw material, with the
// stock before and after. Quantities are rounded the app's way (roundQty),
// so 0.1 kg x 3 is 0.3, not 0.30000000000000004.
export const materialsNeeded = (product, qty, products) => {
  const map = byId(products);
  const made = Number(qty) || 0;
  return (product?.bom || []).map((line) => {
    const m = map.get(line.productId) || {};
    const perUnit = Number(line.qty) || 0;
    const used = roundQty(perUnit * made);
    const before = roundQty(Number(m.stock) || 0);
    const rate = Number(m.purchasePrice) || unitCost(m, products);
    return {
      productId: line.productId, name: m.name || '(deleted product)', unit: m.unit || 'Nos',
      qtyPerUnit: perUnit, qtyUsed: used, stockBefore: before, stockAfter: roundQty(before - used),
      rate, cost: Math.round(rate * used * 100) / 100,
    };
  });
};

// The stock a production moves: raw materials down, the finished product up.
export const productionStock = (productId, qty, materials) => {
  const out = {};
  for (const m of materials || []) out[m.productId] = roundQty((out[m.productId] || 0) - m.qtyUsed);
  out[productId] = roundQty((out[productId] || 0) + (Number(qty) || 0));
  return stockDelta({}, out); // drops zero entries
};

// What deleting a production does to stock: exactly the reverse of its record.
export const reverseProductionStock = (entry) => stockDelta(entry?.stockApplied, {});

// The production entry to save, or { error }.
export const buildProduction = ({ product, qty, date, note, products, owner, id = `mfg_${Date.now()}` }) => {
  const made = roundQty(Number(qty));
  if (!product) return { error: 'Choose the product you made.' };
  if (!product.madeHere) return { error: `${product.name} is not marked "Made here".` };
  if (!Number.isFinite(made) || made <= 0) return { error: 'Quantity made must be more than 0.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return { error: 'Enter the date it was made.' };
  const err = bomError(product.id, product.bom, products);
  if (err) return { error: `${product.name}: ${err}` };
  const materials = materialsNeeded(product, made, products);
  return {
    entry: {
      id, date, productId: product.id, productName: product.name, unit: product.unit || 'Nos',
      qty: made, note: String(note || '').trim(), materials,
      cost: Math.round(materials.reduce((s, m) => s + m.cost, 0) * 100) / 100,
      stockApplied: productionStock(product.id, made, materials),
      ownerGstin: owner?.gstin || '', ownerName: owner?.businessName || '',
      createdAt: new Date().toISOString(),
    },
  };
};

// Raw materials that would go below zero.
export const shortages = (materials) => (materials || []).filter((m) => m.stockAfter < 0);

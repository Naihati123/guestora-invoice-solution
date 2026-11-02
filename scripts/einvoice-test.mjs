// v1.10.83 (#111) - e-invoice JSON, validation and IRN import.
// Run: node scripts/einvoice-test.mjs
//
// Every invoice here is made the way the editor makes it (computeInvoiceTotals
// gives the saved totals), then turned into the IRP's JSON. The checks the
// portal runs must hold to the paisa: item values add up to ValDtls, and
// ValDtls adds up to the total invoice value, which must equal the printed total.

import { computeInvoiceTotals, gstinChecksumOk, localToday } from '../src/utils.js';
import { buildEInvoice, prepareEInvoices, parseIrpResponse, matchIrnEntries, einvoiceFromInput, decodeSignedQr } from '../src/utils/einvoice.js';

let passed = 0, failed = 0;
const eq = (actual, expected, label) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label}\n     expected: ${e}\n     actual:   ${a}`); }
};
const ok = (cond, label) => eq(!!cond, true, label);
const P = (n) => Math.round(n * 100);

// A GSTIN with a correct check digit (fake businesses, never real ones).
const gstin = (first14) => first14 + '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((c) => gstinChecksumOk(first14 + c));
const SELLER = { businessName: 'DiceCodes', gstin: '29ABCDE1234F1ZW', address: '12 MG Road', city: 'Bengaluru', pin: '560001', state: 'Karnataka', country: 'India', phone: '+91 98450 12345', email: 'accounts@dicecodes.example' };
const KA_BUYER = { name: 'Lotus Traders', gstin: gstin('29AAACL1234K1Z'), address: '4 Brigade Road', city: 'Bengaluru', pin: '560025', state: 'Karnataka' };
const MH_BUYER = { name: 'Sahyadri Books', gstin: gstin('27AAFCS5678M1Z'), address: '9 FC Road', city: 'Pune', pin: '411004', state: 'Maharashtra' };

const makeBill = ({ no = 'KS/26-27/001', date = '2026-10-05', type = 'tax-invoice', client = KA_BUYER, items, opts = {}, taxInclusive = false, details = {}, status = 'unpaid' }) => {
  const invoiceOptions = { ...opts };
  const totals = computeInvoiceTotals({ items, profile: SELLER, client, details, showGST: true, taxInclusive, invoiceOptions });
  return {
    id: no, invoiceNumber: no, invoiceDate: date, invoiceType: type, status, currency: 'INR', totalAmount: totals.total,
    data: { profile: SELLER, client, details: { invoiceNumber: no, invoiceDate: date, ...details }, items, totals, invoiceType: type, invoiceOptions, taxInclusive },
  };
};

// The sums the IRP checks, all in paise.
const reconcile = (doc, bill, label) => {
  const items = doc.ItemList, v = doc.ValDtls;
  const s = (k) => items.reduce((a, i) => a + P(i[k]), 0);
  eq(s('AssAmt'), P(v.AssVal), `${label}: items' AssAmt add up to AssVal`);
  eq(s('CgstAmt'), P(v.CgstVal), `${label}: items' CGST add up to CgstVal`);
  eq(s('SgstAmt'), P(v.SgstVal), `${label}: items' SGST add up to SgstVal`);
  eq(s('IgstAmt'), P(v.IgstVal), `${label}: items' IGST add up to IgstVal`);
  eq(s('CesAmt'), P(v.CesVal), `${label}: items' cess add up to CesVal`);
  ok(items.every((i) => P(i.TotAmt) - P(i.Discount) === P(i.AssAmt)), `${label}: every AssAmt = TotAmt - Discount`);
  ok(items.every((i) => P(i.TotItemVal) === P(i.AssAmt) + P(i.CgstAmt) + P(i.SgstAmt) + P(i.IgstAmt) + P(i.CesAmt)), `${label}: every TotItemVal adds up`);
  eq(P(v.AssVal) + P(v.CgstVal) + P(v.SgstVal) + P(v.IgstVal) + P(v.CesVal) + P(v.OthChrg) - P(v.Discount) + P(v.RndOffAmt), P(v.TotInvVal), `${label}: ValDtls adds up to TotInvVal`);
  eq(v.TotInvVal, bill.data.totals.total, `${label}: TotInvVal = printed total`);
  eq(v.AssVal, bill.data.totals.taxableAmount, `${label}: AssVal = printed taxable value`);
  eq([v.CgstVal, v.SgstVal, v.IgstVal, v.CesVal], [bill.data.totals.cgst, bill.data.totals.sgst + bill.data.totals.utgst, bill.data.totals.igst, bill.data.totals.cess], `${label}: tax heads = printed tax heads`);
  ok(items.every((i) => Math.abs(i.CgstAmt + i.SgstAmt + i.IgstAmt - i.AssAmt * i.GstRt / 100) < 1), `${label}: each item's tax is within ₹1 of AssAmt × rate`);
};

console.log('\n[#111] Intra-state invoice, odd paise on several lines');
{
  const items = [
    { name: 'A4 copier paper', hsn: '48025690', quantity: 3, unit: 'Box', rate: 333.33, taxPercent: 12 },
    { name: 'Gel pens (pack of 10)', hsn: '96081019', quantity: 7, unit: 'Pcs', rate: 41.15, taxPercent: 18 },
    { name: 'Stapler', hsn: '84729010', quantity: 1, unit: 'Nos', rate: 199.99, taxPercent: 18 },
  ];
  const bill = makeBill({ items });
  const { doc, errors } = buildEInvoice(bill);
  eq(errors, [], 'no problems');
  eq(doc.Version, '1.1', 'Version 1.1');
  eq(doc.TranDtls, { TaxSch: 'GST', SupTyp: 'B2B', RegRev: 'N', IgstOnIntra: 'N' }, 'TranDtls');
  eq(doc.DocDtls, { Typ: 'INV', No: 'KS/26-27/001', Dt: '05/10/2026' }, 'DocDtls with DD/MM/YYYY date');
  eq([doc.SellerDtls.Gstin, doc.SellerDtls.Pin, doc.SellerDtls.Stcd, doc.SellerDtls.Loc, doc.SellerDtls.Ph], ['29ABCDE1234F1ZW', 560001, '29', 'Bengaluru', '9845012345'], 'seller GSTIN, PIN (number), state code, place, phone');
  eq([doc.BuyerDtls.Pos, doc.BuyerDtls.Stcd, doc.BuyerDtls.Pin], ['29', '29', 560025], 'buyer place of supply, state, PIN');
  eq(doc.ItemList.map((i) => i.Unit), ['BOX', 'PCS', 'NOS'], 'units mapped to UQC codes');
  eq(doc.ItemList[0], { SlNo: '1', PrdDesc: 'A4 copier paper', IsServc: 'N', HsnCd: '48025690', Qty: 3, Unit: 'BOX', UnitPrice: 333.33, TotAmt: 999.99, Discount: 0, AssAmt: 999.99, GstRt: 12, IgstAmt: 0, CgstAmt: 60, SgstAmt: 60, CesRt: 0, CesAmt: 0, TotItemVal: 1119.99 }, 'item 1 in full');
  ok(doc.ItemList.every((i) => i.CgstAmt === i.SgstAmt || Math.abs(i.CgstAmt - i.SgstAmt) <= 0.01), 'CGST and SGST are halves of each line');
  reconcile(doc, bill, 'intra');
}

console.log('\n[#111] Inter-state invoice');
{
  const items = [{ name: 'Notebooks', hsn: '4820', quantity: 120, unit: 'Pcs', rate: 37.5, taxPercent: 12 }, { name: 'Courier', hsn: '996812', quantity: 1, unit: 'Nos', rate: 250, taxPercent: 18 }];
  const bill = makeBill({ items, client: MH_BUYER, details: { placeOfSupply: 'Maharashtra' } });
  const { doc } = buildEInvoice(bill);
  eq([doc.BuyerDtls.Pos, doc.ItemList[0].IgstAmt, doc.ItemList[0].CgstAmt, doc.ValDtls.IgstVal], ['27', 540, 0, 585], 'IGST only, place of supply 27');
  eq(doc.ItemList[1].IsServc, 'Y', 'SAC 99xxxx is a service');
  reconcile(doc, bill, 'inter');
}

console.log('\n[#111] Discounts (percent, fixed, per unit) and invoice discount, TCS, round off');
{
  const items = [
    { name: 'Drawing boards', hsn: '9017', quantity: 4, unit: 'Nos', rate: 1249.5, discount: 7.5, discountType: 'percent', taxPercent: 18 },
    { name: 'Marker set', hsn: '96082000', quantity: 9, unit: 'Set', rate: 87.65, discount: 23.4, taxPercent: 18 },
    { name: 'Files', hsn: '48203000', quantity: 25, unit: 'Pcs', rate: 18.9, discount: 1.1, discountBase: 'unit', taxPercent: 12 },
  ];
  const bill = makeBill({ items, opts: { showRoundOff: true, invoiceDiscountValue: 100, showTCS: true, tcsRate: 0.1, tcsSection: '206C(1)' } });
  const { doc, errors } = buildEInvoice(bill);
  eq(errors, [], 'no problems');
  eq(doc.ItemList[0].Discount, 374.85, '7.5% off 4 × 1249.50');
  eq(doc.ItemList[2].Discount, 27.5, '₹1.10 off each of 25');
  eq([doc.ValDtls.Discount, doc.ValDtls.OthChrg], [100, bill.data.totals.tcsAmount], 'invoice discount, and TCS as other charges');
  // The invoice prints CGST and SGST each as half the tax rounded, so with an
  // odd paisa of tax they add up to a paisa more than the tax in the total;
  // the round-off absorbs that paisa so the printed total still holds.
  ok(Math.abs(P(doc.ValDtls.RndOffAmt) - P(bill.data.totals.roundOff)) <= 1, 'round off within a paisa of the printed one');
  reconcile(doc, bill, 'discounts');
}

console.log('\n[#111] Cess');
{
  const items = [{ name: 'Aerated drinks', hsn: '22021010', quantity: 48, unit: 'Bottle', rate: 33.33, taxPercent: 28, cessPercent: 12 }];
  const bill = makeBill({ items, client: MH_BUYER });
  const { doc } = buildEInvoice(bill);
  eq([doc.ItemList[0].CesRt, doc.ItemList[0].CesAmt, doc.ItemList[0].Unit], [12, 191.98, 'BTL'], 'cess rate and amount per item');
  reconcile(doc, bill, 'cess');
}

console.log('\n[#111] Prices include tax');
{
  const items = [
    { name: 'School bag', hsn: '42029200', quantity: 3, unit: 'Nos', rate: 999, taxPercent: 18, discount: 50 },
    { name: 'Water bottle', hsn: '39241090', quantity: 5, unit: 'Nos', rate: 249, taxPercent: 18 },
    { name: 'Crayons', hsn: '96099010', quantity: 11, unit: 'Box', rate: 55, taxPercent: 12 },
  ];
  const bill = makeBill({ items, taxInclusive: true, opts: { showRoundOff: true } });
  const { doc } = buildEInvoice(bill);
  eq([doc.ItemList[1].UnitPrice, doc.ItemList[1].TotAmt, doc.ItemList[1].AssAmt], [211.017, 1055.08, 1055.08], 'price before tax: 249 / 1.18');
  eq(doc.ItemList[0].Discount, 42.37, '₹50 off an inclusive price is ₹42.37 before tax');
  reconcile(doc, bill, 'inclusive');
}

console.log('\n[#111] Credit note against a known invoice');
{
  const items = [{ name: 'Gel pens (pack of 10)', hsn: '96081019', quantity: 2, unit: 'Pcs', rate: 41.15, taxPercent: 18 }];
  const orig = makeBill({ items, no: 'KS/26-27/001', date: '2026-10-05' });
  const cn = makeBill({ items, no: 'CN/26-27/001', date: '2026-10-08', type: 'credit-note', details: { originalInvoiceRef: 'KS/26-27/001' } });
  const { doc } = buildEInvoice(cn, { bills: [orig, cn] });
  eq(doc.DocDtls.Typ, 'CRN', 'document type CRN');
  eq(doc.RefDtls, { PrecDocDtls: [{ InvNo: 'KS/26-27/001', InvDt: '05/10/2026' }] }, 'names the original invoice and its date');
  eq(buildEInvoice(cn, { bills: [] }).doc.RefDtls, undefined, 'no reference when the original is not in the app');
  reconcile(doc, cn, 'credit note');
}

console.log('\n[#111] Reverse charge, SEZ and export');
{
  const items = [{ name: 'Legal advice', hsn: '998213', quantity: 1, unit: 'Nos', rate: 25000.55, taxPercent: 18 }];
  const rcm = makeBill({ items, opts: { reverseCharge: true } });
  const { doc } = buildEInvoice(rcm);
  eq([doc.TranDtls.RegRev, doc.ValDtls.CgstVal, doc.ValDtls.SgstVal], ['Y', rcm.data.totals.rcmTaxCgst, rcm.data.totals.rcmTaxSgst], 'reverse charge: RegRev Y, the tax the buyer pays is reported');
  eq(P(doc.ValDtls.TotInvVal), P(doc.ValDtls.AssVal) + P(doc.ValDtls.CgstVal) + P(doc.ValDtls.SgstVal), 'reverse charge: total value includes that tax');

  const sezClient = { ...MH_BUYER, isSEZ: true };
  // v1.10.83 - the LUT tick zero-rates the invoice itself, so its lines carry no tax.
  const sez = buildEInvoice(makeBill({ items, client: sezClient, opts: { isLUT: true } }));
  eq([sez.errors, sez.doc.TranDtls.SupTyp, sez.doc.ValDtls.IgstVal, sez.doc.ItemList[0].GstRt], [[], 'SEZWOP', 0, 18], 'SEZ under LUT: SEZWOP, no IGST, the rate kept');
  // An older invoice that only says LUT in its terms but charged GST is still refused.
  const sezTerms = makeBill({ items, client: sezClient });
  const sezTermsDoc = buildEInvoice({ ...sezTerms, data: { ...sezTerms.data, customTerms: 'Supplied under LUT' } });
  eq(sezTermsDoc.errors, ['It charges GST, but it is marked as under LUT (without payment of tax), in the LUT tick or its terms. Tick LUT on the invoice, or take the LUT wording out of its terms.'], 'SEZ "under LUT" in the terms but charging GST is refused');
  const sezPaid = buildEInvoice(makeBill({ items, client: sezClient }));
  eq([sezPaid.doc.TranDtls.SupTyp, sezPaid.doc.ValDtls.IgstVal], ['SEZWP', 4500.1], 'SEZ with payment: SEZWP, IGST');

  const abroad = { name: 'Lanka Books Ltd', address: '22 Galle Road', city: 'Colombo', country: 'Sri Lanka' };
  const exp = makeBill({ items: [{ ...items[0], taxPercent: 0 }], client: abroad, opts: { isLUT: true } });
  const e = buildEInvoice(exp);
  eq([e.doc.TranDtls.SupTyp, e.doc.BuyerDtls.Gstin, e.doc.BuyerDtls.Pos, e.doc.BuyerDtls.Stcd, e.doc.BuyerDtls.Pin], ['EXPWOP', 'URP', '96', '96', 999999], 'export under LUT: EXPWOP, URP, 96, 999999');
}

console.log('\n[#111] Validation in plain English');
{
  const good = [{ name: 'Gel pens', hsn: '96081019', quantity: 1, unit: 'Pcs', rate: 100, taxPercent: 18 }];
  const errs = (bill, opts) => buildEInvoice(bill, opts).errors;
  eq(errs(makeBill({ items: good, client: { name: 'Walk-in customer', state: 'Karnataka' } })), ['The client has no GSTIN. E-invoices are only for sales to GST-registered businesses and exports; a sale to a consumer (B2C) needs none.'], 'B2C invoice is refused, with that one reason');
  eq(errs(makeBill({ items: [{ ...good[0], hsn: '' }] })), ['Item 1 (Gel pens): the HSN/SAC code is missing.'], 'missing HSN');
  eq(errs(makeBill({ items: [{ ...good[0], hsn: '96081' }] })), ['Item 1 (Gel pens): the HSN/SAC code "96081" must be 4, 6 or 8 digits.'], 'HSN of 5 digits');
  eq(errs(makeBill({ items: good, no: 'DICECODES/2026-27/00001' })), ['The invoice number "DICECODES/2026-27/00001" is longer than 16 characters. The portal takes 16 at most.'], 'invoice number over 16 characters');
  eq(errs(makeBill({ items: good, no: 'INV 7' })), ['The invoice number "INV 7" may only have letters, digits, / and -.'], 'space in invoice number');
  eq(errs(makeBill({ items: good, client: { ...KA_BUYER, pin: '', address: '4 Brigade Road' } })), ["The client's PIN code is missing."], 'buyer PIN missing');
  const noPin = makeBill({ items: good });
  noPin.data.profile = { ...SELLER, pin: '' };
  eq(errs(noPin), ['Your business PIN code is missing. Add it in Settings → Company Details.'], 'seller PIN missing');
  eq(errs(noPin, { profile: SELLER }), [], 'seller PIN filled from the live business profile');
  eq(errs(makeBill({ items: good, type: 'proforma' })), ['Only tax invoices and credit notes need an e-invoice. This is a proforma / estimate.'], 'proforma refused');
  eq(errs(makeBill({ items: good, status: 'cancelled' })), ['This invoice is cancelled.'], 'cancelled refused');
  eq(errs({ ...makeBill({ items: good }), einvoice: { irn: 'a'.repeat(64) } }), ['It already has an IRN, so it is not sent again.'], 'already has an IRN');
  eq(errs({ ...makeBill({ items: good }), currency: 'USD' }), ['The invoice is in USD. E-invoice amounts must be in rupees; enter this one on the portal by hand.'], 'foreign currency refused');
  const typo = KA_BUYER.gstin.slice(0, 14) + (KA_BUYER.gstin[14] === 'A' ? 'B' : 'A');
  eq(errs(makeBill({ items: good, client: { ...KA_BUYER, gstin: typo } })), [`The client's GSTIN ${typo} looks mistyped.`], 'mistyped client GSTIN');
  eq(errs(makeBill({ items: good, date: '2099-01-01' })), ['The invoice date is in the future.'], 'future date');
  const stale = makeBill({ items: good });
  stale.data.totals = { ...stale.data.totals, cgst: 10, sgst: 10 };
  eq(errs(stale), ['The totals saved with this invoice do not match its items. Open it, click Save, and export again.'], 'saved totals that disagree with the items');

  const { docs, problems } = prepareEInvoices([makeBill({ items: good }), makeBill({ items: [{ ...good[0], hsn: '' }], no: 'KS/26-27/002' })]);
  eq([docs.length, problems.length, problems[0].invoiceNumber], [1, 1, 'KS/26-27/002'], 'bulk: valid ones exported, the rest listed');
}

console.log('\n[#111] Bringing the IRN back');
{
  const b64url = (s) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const irnA = 'a1b2c3d4e5f6'.padEnd(64, '7');
  const irnB = 'b'.repeat(64);
  const qrFor = (irn, docNo, docDt) => `${b64url('{"alg":"RS256"}')}.${b64url(JSON.stringify({ data: JSON.stringify({ SellerGstin: '29ABCDE1234F1ZW', BuyerGstin: KA_BUYER.gstin, DocNo: docNo, DocTyp: 'INV', DocDt: docDt, TotInvVal: 1180, Irn: irn, IrnDt: '2026-10-05 11:05:00' }), iss: 'NIC' }))}.c2lnbmF0dXJl`;
  eq(decodeSignedQr(qrFor(irnA, 'KS/26-27/001', '05/10/2026')).DocNo, 'KS/26-27/001', 'Signed QR Code is read for the invoice it belongs to');

  const items = [{ name: 'Gel pens', hsn: '96081019', quantity: 1, unit: 'Pcs', rate: 100, taxPercent: 18 }];
  const b1 = makeBill({ items, no: 'KS/26-27/001', date: '2026-10-05' });
  const b2 = makeBill({ items, no: 'KS/26-27/002', date: '2026-10-06' });
  const other = { ...makeBill({ items, no: 'KS/26-27/001', date: '2026-10-05' }), id: 'x' };
  other.data = { ...other.data, profile: { ...SELLER, gstin: gstin('29AAAAA0000A1Z') } };
  const response = [
    { AckNo: 112610000123456, AckDt: '2026-10-05 11:05:00', Irn: irnA, SignedInvoice: 'x.y.z', SignedQRCode: qrFor(irnA, 'KS/26-27/001', '05/10/2026'), Status: 'ACT' },
    { 'Ack No': '112610000123457', 'Ack Date': '2026-10-06 10:00:00', IRN: irnB, 'Doc No': 'KS/26-27/002', 'Doc Date': '07/10/2026', 'Signed QR Code': qrFor(irnB, 'KS/26-27/002', '07/10/2026') },
    { Success: 'N', ErrorDetails: [{ ErrorCode: '2150', ErrorMessage: 'Duplicate IRN' }] },
  ];
  const entries = parseIrpResponse({ data: JSON.stringify(response) });
  eq(entries.length, 2, 'two IRNs found, the error row skipped, even when wrapped');
  eq([entries[0].docNo, entries[0].docDate, entries[0].sellerGstin, entries[0].ackNo], ['KS/26-27/001', '2026-10-05', '29ABCDE1234F1ZW', '112610000123456'], 'invoice number, date and GSTIN read from the QR code');
  const results = matchIrnEntries(entries, [b1, b2, other]);
  eq(results[0].bill === b1 && results[0].einvoice.irn, irnA, 'matched by number + date + seller GSTIN (another business with the same number is skipped)');
  eq(results[0].einvoice, { irn: irnA, ackNo: '112610000123456', ackDate: '2026-10-05 11:05:00', signedQr: entries[0].signedQr }, 'stored shape: irn, ackNo, ackDate, signedQr');
  eq(results[1].reason, 'No invoice KS/26-27/002 dated 07/10/2026 for this business was found.', 'wrong date is not matched');
  eq(matchIrnEntries(entries.slice(0, 1), [{ ...b1, einvoice: results[0].einvoice }])[0].reason, 'Already saved on this invoice.', 'importing twice changes nothing');
  eq(matchIrnEntries(entries.slice(0, 1), [{ ...b1, einvoice: { irn: irnB } }])[0].reason, 'This invoice already has a different IRN. It was not changed.', 'a different IRN is never overwritten');

  eq(einvoiceFromInput({ irn: 'abc', ackNo: '12', ackDate: '', signedQr: 'abc' }).errors, [
    'The IRN should be 64 letters and digits (0-9, a-f).', 'The Ack No should be a number of 10 to 20 digits.',
    'The Ack Date is missing.', 'The Signed QR Code is not complete. Copy all of it, from the first character to the last.',
  ], 'typed-in values are checked');
  eq(einvoiceFromInput({ irn: irnB, ackNo: '112610000123456', ackDate: 'x', signedQr: qrFor(irnA, 'A', '01/01/2026') }).errors, ['The Signed QR Code is for a different IRN.'], 'QR code of another invoice is refused');
  eq(einvoiceFromInput({ irn: ` ${irnA.toUpperCase()} `, ackNo: '1126 1000 0123 456', ackDate: '05/10/2026 11:05', signedQr: qrFor(irnA, 'A', '01/01/2026') }).errors, [], 'spaces and capitals in pasted values are fine');
}

// Pre-release review, 30 Oct: under a LUT "Prices include tax" takes no tax out,
// so the e-invoice must not either (it made Discount negative).
{
  const SEZ = { ...KA_BUYER, name: 'Lotus SEZ Unit', isSEZ: true };
  const items = [{ name: 'Consulting', hsn: '998311', quantity: 2, rate: 1180, taxPercent: 18, unit: 'Nos' }];
  const lut = makeBill({ client: SEZ, items, opts: { isLUT: true }, taxInclusive: true });
  const { doc } = buildEInvoice(lut, { profile: SELLER });
  eq([doc.TranDtls.SupTyp, doc.ItemList[0].UnitPrice, doc.ItemList[0].Discount, doc.ItemList[0].AssAmt], ['SEZWOP', 1180, 0, 2360],
    'LUT + prices include tax: price as typed, no negative discount');
}

console.log(`\n${passed} passed, ${failed} failed (today is ${localToday()})`);
if (failed) process.exit(1);

// v1.10.83 (#111) - e-invoicing (IRN) without going online.
//
// The app never talks to the IRP. It writes the e-invoice JSON (NIC schema
// version 1.1, the document the e-invoice portal's bulk upload takes), the user
// uploads it on einvoice1.gst.gov.in, and brings back the IRN, Ack No, Ack Date
// and Signed QR Code the portal gives. Those four values, printed with a QR
// code, are what make the printed invoice valid.
//
// Every amount comes from the invoice's own saved totals and the same per-line
// maths as the printed invoice (computeInvoiceTotals), so the JSON can never
// disagree with the paper copy. Pure functions only, so
// scripts/einvoice-test.mjs can test them without the React app.
import {
  computeInvoiceTotals, INVOICE_TYPES, getStateCode, getUnitUQC, gstinChecksumOk,
  GST_PORTAL_RATES, parseLocalDate, localToday, isCancelledBill,
} from '../utils.js';

// Only these two document types go to the IRP from this app.
export const EINVOICE_DOC_TYPES = { 'tax-invoice': 'INV', 'credit-note': 'CRN' };

// The IRP's unit (UQC) list. A unit outside it (hours, days, feet, custom
// units) is sent as OTH, as the portal asks.
const IRP_UQC = new Set('BAG BAL BDL BKL BOU BOX BTL BUN CAN CBM CCM CMS CTN DOZ DRM GGK GMS GRS GYD KGS KLR KME LTR MLT MTR MTS NOS OTH PAC PCS PRS QTL ROL SET SQF SQM SQY TBS TGM THD TON TUB UGS UNT YDS'.split(' '));

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const r3 = (n) => Math.round((Number(n) || 0) * 1000) / 1000;
const paise = (n) => Math.round((Number(n) || 0) * 100);
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const upper = (s) => clean(s).toUpperCase();
const sum = (arr, key) => arr.reduce((s, x) => s + (Number(x[key]) || 0), 0);

// The IRP writes dates as DD/MM/YYYY.
export const irpDate = (iso) => {
  if (!iso) return '';
  const d = parseLocalDate(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
// DD/MM/YYYY, DD-MM-YYYY or YYYY-MM-DD (with or without a time) -> YYYY-MM-DD.
const toIso = (value) => {
  const s = clean(value);
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(s);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
};

const pinOf = (o) => {
  const direct = String(o?.pin || o?.pincode || '').replace(/\D/g, '');
  if (direct.length === 6) return direct;
  const fromAddr = String(o?.address || '').match(/\b(\d{6})\b/);
  return fromAddr ? fromAddr[1] : '';
};
const validPin = (p) => /^[1-9]\d{5}$/.test(p);
// Optional contact fields go in only when the portal would take them.
const phoneOf = (s) => { const d = String(s || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); return d.length >= 6 && d.length <= 12 ? d : ''; };
const emailOf = (s) => { const e = clean(s); return e.length >= 6 && e.length <= 100 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : ''; };
// Address in two 100-character lines (Addr1 is required, Addr2 optional).
const addrLines = (s) => {
  const a = clean(String(s || '').replace(/\n/g, ', '));
  return { Addr1: a.slice(0, 100), ...(a.length > 100 ? { Addr2: a.slice(100, 200) } : {}) };
};

const billType = (bill) => bill?.invoiceType || bill?.data?.invoiceType || 'tax-invoice';
const sellerGstinOf = (bill) => upper(bill?.data?.profile?.gstin);
// Exports and zero-rated supplies under a Letter of Undertaking: the same rules
// the GSTR-1 export uses (GSTReturns.jsx), so both agree on every invoice.
// An invoice whose terms say LUT but which charges GST is refused below (its
// printed terms say "without payment"); the GSTR-1 file reports such an invoice
// as with payment, since the tax was charged (GSTReturns.jsx billIsLut).
const isLut = (data) => !!data?.invoiceOptions?.isLUT || /\bLUT\b|Letter of Undertaking/i.test(data?.customTerms || '');
const isExport = (data) => {
  const country = clean(data?.client?.country);
  return (data?.profile?.country || 'India') === 'India' && !!country && country !== 'India'
    && !getStateCode(clean(data?.details?.placeOfSupply)) && data?.totals?.isInterstate !== false;
};
export const einvoiceSupplyType = (data) => {
  if (isExport(data)) return isLut(data) ? 'EXPWOP' : 'EXPWP';
  if (data?.client?.isSEZ) return isLut(data) ? 'SEZWOP' : 'SEZWP';
  return 'B2B';
};

// Split each line's tax into CGST and SGST so the lines add up to exactly the
// CGST and SGST the invoice prints (and GSTR-1 reports). Each is half the
// line's tax; an odd paisa leaves half a paisa per line, given to the first
// odd lines until the printed total is reached.
const splitHalves = (taxPaise, targetPaise) => {
  let extra = targetPaise - taxPaise.reduce((s, p) => s + Math.floor(p / 2), 0);
  return taxPaise.map((p) => {
    const up = p % 2 && extra > 0 ? 1 : 0;
    extra -= up;
    return (Math.floor(p / 2) + up) / 100;
  });
};

// Build one invoice's e-invoice document and the list of problems that stop
// it. `opts.profile` is the live business profile: it fills seller fields the
// invoice's saved copy is missing (a PIN code added in Settings later).
// `opts.bills` lets a credit note name its original invoice and date.
// Returns { doc, errors }; doc is null when there are errors.
export const buildEInvoice = (bill, opts = {}) => {
  const errors = [];
  const data = bill?.data || {};
  const type = billType(bill);
  const typ = EINVOICE_DOC_TYPES[type];
  if (!typ) {
    return { doc: null, errors: [`Only tax invoices and credit notes need an e-invoice. This is a ${(INVOICE_TYPES[type]?.label || type).toLowerCase()}.`] };
  }
  if (isCancelledBill(bill)) errors.push('This invoice is cancelled.');
  if (bill.einvoice?.irn) errors.push('It already has an IRN, so it is not sent again.');

  const snap = data.profile || {};
  const live = opts.profile && upper(opts.profile.gstin) === upper(snap.gstin) ? opts.profile : {};
  const seller = { ...live, ...Object.fromEntries(Object.entries(snap).filter(([, v]) => v !== '' && v != null)) };
  const client = data.client || {};
  const details = data.details || {};
  const totals = data.totals || {};
  const currency = bill.currency || data.invoiceOptions?.currency || 'INR';
  const supTyp = einvoiceSupplyType(data);
  const exporting = supTyp.startsWith('EXP');
  // A sale to a consumer needs no e-invoice at all, so its other gaps
  // (no PIN code, no address) are not worth listing.
  if (!exporting && !upper(client.gstin)) {
    return { doc: null, errors: ['The client has no GSTIN. E-invoices are only for sales to GST-registered businesses and exports; a sale to a consumer (B2C) needs none.'] };
  }

  // ---- document ----
  const no = clean(bill.invoiceNumber || details.invoiceNumber);
  if (!no) errors.push('The invoice has no number.');
  else if (no.length > 16) errors.push(`The invoice number "${no}" is longer than 16 characters. The portal takes 16 at most.`);
  else if (!/^[A-Za-z0-9/-]+$/.test(no)) errors.push(`The invoice number "${no}" may only have letters, digits, / and -.`);
  else if (/^[0/-]/.test(no)) errors.push(`The invoice number "${no}" cannot start with 0, / or -.`);
  const isoDate = bill.invoiceDate || details.invoiceDate;
  const dt = irpDate(isoDate);
  if (!dt) errors.push('The invoice has no date.');
  else if (toIso(isoDate) > localToday()) errors.push('The invoice date is in the future.');
  if (currency !== 'INR') errors.push(`The invoice is in ${currency}. E-invoice amounts must be in rupees; enter this one on the portal by hand.`);
  if ((seller.country || 'India') !== 'India') errors.push('Your business is not in India.');

  // ---- seller ----
  const sGstin = upper(seller.gstin);
  if (!sGstin) errors.push('Your business GSTIN is missing. Add it in Settings → Company Details.');
  else if (!gstinChecksumOk(sGstin)) errors.push(`Your business GSTIN ${sGstin} looks mistyped. Check it in Settings → Company Details.`);
  const sName = clean(seller.legalName || seller.businessName);
  if (sName.length < 3) errors.push('Your business name is missing or shorter than 3 letters.');
  const sAddr = addrLines(seller.address);
  if (!sAddr.Addr1) errors.push('Your business address is missing. Add it in Settings → Company Details.');
  const sLoc = clean(seller.city || seller.state).slice(0, 50);
  if (sLoc.length < 3) errors.push('Your business city is missing. Add it in Settings → Company Details.');
  const sPin = pinOf(seller);
  if (!validPin(sPin)) errors.push('Your business PIN code is missing. Add it in Settings → Company Details.');
  const sStcd = getStateCode(sGstin) || getStateCode(clean(seller.state));
  if (!sStcd) errors.push('Your business state is missing. Add it in Settings → Company Details.');

  // ---- buyer ----
  const bGstin = exporting ? 'URP' : upper(client.gstin);
  const bName = clean(client.name);
  const bAddr = addrLines(client.address);
  const bLoc = clean(client.city || client.state || (exporting ? client.country : '')).slice(0, 50);
  const bPin = exporting ? '999999' : pinOf(client);
  const bStcd = exporting ? '96' : (getStateCode(bGstin) || getStateCode(clean(client.state)));
  const pos = exporting ? '96' : getStateCode(clean(details.placeOfSupply) || clean(client.state) || bGstin);
  if (!exporting) {
    if (!gstinChecksumOk(bGstin)) errors.push(`The client's GSTIN ${bGstin} looks mistyped.`);
    else if (bGstin === sGstin) errors.push('The client GSTIN is the same as your own.');
  }
  if (bName.length < 3) errors.push("The client's name is missing or shorter than 3 letters.");
  if (!bAddr.Addr1) errors.push("The client's address is missing.");
  if (bLoc.length < 3) errors.push("The client's city is missing.");
  if (!validPin(bPin)) errors.push("The client's PIN code is missing.");
  if (!bStcd) errors.push("The client's state is missing.");
  if (!pos) errors.push('The place of supply is missing.');

  // ---- items ----
  const showGST = typeof data.invoiceOptions?.showGST === 'boolean' ? data.invoiceOptions.showGST : !!INVOICE_TYPES[type]?.showGST;
  if (!showGST) errors.push('This invoice does not charge GST.');
  const taxInclusive = !!data.taxInclusive;
  const items = Array.isArray(data.items) ? data.items : [];
  // Lines only: the TCS / TDS / invoice-discount figures are read from the
  // saved totals below, as printed.
  const calc = computeInvoiceTotals({
    items, profile: seller, client, details, showGST, taxInclusive,
    invoiceOptions: { ...(data.invoiceOptions || {}), showTCS: false, showTDS: false },
  });
  const interstate = typeof totals.isInterstate === 'boolean' ? totals.isInterstate : calc.isInterstate;
  const rows = items.map((item, i) => ({ item, l: calc.lines[i] }))
    .filter(({ item, l }) => clean(item.name) || l.gross > 0);
  if (!rows.length) errors.push('The invoice has no items.');
  rows.forEach(({ item, l }, i) => {
    const label = `Item ${i + 1} (${clean(item.name) || 'no name'})`;
    const hsn = String(item.hsn || '').trim();
    if (!hsn || hsn === 'N/A') errors.push(`${label}: the HSN/SAC code is missing.`);
    else if (!/^(\d{4}|\d{6}|\d{8})$/.test(hsn)) errors.push(`${label}: the HSN/SAC code "${hsn}" must be 4, 6 or 8 digits.`);
    if (clean(item.name).length < 3) errors.push(`${label}: the description must be at least 3 characters.`);
    if (!GST_PORTAL_RATES.includes(l.taxPct)) errors.push(`${label}: ${l.taxPct}% is not a GST rate the portal accepts.`);
  });
  if (supTyp.endsWith('WOP') && rows.some(({ l }) => l.tax > 0)) {
    errors.push('It charges GST, but it is marked as under LUT (without payment of tax), in the LUT tick or its terms. Tick LUT on the invoice, or take the LUT wording out of its terms.');
  }

  // Header amounts exactly as printed. Under reverse charge the printed totals
  // leave the tax out (the buyer pays it), but the IRP still wants the tax
  // amounts, so the notional tax the invoice shows is reported.
  const rcm = !!data.invoiceOptions?.reverseCharge;
  const head = {
    cgst: rcm ? totals.rcmTaxCgst : totals.cgst,
    sgst: (Number(rcm ? totals.rcmTaxSgst : totals.sgst) || 0) + (Number(rcm ? totals.rcmTaxUtgst : totals.utgst) || 0),
    igst: rcm ? totals.rcmTaxIgst : totals.igst,
  };
  const taxPaise = rows.map(({ l }) => paise(l.tax));
  const cgsts = interstate ? taxPaise.map(() => 0) : splitHalves(taxPaise, paise(head.cgst));
  const sgsts = interstate ? taxPaise.map(() => 0) : splitHalves(taxPaise, paise(head.sgst));

  const ItemList = rows.map(({ item, l }, i) => {
    const hsn = String(item.hsn || '').trim();
    // With "Prices include tax" the rate holds the tax: the e-invoice wants
    // the price before tax, so it is backed out the way the totals do it.
    // Not under a LUT: no tax is taken out there (calc.taxInclusive is false).
    const div = calc.taxInclusive && l.taxPct > 0 ? 1 + l.taxPct / 100 : 1;
    const TotAmt = r2(l.gross / div);
    const AssAmt = r2(l.taxable);
    const IgstAmt = interstate ? r2(l.tax) : 0;
    const CgstAmt = cgsts[i];
    const SgstAmt = sgsts[i];
    const uqc = getUnitUQC(item.unit);
    return {
      SlNo: String(i + 1),
      PrdDesc: clean(item.name).slice(0, 300),
      IsServc: /^99/.test(hsn) ? 'Y' : 'N',
      HsnCd: hsn,
      Qty: r3(l.qty),
      Unit: IRP_UQC.has(uqc) ? uqc : 'OTH',
      UnitPrice: r3(l.rate / div),
      TotAmt,
      // Taken as the difference, so AssAmt = TotAmt - Discount to the paisa.
      Discount: r2(TotAmt - AssAmt),
      AssAmt,
      GstRt: l.taxPct,
      IgstAmt, CgstAmt, SgstAmt,
      CesRt: l.cessPct,
      CesAmt: r2(l.cess),
      TotItemVal: r2(AssAmt + IgstAmt + CgstAmt + SgstAmt + l.cess),
    };
  });

  const AssVal = r2(sum(ItemList, 'AssAmt'));
  const CgstVal = r2(sum(ItemList, 'CgstAmt'));
  const SgstVal = r2(sum(ItemList, 'SgstAmt'));
  const IgstVal = r2(sum(ItemList, 'IgstAmt'));
  const CesVal = r2(sum(ItemList, 'CesAmt'));
  const Discount = r2(totals.invoiceDiscountAmount);
  // TCS collected on the invoice goes in "other charges" (the schema has no TCS field).
  const OthChrg = r2(totals.tcsAmount);
  const before = r2(AssVal + CgstVal + SgstVal + IgstVal + CesVal + OthChrg - Discount);
  const TotInvVal = rcm ? before : r2(totals.total);
  const RndOffAmt = r2(TotInvVal - before);

  // The lines must add up to the totals saved with the invoice. They differ
  // only if the invoice was saved by an older version and never re-saved.
  if (rows.length && showGST && (
    paise(AssVal) !== paise(totals.taxableAmount)
    || paise(CgstVal) !== paise(interstate ? 0 : head.cgst)
    || paise(SgstVal) !== paise(interstate ? 0 : head.sgst)
    || paise(IgstVal) !== paise(interstate ? head.igst : 0)
    || paise(CesVal) !== paise(totals.cess)
    || Math.abs(RndOffAmt) >= 100)) {
    errors.push('The totals saved with this invoice do not match its items. Open it, click Save, and export again.');
  }

  if (errors.length) return { doc: null, errors };

  const doc = {
    Version: '1.1',
    TranDtls: {
      TaxSch: 'GST', SupTyp: supTyp, RegRev: rcm ? 'Y' : 'N',
      // IGST on a supply inside the state (only possible for B2B here).
      IgstOnIntra: supTyp === 'B2B' && interstate && pos === sStcd ? 'Y' : 'N',
    },
    DocDtls: { Typ: typ, No: no, Dt: dt },
    SellerDtls: {
      Gstin: sGstin, LglNm: sName.slice(0, 100),
      ...(clean(seller.businessName) && clean(seller.businessName) !== sName ? { TrdNm: clean(seller.businessName).slice(0, 100) } : {}),
      ...sAddr, Loc: sLoc, Pin: Number(sPin), Stcd: sStcd,
      ...(phoneOf(seller.phone) ? { Ph: phoneOf(seller.phone) } : {}),
      ...(emailOf(seller.email) ? { Em: emailOf(seller.email) } : {}),
    },
    BuyerDtls: {
      Gstin: bGstin, LglNm: bName.slice(0, 100), Pos: pos,
      ...bAddr, Loc: bLoc, Pin: Number(bPin), Stcd: bStcd,
      ...(phoneOf(client.phone) ? { Ph: phoneOf(client.phone) } : {}),
      ...(emailOf(client.email) ? { Em: emailOf(client.email) } : {}),
    },
    ItemList,
    ValDtls: { AssVal, CgstVal, SgstVal, IgstVal, CesVal, Discount, OthChrg, RndOffAmt, TotInvVal },
  };

  // A credit note names the invoice it corrects, when that invoice is in the app.
  const ref = upper(details.originalInvoiceRef);
  const orig = typ === 'CRN' && ref ? (opts.bills || []).find((b) => upper(b.invoiceNumber) === ref
    && billType(b) === 'tax-invoice' && sellerGstinOf(b) === sGstin) : null;
  if (orig && irpDate(orig.invoiceDate)) {
    doc.RefDtls = { PrecDocDtls: [{ InvNo: clean(orig.invoiceNumber), InvDt: irpDate(orig.invoiceDate) }] };
  }
  return { doc, errors: [] };
};

// The portal's bulk upload takes an array of invoices, even for one.
export const einvoiceFileName = (label) => `EINV-${String(label).replace(/[/\\]/g, '-')}.json`;
// Browser only: save the file.
export const downloadJson = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Several invoices at once: the valid ones go in the file, the rest are listed
// with their problems.
export const prepareEInvoices = (bills, opts = {}) => {
  const docs = [];
  const problems = [];
  for (const bill of bills || []) {
    const { doc, errors } = buildEInvoice(bill, opts);
    if (doc) docs.push(doc);
    else problems.push({ invoiceNumber: bill.invoiceNumber || bill.id, errors });
  }
  return { docs, problems };
};

// ------------------------------------------------------------ IRN back in --

// The Signed QR Code is a signed token (JWT). Its middle part carries the
// invoice it belongs to: SellerGstin, DocNo, DocTyp, DocDt, Irn and more.
export const decodeSignedQr = (token) => {
  try {
    const part = String(token || '').trim().split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const payload = JSON.parse(atob(b64));
    const inner = typeof payload.data === 'string' ? JSON.parse(payload.data) : (payload.data || payload);
    return inner && typeof inner === 'object' ? inner : null;
  } catch {
    return null;
  }
};

// Check the four values (typed in, or read from the portal's file) and
// return the record stored on the bill as bill.einvoice.
export const einvoiceFromInput = (input = {}) => {
  const errors = [];
  const irn = clean(input.irn).toLowerCase();
  const ackNo = clean(input.ackNo).replace(/\s/g, '');
  const ackDate = clean(input.ackDate);
  const signedQr = String(input.signedQr || '').replace(/\s/g, '');
  if (!/^[0-9a-f]{64}$/.test(irn)) errors.push('The IRN should be 64 letters and digits (0-9, a-f).');
  if (!/^\d{10,20}$/.test(ackNo)) errors.push('The Ack No should be a number of 10 to 20 digits.');
  if (!ackDate) errors.push('The Ack Date is missing.');
  const qr = decodeSignedQr(signedQr);
  if (!signedQr) errors.push('The Signed QR Code is missing.');
  else if (signedQr.split('.').length !== 3) errors.push('The Signed QR Code is not complete. Copy all of it, from the first character to the last.');
  else if (qr?.Irn && String(qr.Irn).toLowerCase() !== irn) errors.push('The Signed QR Code is for a different IRN.');
  if (errors.length) return { einvoice: null, errors };
  return { einvoice: { irn, ackNo, ackDate, signedQr }, errors: [] };
};

// Keys are compared without case, spaces or punctuation, so "Ack No",
// "AckNo" and "ACK_NO" all match.
const norm = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
const field = (o, names) => {
  const want = names.map(norm);
  for (const [k, v] of Object.entries(o || {})) {
    if (want.includes(norm(k)) && v != null && v !== '' && typeof v !== 'object') return String(v);
  }
  return '';
};
const nested = (o, parentNames, names) => {
  const want = parentNames.map(norm);
  for (const [k, v] of Object.entries(o || {})) {
    if (want.includes(norm(k)) && v && typeof v === 'object') return field(v, names);
  }
  return '';
};

// Read the portal's response file. Accepts a single response, an array of
// them, or either wrapped in other objects (some tools nest it, or put the
// response JSON in a string). Every object with an IRN is one entry.
export const parseIrpResponse = (json) => {
  const out = [];
  const walk = (node, depth) => {
    if (depth > 6 || node == null) return;
    if (typeof node === 'string') {
      const s = node.trim();
      if (s.startsWith('{') || s.startsWith('[')) { try { walk(JSON.parse(s), depth + 1); } catch { /* not JSON */ } }
      return;
    }
    if (Array.isArray(node)) { node.forEach((n) => walk(n, depth + 1)); return; }
    if (typeof node !== 'object') return;
    const irn = field(node, ['Irn']);
    if (!irn) { Object.values(node).forEach((v) => walk(v, depth + 1)); return; }
    const signedQr = field(node, ['SignedQRCode', 'SignedQrCode', 'Signed QR Code', 'QRCode']);
    const qr = decodeSignedQr(signedQr) || {};
    out.push({
      irn,
      ackNo: field(node, ['AckNo', 'AckNum', 'Ack Number', 'Acknowledgement Number']),
      ackDate: field(node, ['AckDt', 'AckDate', 'Acknowledgement Date']),
      signedQr,
      docNo: field(node, ['DocNo', 'Document Number', 'DocumentNo', 'InvNo', 'Invoice Number']) || nested(node, ['DocDtls'], ['No']) || clean(qr.DocNo),
      docDate: toIso(field(node, ['DocDt', 'Document Date', 'DocDate', 'InvDt', 'Invoice Date']) || nested(node, ['DocDtls'], ['Dt']) || qr.DocDt),
      docType: upper(field(node, ['DocTyp', 'DocType', 'Document Type']) || nested(node, ['DocDtls'], ['Typ']) || qr.DocTyp),
      sellerGstin: upper(field(node, ['SellerGstin', 'Seller GSTIN', 'SupplierGstin']) || nested(node, ['SellerDtls'], ['Gstin']) || qr.SellerGstin),
    });
  };
  walk(json, 0);
  return out;
};

// Find the invoice each IRN belongs to: same invoice number, same date and
// same seller GSTIN when the file names them. Each result has `einvoice` to
// store, or `reason` (plain English) why nothing is changed.
export const matchIrnEntries = (entries, bills) => (entries || []).map((entry) => {
  const { einvoice, errors } = einvoiceFromInput(entry);
  if (!einvoice) return { entry, reason: errors.join(' ') };
  if (!entry.docNo) return { entry, reason: 'The file does not say which invoice this IRN is for. Paste it into the invoice by hand.' };
  const found = (bills || []).filter((b) => EINVOICE_DOC_TYPES[billType(b)]
    && upper(b.invoiceNumber) === upper(entry.docNo)
    && (!entry.docDate || toIso(b.invoiceDate) === entry.docDate)
    && (!entry.docType || EINVOICE_DOC_TYPES[billType(b)] === entry.docType)
    && (!entry.sellerGstin || sellerGstinOf(b) === entry.sellerGstin));
  const when = entry.docDate ? ` dated ${irpDate(entry.docDate)}` : '';
  if (!found.length) return { entry, reason: `No invoice ${entry.docNo}${when} for this business was found.` };
  if (found.length > 1) return { entry, reason: `More than one invoice ${entry.docNo}${when} was found. Paste the IRN into the right one by hand.` };
  const bill = found[0];
  if (bill.einvoice?.irn === einvoice.irn) return { entry, bill, reason: 'Already saved on this invoice.' };
  if (bill.einvoice?.irn) return { entry, bill, reason: 'This invoice already has a different IRN. It was not changed.' };
  return { entry, bill, einvoice };
});

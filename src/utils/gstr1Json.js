// v1.10.83 (#133) - the parts of the GSTR-1 JSON the GST portal is strict
// about. Reported: "File could not be uploaded! Download the latest version of
// Offline tool..." for an August 2026 file. From the May 2025 return the HSN
// summary (Table 12) must come in two lists, B2B and B2C; we still sent one.
// Checked against India Compliance (resilient-tech/india-compliance), whose
// GSTR-1 JSON the portal accepts: hsn_b2b / hsn_b2c from 2025-05-01, registered
// and SEZ buyers in B2B, unregistered and overseas in B2C, descriptions cut to
// 30 characters, blanks removed before the file is written.

export const HSN_DESC_MAX = 30;

// fp is the return period, MMYYYY.
export const hsnSplitFrom = (fp) => {
  const m = Number(String(fp).slice(0, 2));
  const y = Number(String(fp).slice(2));
  return y * 100 + m >= 202505;
};

// rows: [{ b2b: true|false, hsn_sc, desc, uqc, qty, rt, txval, iamt, camt, samt, csamt }]
// Each list is numbered from 1.
export function hsnTable(rows, fp) {
  const clean = (r, i) => {
    const { b2b, ...row } = r; // eslint-disable-line no-unused-vars
    return { num: i + 1, ...row, desc: String(row.desc || '').trim().slice(0, HSN_DESC_MAX).trim() };
  };
  if (!hsnSplitFrom(fp)) return { data: rows.map(clean) };
  return {
    hsn_b2b: rows.filter((r) => r.b2b).map(clean),
    hsn_b2c: rows.filter((r) => !r.b2b).map(clean),
  };
}

// The portal rejects blank values: drop '', null, undefined, empty lists and
// empty objects, at every level. 0 stays.
export function stripEmpty(value) {
  if (Array.isArray(value)) {
    const list = value.map(stripEmpty).filter((v) => v !== undefined);
    return list.length ? list : undefined;
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const s = stripEmpty(v);
      if (s !== undefined) out[k] = s;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return value === '' || value === null || value === undefined ? undefined : value;
}

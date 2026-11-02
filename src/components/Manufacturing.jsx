// v1.10.83 (#115) - simple manufacturing on the Products screen, shown only
// when Settings -> Features -> "Manufacturing (bill of materials)" is on:
//   BomEditor      - "Made here" + raw materials list inside the product form
//   MakeModal      - record production ("Make"): uses up raw materials,
//                    adds the finished product
//   ProductionList - this business's production entries: view, delete
// The arithmetic is in utils/manufacturing.js (unit-tested); the server moves
// the stock in the same request that saves or deletes an entry.
import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Save, Eye, Factory } from 'lucide-react';
import { getAllProductions, saveProduction, deleteProduction, getProfile } from '../store';
import { formatCurrency, formatDateGST, localToday, belongsToProfile, isServiceProduct } from '../utils';
import { unitCost, materialsNeeded, buildProduction, shortages } from '../utils/manufacturing';
import { toast } from './Toast';
import { confirmAction } from './ConfirmModal';
import TableExport from './TableExport';
import HelpButton from './HelpButton';

const num = { textAlign: 'right', whiteSpace: 'nowrap' };
const muted = { fontSize: '0.78rem', color: 'var(--text-muted)' };
const qtyText = (q, unit) => `${q} ${unit || 'Nos'}`;

// ---- Bill of materials, inside the Add / Edit Product form ----
export function BomEditor({ productId, madeHere, bom, products, currency, onChange }) {
  const others = products.filter((p) => p.id !== productId && !isServiceProduct(p)); // a service has no stock (#121)
  const setLine = (i, patch) => onChange({ madeHere, bom: bom.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  const cost = unitCost({ id: productId || '_new', madeHere: true, bom }, products);
  return (
    <div className="form-group" style={{ gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          <input type="checkbox" checked={madeHere} style={{ width: 15, height: 15, accentColor: 'var(--primary)' }}
            onChange={(e) => onChange({ madeHere: e.target.checked, bom: bom.length ? bom : [{ productId: '', qty: '' }] })} />
          Made here (from raw materials)
        </label>
        <HelpButton title="Bill of materials" doc="products#bill-of-materials" size={16} />
      </div>
      {madeHere && (
        <div className="surface-card" style={{ marginTop: '0.5rem' }}>
          <div style={{ ...muted, marginBottom: '0.5rem' }}>Raw materials used to make 1 unit of this product</div>
          {bom.map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', alignItems: 'center' }}>
              <select className="form-input" style={{ flex: 2, minWidth: 0 }} value={line.productId} aria-label={`Raw material ${i + 1}`}
                onChange={(e) => setLine(i, { productId: e.target.value })}>
                <option value="">Choose a product…</option>
                {others.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" className="form-input" style={{ flex: 1, minWidth: 0 }} min="0" step="any" placeholder="Qty"
                aria-label={`Quantity per unit ${i + 1}`} value={line.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
              <span style={{ ...muted, width: '2.6rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{products.find((p) => p.id === line.productId)?.unit || ''}</span>
              <button type="button" className="icon-btn icon-btn-red" title="Remove this material" aria-label="Remove this material"
                onClick={() => onChange({ madeHere, bom: bom.filter((_, j) => j !== i) })}><X size={14} /></button>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
              onClick={() => onChange({ madeHere, bom: [...bom, { productId: '', qty: '' }] })}>
              <Plus size={14} /> Add material
            </button>
            <span style={{ fontSize: '0.82rem' }} title="Raw materials' purchase prices x quantity per unit">
              Cost per unit: <strong>{formatCurrency(cost, currency)}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- "Make": record production ----
export function MakeModal({ products, currency, onClose, onSaved }) {
  const madeHere = products.filter((p) => p.madeHere && p.bom?.length);
  const [productId, setProductId] = useState(madeHere[0]?.id || '');
  const [qty, setQty] = useState('');
  const [date, setDate] = useState(localToday());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const product = products.find((p) => p.id === productId);
  const made = Number(qty) > 0 ? Number(qty) : 0;
  const rows = product ? materialsNeeded(product, made, products) : [];
  const short = shortages(rows);
  const finishedBefore = Number(product?.stock) || 0;

  const save = async () => {
    const owner = await getProfile().catch(() => null);
    const { entry, error } = buildProduction({ product, qty, date, note, products, owner });
    if (error) { toast(error, 'warning'); return; }
    if (short.length && !(await confirmAction({
      title: 'Not enough raw materials in stock',
      message: `${short.map((m) => `${m.name}: needs ${qtyText(m.qtyUsed, m.unit)}, in stock ${qtyText(m.stockBefore, m.unit)}`).join('; ')}. `
        + 'Saving will take their stock below zero. Save anyway? (Fine if you are recording production late and the purchase bill is not entered yet.)',
      confirmLabel: 'Save anyway',
      tone: 'danger',
    }))) return;
    setSaving(true);
    try {
      await saveProduction(entry);
      toast(`Production saved: ${qtyText(entry.qty, entry.unit)} of ${entry.productName}`, 'success');
      onSaved();
    } catch (err) {
      toast(`Could not save production, nothing was changed. ${err.message || ''}`, 'error');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <h3 className="section-title"><Factory size={18} style={{ verticalAlign: '-3px' }} /> Make (record production) <HelpButton title="Make: record what you made" doc="products#make-production" size={16} style={{ marginLeft: 6 }} /></h3>
        {madeHere.length === 0 ? (
          <div className="notice notice-note">No product has a raw materials list yet. Edit a product, tick <strong>Made here</strong> and add its raw materials first.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label" htmlFor="mfg-product">Product made *</label>
                <select id="mfg-product" className="form-input" value={productId} onChange={(e) => setProductId(e.target.value)}>
                  {madeHere.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="mfg-qty">Quantity made *</label>
                <input id="mfg-qty" type="number" className="form-input" min="0" step="any" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="mfg-date">Date *</label>
                <input id="mfg-date" type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="mfg-note">Note (optional)</label>
                <input id="mfg-note" type="text" className="form-input" placeholder="e.g. Batch 12" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
            <div className="table-scroll" style={{ marginTop: '0.75rem' }}>
              <table className="data-table" style={{ minWidth: 520 }}>
                <thead>
                  <tr><th>Raw material</th><th style={num}>Per unit</th><th style={num}>Will use</th><th style={num}>In stock</th><th style={num}>Left after</th></tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr key={m.productId}>
                      <td>{m.name}</td>
                      <td style={num}>{qtyText(m.qtyPerUnit, m.unit)}</td>
                      <td style={num}>{qtyText(m.qtyUsed, m.unit)}</td>
                      <td style={num}>{m.stockBefore}</td>
                      <td style={{ ...num, color: m.stockAfter < 0 ? 'var(--danger)' : undefined, fontWeight: m.stockAfter < 0 ? 700 : undefined }}>{m.stockAfter}</td>
                    </tr>
                  ))}
                  {product && (
                    <tr style={{ fontWeight: 600, background: 'var(--bg-secondary)' }}>
                      <td>{product.name} (made)</td>
                      <td style={num}></td>
                      <td style={num}>+{qtyText(made, product.unit)}</td>
                      <td style={num}>{finishedBefore}</td>
                      <td style={num}>{Math.round((finishedBefore + made) * 1000) / 1000}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p style={{ ...muted, margin: '0.5rem 0' }}>
              Cost of materials: <strong>{formatCurrency(rows.reduce((s, m) => s + m.cost, 0), currency)}</strong>
              {' '}({formatCurrency(unitCost(product, products), currency)} per unit, at current purchase prices)
            </p>
            {short.length > 0 && made > 0 && (
              <div className="notice notice-danger" role="alert">
                <span>Not enough stock of <strong>{short.map((m) => m.name).join(', ')}</strong>. Saving will take it below zero; you will be asked to confirm.</span>
              </div>
            )}
          </>
        )}
        <div className="flex gap-2 justify-end mt-4">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {madeHere.length > 0 && (
            <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={16} /> Save production</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Production list (open business only) ----
export function ProductionList({ products, currency, reloadKey, onChanged }) {
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    Promise.all([getAllProductions(), getProfile().catch(() => null)])
      .then(([list, prof]) => setRows((list || []).filter((r) => belongsToProfile(r, prof))))
      .catch(() => toast('Failed to load production entries', 'error'));
  }, [reloadKey]);

  const nameOf = (id) => products.find((p) => p.id === id)?.name || '(deleted product)';
  const shown = rows.filter((r) => (!from || r.date >= from) && (!to || r.date <= to));

  const remove = async (entry) => {
    const back = Object.entries(entry.stockApplied || {})
      .map(([id, change]) => `${nameOf(id)} ${change > 0 ? '-' : '+'}${Math.abs(change)}`).join(', ');
    if (!(await confirmAction({
      title: 'Delete this production entry?',
      message: `Stock goes back exactly as it was before it: ${back}. To change an entry, delete it and enter it again.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    }))) return;
    try {
      await deleteProduction(entry.id);
      toast('Production entry deleted, stock put back', 'success');
      setViewing(null);
      onChanged();
    } catch (err) {
      toast(`Could not delete, nothing was changed. ${err.message || ''}`, 'error');
    }
  };

  return (
    <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
      <div className="table-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3>Production <HelpButton title="The production list" doc="products#production-list" size={16} style={{ marginLeft: 6 }} /></h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={muted} htmlFor="mfg-from">From</label>
          <input id="mfg-from" type="date" className="form-input" style={{ width: 'auto' }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <label style={muted} htmlFor="mfg-to">To</label>
          <input id="mfg-to" type="date" className="form-input" style={{ width: 'auto' }} value={to} onChange={(e) => setTo(e.target.value)} />
          <TableExport title="Production" filename="Production"
            headers={['Date', 'Product', 'Qty made', 'Unit', 'Cost of materials', 'Note']}
            rows={shown.map((r) => [r.date, r.productName, r.qty, r.unit, r.cost, r.note || ''])} />
        </div>
      </div>
      {shown.length === 0 ? (
        <p style={{ ...muted, padding: '1rem 1.25rem', margin: 0 }}>
          {rows.length ? 'No production entries in these dates.' : 'No production entries yet. Use Make to record what you made.'}
        </p>
      ) : (
        <div className="table-scroll">
          <table className="data-table" style={{ minWidth: 560 }}>
            <thead>
              <tr><th>Date</th><th>Product</th><th style={num}>Qty made</th><th style={num}>Cost of materials</th><th>Note</th><th className="col-center">Actions</th></tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateGST(r.date)}</td>
                  <td className="font-medium">{r.productName}</td>
                  <td style={num}>{qtyText(r.qty, r.unit)}</td>
                  <td style={num}>{formatCurrency(r.cost || 0, currency)}</td>
                  <td className="text-muted">{r.note || '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-btn icon-btn-blue" onClick={() => setViewing(r)} title="View" aria-label="View"><Eye size={15} /></button>
                      <button className="icon-btn icon-btn-red" onClick={() => remove(r)} title="Delete" aria-label="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <h3 className="section-title">Made {qtyText(viewing.qty, viewing.unit)} of {viewing.productName} <HelpButton title="Viewing a production entry" doc="products#production-entry" size={16} /></h3>
            <p style={muted}>{formatDateGST(viewing.date)}{viewing.note ? ` · ${viewing.note}` : ''}</p>
            <div className="table-scroll">
              <table className="data-table" style={{ minWidth: 460 }}>
                <thead><tr><th>Raw material used</th><th style={num}>Qty</th><th style={num}>Rate</th><th style={num}>Cost</th></tr></thead>
                <tbody>
                  {(viewing.materials || []).map((m) => (
                    <tr key={m.productId}>
                      <td>{m.name}</td>
                      <td style={num}>{qtyText(m.qtyUsed, m.unit)}</td>
                      <td style={num}>{formatCurrency(m.rate || 0, currency)}</td>
                      <td style={num}>{formatCurrency(m.cost || 0, currency)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700, background: 'var(--bg-secondary)' }}>
                    <td colSpan={3}>Total cost of materials</td>
                    <td style={num}>{formatCurrency(viewing.cost || 0, currency)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={muted}>Rates are the purchase prices on the day it was saved. To change this entry, delete it and enter it again.</p>
            <div className="flex gap-2 justify-end mt-4">
              <button className="btn btn-secondary" onClick={() => remove(viewing)}><Trash2 size={15} /> Delete</button>
              <button className="btn btn-primary" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

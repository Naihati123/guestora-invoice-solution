// v1.10.83 (#111) - e-invoicing screens: the per-invoice panel in the editor
// (download the JSON, paste the IRN back) and the list of problems / import
// results shown after a bulk export or an IRN import on the Dashboard.
import { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { buildEInvoice, einvoiceFromInput, downloadJson, einvoiceFileName } from '../utils/einvoice';
import HelpButton from './HelpButton';

const EINVOICE_PORTAL = 'https://einvoice1.gst.gov.in';

// rows: [{ invoiceNumber, errors: [] }]
export function EInvoiceReport({ title, intro, rows, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <h3 className="section-title" style={{ marginTop: 0 }}>{title} <HelpButton title="E-invoice results" doc="gst-returns#e-invoice-report" size={16} style={{ marginLeft: 6 }} /></h3>
        {intro && <p style={{ fontSize: '0.85rem', marginTop: 0 }}>{intro}</p>}
        <ul style={{ paddingLeft: '1.1rem', fontSize: '0.84rem', lineHeight: 1.5 }}>
          {rows.map((r, i) => (
            <li key={`${r.invoiceNumber}-${i}`} style={{ marginBottom: '0.5rem' }}>
              <strong>{r.invoiceNumber}</strong>
              <ul style={{ paddingLeft: '1rem', margin: '0.15rem 0 0' }}>
                {r.errors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}

// bill: the invoice as it is on screen; saved: it has been saved under its
// final number; onSaveIrn(einvoice | null) stores or removes the IRN.
export function EInvoiceEditorModal({ bill, profile, bills, saved, onSaveIrn, onClose }) {
  const current = bill.einvoice || {};
  const [form, setForm] = useState({ irn: current.irn || '', ackNo: current.ackNo || '', ackDate: current.ackDate || '', signedQr: current.signedQr || '' });
  const [formErrors, setFormErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const { doc, errors } = buildEInvoice(bill, { profile, bills });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (value) => {
    setBusy(true);
    try { if (await onSaveIrn(value)) onClose(); } finally { setBusy(false); }
  };
  const submit = () => {
    const { einvoice, errors: errs } = einvoiceFromInput(form);
    setFormErrors(errs);
    if (einvoice) save(einvoice);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="E-invoice" style={{ maxWidth: 620 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="section-title" style={{ margin: 0 }}>E-invoice (IRN) <HelpButton title="E-invoice (IRN) window" doc="gst-returns#e-invoice-dialog" size={16} style={{ marginLeft: 6 }} /></h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <ol style={{ paddingLeft: '1.2rem', fontSize: '0.84rem', lineHeight: 1.55 }}>
          <li>Download the e-invoice JSON.</li>
          <li>Upload it on <a href={EINVOICE_PORTAL} target="_blank" rel="noreferrer">einvoice1.gst.gov.in</a> (e-Invoice → Bulk Upload).</li>
          <li>Paste the IRN, Ack No, Ack Date and Signed QR Code the portal gives back, and click <strong>Save IRN</strong>. They then print on the invoice with a QR code.</li>
        </ol>

        {!saved ? (
          <div className="notice notice-warn" style={{ fontSize: '0.84rem' }}>Save the invoice first, so its number is final.</div>
        ) : current.irn ? (
          <div className="notice notice-info" style={{ fontSize: '0.84rem' }}>This invoice has its IRN. It prints at the top of the invoice with the QR code.</div>
        ) : errors.length > 0 ? (
          <div className="notice notice-danger" style={{ fontSize: '0.84rem', display: 'block' }}>
            <strong>Fix these first:</strong>
            <ul style={{ paddingLeft: '1.1rem', margin: '0.3rem 0 0' }}>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        ) : null}
        <button type="button" className="btn btn-secondary" disabled={!saved || !doc}
          onClick={() => downloadJson(einvoiceFileName(bill.invoiceNumber), [doc])}
          style={{ margin: '0.75rem 0 1rem' }}>
          <FileText size={16} /> Download e-invoice JSON
        </button>

        <div style={{ display: 'grid', gap: '0.6rem' }}>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">IRN</span>
            <input className="form-input" value={form.irn} onChange={set('irn')} placeholder="64 letters and digits" spellCheck={false} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <label className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Ack No</span>
              <input className="form-input" value={form.ackNo} onChange={set('ackNo')} inputMode="numeric" />
            </label>
            <label className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Ack Date</span>
              <input className="form-input" value={form.ackDate} onChange={set('ackDate')} placeholder="as the portal shows it" />
            </label>
          </div>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Signed QR Code</span>
            <textarea className="form-input" rows={4} value={form.signedQr} onChange={set('signedQr')} spellCheck={false}
              placeholder="The long text that starts with eyJ" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
          </label>
        </div>
        {formErrors.length > 0 && (
          <ul className="notice notice-danger" style={{ fontSize: '0.84rem', display: 'block', paddingLeft: '1.8rem', marginTop: '0.75rem' }}>
            {formErrors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem', flexWrap: 'wrap' }}>
          {current.irn && (
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => save(null)}
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)', marginRight: 'auto' }}>Remove IRN</button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" disabled={!saved || busy} onClick={submit}>Save IRN</button>
        </div>
      </div>
    </div>
  );
}

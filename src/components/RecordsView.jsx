// v1.10.85 - Records: old bills, quotations, challans and work orders kept
// with a few details and their files, listed next to the documents made in
// the app, so old and new are found in one place. The Work orders tab shows
// each work order with everything made against it and what is left to bill.
// Asked for: "store/manage my old bills, quotations, delivery challan, work
// orders ... at least with few metadata, not the complete content".
// Records never reach reports or GST returns. The logic is src/utils/records.js.
import { useEffect, useMemo, useState } from 'react';
import { Archive, Plus, Search, X, Paperclip, Edit3, Trash2, ExternalLink, ClipboardList, Eye, Save, Upload, FileText } from 'lucide-react';
import { getAllRecords, saveRecord, deleteRecord, uploadRecordFile, discardRecordFile, recordFileUrl, getAllBills, getAllClients, getProfile } from '../store';
import { formatCurrency, belongsToProfile, parseLocalDate, localToday, getFYOptions } from '../utils';
import {
  RECORD_KINDS, RECORD_FILE_EXTS, RECORD_FILE_LIMIT_MB, cleanRecord, recordProblem, documentRows, workOrderSummary,
  workOrderKey, financialYearOf, recordsCsvToList, RECORDS_SAMPLE,
} from '../utils/records';
import CsvListImport from './CsvListImport';
import ActionsMenu from './ActionsMenu';
import { toast } from './Toast';
import { confirmAction } from './ConfirmModal';

const showDate = (d) => (d ? parseLocalDate(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
const money = (n) => (n === null || n === undefined || n === '' ? '-' : formatCurrency(n));
const sizeText = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const openFile = (f) => window.open(recordFileUrl(f), '_blank', 'noopener');
const PAGE = 200;

const SOURCE_BADGE = {
  old: { label: 'Old record', bg: 'rgba(100, 116, 139, 0.16)', color: '#64748b' },
  app: { label: 'Made here', bg: 'rgba(37, 99, 235, 0.14)', color: '#3b82f6' },
};

// withSource: "Old record" / "Made here" under the type, so the list needs no
// column of its own for it and fits a laptop screen.
function TypeCell({ r, withSource = false }) {
  return (
    <>
      <span className="type-badge">{r.typeLabel}</span>
      {r.cancelled && <span className="type-badge" style={{ marginLeft: 4, background: 'rgba(220, 38, 38, 0.12)', color: '#dc2626' }}>Cancelled</span>}
      {withSource && <div style={{ fontSize: '0.7rem', fontWeight: 600, marginTop: 3, color: SOURCE_BADGE[r.source].color }}>{SOURCE_BADGE[r.source].label}</div>}
    </>
  );
}
const SourceCell = ({ r }) => <span className="type-badge" style={{ background: SOURCE_BADGE[r.source].bg, color: SOURCE_BADGE[r.source].color }}>{SOURCE_BADGE[r.source].label}</span>;

// The files of a row: one opens straight away, more open from a menu.
function FilesCell({ files }) {
  if (!files.length) return <span className="text-muted">-</span>;
  if (files.length === 1) {
    return (
      <button className="icon-btn icon-btn-blue" onClick={() => openFile(files[0])} title={`Open ${files[0].originalName}`} aria-label={`Open ${files[0].originalName}`}>
        <Paperclip size={15} />
      </button>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <Paperclip size={14} className="text-muted" /><span style={{ fontSize: '0.8rem' }}>{files.length}</span>
      <ActionsMenu label="Open a file" items={files.map((f) => ({ label: f.originalName, icon: ExternalLink, onClick: () => openFile(f) }))} />
    </span>
  );
}

const blankForm = (over = {}) => ({ kind: 'invoice', number: '', date: localToday(), party: '', amount: '', workOrderNo: '', notes: '', files: [], ...over });

export default function RecordsView({ onOpenBill }) {
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [bills, setBills] = useState([]);
  const [clients, setClients] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('docs');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [source, setSource] = useState('');
  const [fy, setFy] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [form, setForm] = useState(null); // the record being added or edited
  const [uploadedNow, setUploadedNow] = useState([]); // file names uploaded while this form is open
  const [busy, setBusy] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [woOpen, setWoOpen] = useState(null); // work order key

  const load = async () => {
    const [prof, recs, bs, cl] = await Promise.all([
      getProfile().catch(() => null), getAllRecords().catch(() => []), getAllBills().catch(() => []), getAllClients().catch(() => []),
    ]);
    setProfile(prof);
    setRecords((recs || []).filter((r) => belongsToProfile(r, prof)));
    setBills((bs || []).filter((b) => belongsToProfile(b, prof)));
    setClients(cl || []);
    setLoaded(true);
  };
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => documentRows(records, bills), [records, bills]);
  const orders = useMemo(() => workOrderSummary(rows), [rows]);
  const fyOptions = useMemo(() => getFYOptions(10), []);

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) => (!kind || r.kind === kind) && (!source || r.source === source)
    && (!fy || financialYearOf(r.date) === fy)
    && (!q || [r.number, r.party, r.workOrderNo, r.notes, r.typeLabel].some((v) => String(v || '').toLowerCase().includes(q))));
  const filteredOrders = orders.filter((o) => (!fy || financialYearOf(o.date) === fy)
    && (!q || [o.number, o.party].some((v) => String(v || '').toLowerCase().includes(q))));
  const anyFilter = search || kind || source || fy;

  const parties = useMemo(() => [...new Set([...clients.map((c) => c.name), ...rows.map((r) => r.party)].filter(Boolean))].sort(), [clients, rows]);

  // ---- the form ----
  const openForm = (over) => { setUploadedNow([]); setForm(blankForm(over)); };
  const editRecord = (r) => { setUploadedNow([]); setForm({ ...r, amount: r.amount ?? '' }); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const closeForm = () => {
    if (busy) return;
    uploadedNow.forEach((name) => discardRecordFile(name).catch(() => {}));
    setForm(null);
  };

  const addFiles = async (e) => {
    const picked = [...(e.target.files || [])];
    e.target.value = '';
    for (const file of picked) {
      const ext = (file.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
      if (!RECORD_FILE_EXTS.includes(ext)) { toast(`${file.name}: only PDF, pictures (JPG, PNG), Excel and Word files can be attached`, 'error'); continue; }
      if (file.size > RECORD_FILE_LIMIT_MB * 1048576) { toast(`${file.name} is over ${RECORD_FILE_LIMIT_MB} MB`, 'error'); continue; }
      setBusy(true);
      try {
        const saved = await uploadRecordFile(file);
        setUploadedNow((u) => [...u, saved.name]);
        setForm((f) => (f ? { ...f, files: [...f.files, saved] } : f));
      } catch (err) {
        toast(`Could not attach ${file.name}: ${err.message}`, 'error');
      } finally { setBusy(false); }
    }
  };
  const removeFile = (name) => {
    // A file attached in this form goes now; a saved one when the record is saved.
    if (uploadedNow.includes(name)) { discardRecordFile(name).catch(() => {}); setUploadedNow((u) => u.filter((n) => n !== name)); }
    setForm((f) => ({ ...f, files: f.files.filter((x) => x.name !== name) }));
  };

  const owner = (r) => (r.id ? {} : { ownerGstin: profile?.gstin || '', ownerName: profile?.businessName || '' });
  const save = async () => {
    const rec = cleanRecord({ ...form, ...owner(form) });
    const problem = recordProblem(rec);
    if (problem) { toast(problem, 'error'); return; }
    const twin = records.find((r) => r.id !== rec.id && r.kind === rec.kind && workOrderKey(r.number) === workOrderKey(rec.number));
    if (twin && !(await confirmAction({ title: `${twin.number} is already saved`, message: `There is already a ${RECORD_KINDS.find((k) => k.id === rec.kind)?.label.toLowerCase()} with this number (${showDate(twin.date)}${twin.party ? `, ${twin.party}` : ''}). Save another one anyway?`, confirmLabel: 'Save anyway', tone: 'warning' }))) return;
    setBusy(true);
    try {
      await saveRecord(rec);
      toast(form.id ? 'Record updated' : 'Record saved', 'success');
      setForm(null);
      await load();
    } catch (err) {
      toast(`Could not save: ${err.message}`, 'error');
    } finally { setBusy(false); }
  };

  const remove = async (r) => {
    const files = (r.files || []).length;
    const ok = await confirmAction({
      title: `Delete ${r.number}?`,
      message: `The record${files ? ` and its ${files === 1 ? 'file' : `${files} files`}` : ''} will be deleted from this computer. The daily backups of the last 30 days still have ${files ? 'them' : 'it'}.`,
      confirmLabel: 'Delete', tone: 'danger',
    });
    if (!ok) return;
    try { await deleteRecord(r.id); toast('Record deleted', 'success'); await load(); }
    catch (err) { toast(`Could not delete: ${err.message}`, 'error'); }
  };

  const importOne = (rec) => saveRecord({ ...rec, ...owner(rec) });

  // ---- a row's actions ----
  const rowActions = (r) => (r.source === 'app' ? (
    <button className="icon-btn icon-btn-blue" onClick={() => onOpenBill(r.bill)} title="Open in the app" aria-label={`Open ${r.number}`}><Eye size={15} /></button>
  ) : (
    <>
      <button className="icon-btn icon-btn-blue" onClick={() => editRecord(r.record)} title="Edit" aria-label={`Edit ${r.number}`}><Edit3 size={15} /></button>
      <button className="icon-btn icon-btn-red" onClick={() => remove(r.record)} title="Delete" aria-label={`Delete ${r.number}`}><Trash2 size={15} /></button>
    </>
  ));

  const wo = woOpen ? orders.find((o) => o.key === woOpen) : null;
  const isWo = form?.kind === 'work-order';

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Records</h1>
          <p className="page-subtitle">Old bills, quotations, challans and work orders with their files, next to the ones made here. Records do not change your reports or GST returns.</p>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowCsv(true)} title="Add many old records at once from an Excel sheet saved as CSV"><Upload size={16} /> Import from Excel (CSV)</button>
          <button className="btn btn-primary" onClick={() => openForm()}><Plus size={18} /> Add record</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button className={`btn ${tab === 'docs' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('docs')} aria-pressed={tab === 'docs'}>
          <FileText size={16} /> All documents
        </button>
        <button className={`btn ${tab === 'wo' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('wo')} aria-pressed={tab === 'wo'}>
          <ClipboardList size={16} /> Work orders{orders.length ? ` (${orders.length})` : ''}
        </button>
      </div>

      <div className="glass-panel p-4 mb-6">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ maxWidth: '320px' }}>
            <Search size={16} className="search-icon" />
            <input type="text" placeholder={tab === 'docs' ? 'Search number, party, work order, notes...' : 'Search work order, party...'} value={search}
              onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }} className="search-input" aria-label="Search records" />
          </div>
          {tab === 'docs' && (
            <>
              <select className="filter-select" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type">
                <option value="">All types</option>
                {RECORD_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
              <select className="filter-select" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Old or made here">
                <option value="">Old and new</option>
                <option value="old">Old records only</option>
                <option value="app">Made here only</option>
              </select>
            </>
          )}
          <select className="filter-select" value={fy} onChange={(e) => setFy(e.target.value)} aria-label="Financial year">
            <option value="">All years</option>
            {fyOptions.map((o) => { const label = o.value.replace(/-(\d{2})(\d{2})$/, '-$2'); return <option key={o.value} value={label}>{o.label}</option>; })}
          </select>
          {anyFilter && (
            <button className="icon-btn icon-btn-red" onClick={() => { setSearch(''); setKind(''); setSource(''); setFy(''); }} title="Clear filters" aria-label="Clear filters"><X size={15} /></button>
          )}
        </div>
      </div>

      {tab === 'docs' && (
        <div className="glass-panel">
          <div className="table-header"><h3>Documents{loaded ? ` · ${filtered.length}` : ''}</h3></div>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <Archive size={48} />
              <p>{!loaded ? 'Loading...' : rows.length === 0 ? 'Nothing here yet. Add your old bills, quotations, challans and work orders, one at a time or from an Excel sheet.' : 'Nothing matches your filters.'}</p>
              {loaded && rows.length === 0 && <button className="btn btn-primary" onClick={() => openForm()}>Add record</button>}
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table" style={{ minWidth: '820px' }}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Number</th>
                    <th>Date</th>
                    <th>Party</th>
                    <th>Work order</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th className="col-center">File</th>
                    <th className="col-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, limit).map((r) => (
                    <tr key={r.key} style={r.cancelled ? { opacity: 0.6 } : undefined}>
                      <td><TypeCell r={r} withSource /></td>
                      <td><span className="invoice-badge">{r.number}</span></td>
                      <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>{showDate(r.date)}</td>
                      <td className="font-medium" title={r.notes || undefined} style={{ whiteSpace: 'normal', minWidth: 140, maxWidth: 220 }}>{r.party || '-'}</td>
                      <td>
                        {r.workOrderNo
                          ? <button className="btn-link" style={{ background: 'none', border: 0, padding: 0, color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setWoOpen(workOrderKey(r.workOrderNo))} title="See everything against this work order">{r.workOrderNo}</button>
                          : <span className="text-muted">-</span>}
                      </td>
                      <td style={{ textAlign: 'right' }} className="font-bold">{money(r.amount)}</td>
                      <td className="col-center"><FilesCell files={r.files} /></td>
                      <td><div className="table-actions" style={{ justifyContent: 'center' }}>{rowActions(r)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > limit && (
                <div style={{ textAlign: 'center', padding: '0.75rem' }}>
                  <button className="btn btn-secondary" onClick={() => setLimit((l) => l + PAGE)}>Show more ({filtered.length - limit} left)</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'wo' && (
        <div className="glass-panel">
          <div className="table-header"><h3>Work orders</h3></div>
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <ClipboardList size={48} />
              <p>{orders.length === 0
                ? 'No work orders yet. Add a work order as a record, and give your challans and invoices its number (Work Order No) to see them here together.'
                : 'Nothing matches your filters.'}</p>
              {orders.length === 0 && <button className="btn btn-primary" onClick={() => openForm({ kind: 'work-order' })}>Add work order</button>}
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table" style={{ minWidth: '860px' }}>
                <thead>
                  <tr>
                    <th>Work order</th>
                    <th>Date</th>
                    <th>Party</th>
                    <th style={{ textAlign: 'right' }}>Order value</th>
                    <th style={{ textAlign: 'right' }}>Billed</th>
                    <th style={{ textAlign: 'right' }}>Left to bill</th>
                    <th className="col-center">Challans</th>
                    <th className="col-center">Invoices</th>
                    <th className="col-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.key}>
                      <td><span className="invoice-badge">{o.number}</span>{!o.order && <div className="text-muted" style={{ fontSize: '0.72rem' }}>Work order not added</div>}</td>
                      <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>{showDate(o.date)}</td>
                      <td className="font-medium">{o.party || '-'}</td>
                      <td style={{ textAlign: 'right' }}>{money(o.value)}</td>
                      <td style={{ textAlign: 'right' }} className="font-bold">{formatCurrency(o.billed)}</td>
                      <td style={{ textAlign: 'right', color: o.balance === null ? undefined : o.balance > 0.5 ? '#d97706' : o.balance < -0.5 ? '#dc2626' : '#059669' }}>
                        {o.balance === null ? '-' : Math.abs(o.balance) <= 0.5 ? 'Fully billed' : formatCurrency(o.balance)}
                      </td>
                      <td className="col-center">{o.counts.challan || '-'}</td>
                      <td className="col-center">{o.counts.invoice || '-'}</td>
                      <td><div className="table-actions" style={{ justifyContent: 'center' }}>
                        <button className="icon-btn icon-btn-blue" onClick={() => setWoOpen(o.key)} title="See everything against it" aria-label={`View ${o.number}`}><Eye size={15} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---- one work order with every document against it ---- */}
      {wo && (
        <div className="modal-overlay" onClick={() => setWoOpen(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 className="section-title" style={{ margin: 0, textTransform: 'none' }}>Work order · {wo.number}</h3>
              <button className="icon-btn" onClick={() => setWoOpen(null)} title="Close" aria-label="Close"><X size={18} /></button>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              {[wo.party, showDate(wo.date)].filter(Boolean).join(' · ')}
              {wo.order?.notes ? ` · ${wo.order.notes}` : ''}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
              {[['Order value', money(wo.value)], ['Billed', formatCurrency(wo.billed)], ['Left to bill', wo.balance === null ? '-' : formatCurrency(wo.balance)]].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{v}</div>
                </div>
              ))}
            </div>
            {!wo.order && (
              <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                This work order is named on the documents below but is not saved yet. Add it to see its value and what is left to bill.
              </p>
            )}
            <div className="table-scroll" style={{ border: '1px solid var(--border)', borderRadius: 6, maxHeight: 360, overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.85rem', minWidth: 640 }}>
                <thead><tr><th>Type</th><th>Number</th><th>Date</th><th style={{ textAlign: 'right' }}>Amount</th><th>Source</th><th className="col-center">File</th><th className="col-center">Open</th></tr></thead>
                <tbody>
                  {[...(wo.order ? [wo.order] : []), ...[...wo.docs].sort((a, b) => String(a.date).localeCompare(String(b.date)))].map((r) => (
                    <tr key={r.key} style={r.cancelled ? { opacity: 0.6 } : undefined}>
                      <td><TypeCell r={r} /></td>
                      <td><span className="invoice-badge">{r.number}</span></td>
                      <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>{showDate(r.date)}</td>
                      <td style={{ textAlign: 'right' }}>{money(r.amount)}</td>
                      <td><SourceCell r={r} /></td>
                      <td className="col-center"><FilesCell files={r.files} /></td>
                      <td><div className="table-actions" style={{ justifyContent: 'center' }}>
                        {r.source === 'app'
                          ? <button className="icon-btn icon-btn-blue" onClick={() => { setWoOpen(null); onOpenBill(r.bill); }} title="Open in the app" aria-label={`Open ${r.number}`}><Eye size={15} /></button>
                          : <button className="icon-btn icon-btn-blue" onClick={() => { setWoOpen(null); editRecord(r.record); }} title="Edit" aria-label={`Edit ${r.number}`}><Edit3 size={15} /></button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
              Billed is the invoices less credit notes; quotations, challans and cancelled bills are not counted. New invoices made here are matched by the Work Order No in their order details.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setWoOpen(null)}>Close</button>
              {!wo.order && <button className="btn btn-secondary" onClick={() => { setWoOpen(null); openForm({ kind: 'work-order', number: wo.number, party: wo.party }); }}><Plus size={14} /> Add the work order</button>}
              <button className="btn btn-primary" onClick={() => { setWoOpen(null); openForm({ kind: 'challan', workOrderNo: wo.number, party: wo.party }); }}><Plus size={14} /> Add an old document against it</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- add / edit a record ---- */}
      {form && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <h3 className="section-title">{form.id ? 'Edit record' : 'Add record'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select className="form-input" value={form.kind} onChange={(e) => set('kind', e.target.value)}>
                  {RECORD_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{isWo ? 'Work order number *' : 'Document number *'}</label>
                <input className="form-input" value={form.number} onChange={(e) => set('number', e.target.value)} placeholder={isWo ? 'UPLC/WO/2025/088' : 'GSPL/2025-26/31'} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" value={form.date} onChange={(e) => set('date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{isWo ? 'Order value (₹)' : 'Amount (₹)'}</label>
                <input type="number" step="0.01" className="form-input" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder={form.kind === 'challan' ? 'Value of goods, if you want' : 'Total with GST'} />
              </div>
              <div className="form-group" style={{ gridColumn: isWo ? 'span 2' : undefined }}>
                <label className="form-label">Party</label>
                <input className="form-input" list="records-parties" value={form.party} onChange={(e) => set('party', e.target.value)} placeholder="Client or supplier" />
                <datalist id="records-parties">{parties.map((p) => <option key={p} value={p} />)}</datalist>
              </div>
              {!isWo && (
                <div className="form-group">
                  <label className="form-label">Against work order</label>
                  <input className="form-input" list="records-workorders" value={form.workOrderNo} onChange={(e) => set('workOrderNo', e.target.value)} placeholder="Work order no., if any" />
                  <datalist id="records-workorders">{orders.map((o) => <option key={o.key} value={o.number} />)}</datalist>
                </div>
              )}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="What it was for, items, anything to find it by" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Files</label>
                {form.files.length > 0 && (
                  <ul style={{ listStyle: 'none', margin: '0 0 0.5rem', padding: 0, display: 'grid', gap: 4 }}>
                    {form.files.map((f) => (
                      <li key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 6, padding: '0.3rem 0.5rem' }}>
                        <Paperclip size={14} />
                        <button type="button" onClick={() => openFile(f)} style={{ background: 'none', border: 0, padding: 0, color: 'var(--primary)', cursor: 'pointer', textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title="Open">{f.originalName}</button>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{sizeText(f.size)}</span>
                        <button type="button" className="icon-btn icon-btn-red" onClick={() => removeFile(f.name)} title="Remove this file" aria-label={`Remove ${f.originalName}`}><X size={14} /></button>
                      </li>
                    ))}
                  </ul>
                )}
                <label className="btn btn-secondary" style={{ cursor: busy ? 'wait' : 'pointer', display: 'inline-flex' }}>
                  <Paperclip size={15} /> {busy ? 'Attaching...' : 'Attach PDF, scan or photo'}
                  <input type="file" multiple accept={RECORD_FILE_EXTS.join(',')} onChange={addFiles} disabled={busy} style={{ display: 'none' }} />
                </label>
                <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0.35rem 0 0' }}>PDF, JPG, PNG, Excel or Word, up to {RECORD_FILE_LIMIT_MB} MB each. Kept in the app's data folder and in its daily backups.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button className="btn btn-secondary" onClick={closeForm} disabled={busy}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={busy}><Save size={16} /> {form.id ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {showCsv && (
        <CsvListImport what="records" sample={RECORDS_SAMPLE} sampleName="Records-sample.csv"
          intro="Columns: Type (Invoice, Quotation, Challan, Work order, Proforma, Credit note or Other), Number, Date (DD-MM-YYYY), Party, Amount, Work Order No and Notes. Only Type, Number and Date are needed. Attach the files afterwards with Edit."
          skipNote="A type and number already saved is skipped, so importing the same file twice is safe."
          footer={null}
          parse={(text) => recordsCsvToList(text, records)}
          save={importOne}
          onClose={() => setShowCsv(false)}
          onDone={() => { setShowCsv(false); load(); }} />
      )}
    </div>
  );
}

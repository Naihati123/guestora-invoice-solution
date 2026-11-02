// v1.10.83 - the Wi-Fi button at the top right (asked for: "on top a button
// to make our software offline, and it shows what will happen when offline").
// Same switch as Settings → Privacy & internet; what it stops must match
// src/utils/offlineMode.js and docs-site/pages/security.mjs#offline-mode.
import { useState } from 'react';
import { Wifi, WifiOff, Check } from 'lucide-react';
import HelpButton from './HelpButton';
import { useOfflineMode } from '../utils/offlineMode';

const STOPS = [
  'No automatic check for updates. Use Check for Updates in Settings when you want one.',
  'Invoice PDFs are not copied to Google Drive. They are still saved on this computer.',
];
const KEEPS = [
  'Invoices, PDFs, printing, payments, stock, reports, GST returns and backups: all exactly as now.',
  'Links you click (help pages, WhatsApp, the GST portal) still open in your browser.',
];

export default function OfflineModeButton({ className, onOpenSettings }) {
  const [on, setOn] = useOfflineMode();
  const [open, setOpen] = useState(false);
  const label = on ? 'Offline mode is on' : 'Offline mode is off';
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}
        title={`${label}: click to see or change it`} aria-label={label}
        style={on ? { color: '#d97706' } : undefined}>
        {on ? <WifiOff size={18} /> : <Wifi size={18} />}
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content" role="dialog" aria-labelledby="offline-title" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <h3 id="offline-title" className="section-title" style={{ margin: '0 0 0.4rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              {on ? <WifiOff size={20} style={{ color: '#d97706' }} /> : <Wifi size={20} />} Offline mode
              <HelpButton title="Offline mode" doc="security#offline-mode" size={16} />
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {on
                ? 'On. The app does not go online by itself. Your data never leaves this computer either way.'
                : 'Off. Your data never leaves this computer. Turn this on and the app also never goes online by itself.'}
            </p>

            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>{on ? 'While it is on' : 'When it is on'}</div>
            <ul style={{ margin: '0 0 0.8rem', paddingLeft: '1.1rem', fontSize: '0.85rem', lineHeight: 1.55 }}>
              {STOPS.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>What stays the same</div>
            <ul style={{ margin: '0 0 1rem', paddingLeft: '1.1rem', fontSize: '0.85rem', lineHeight: 1.55, listStyle: 'none' }}>
              {KEEPS.map((t) => <li key={t} style={{ display: 'flex', gap: '0.4rem' }}><Check size={15} style={{ color: 'var(--success, #16a34a)', flexShrink: 0, marginTop: 3 }} aria-hidden="true" />{t}</li>)}
            </ul>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className={`btn ${on ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setOn(!on)}>
                {on ? <><Wifi size={16} /> Turn Offline mode off</> : <><WifiOff size={16} /> Turn Offline mode on</>}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Close</button>
              {onOpenSettings && (
                <button type="button" onClick={() => { setOpen(false); onOpenSettings(); }}
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'underline' }}>
                  Everything that uses the internet
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

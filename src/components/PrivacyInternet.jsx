// v1.10.83 - Settings → Privacy & internet. Asked for: "people want to be
// sure this is safe... how can we show them we are not tracking any data, or
// that they can turn the internet off". Every row here must match the code and
// docs-site/pages/security.mjs (#what-it-connects-to); change them together.
import { WifiOff, ShieldCheck } from 'lucide-react';
import HelpButton from './HelpButton';
import { useOfflineMode } from '../utils/offlineMode';
import { docsLink } from '../utils';

const USES = [
  ['Checking for a new version', 'By itself: a few seconds after the app opens, then every 6 hours', 'Asks GitHub for the newest version number. Nothing about you is sent.', 'Stopped'],
  ['The supporters list', 'By itself: when Support & About or its card on the Dashboard shows', 'Reads a public list from GitHub. Nothing is sent.', 'Stopped'],
  ['Google Drive', 'Only if you set it up: with each invoice PDF you save, and when you click Save to Drive', 'Saves your files to your own Google Drive.', 'The copy with each PDF is stopped'],
  ['Updating the app', 'When you click Update or Check for Updates', 'Downloads the new version from GitHub.', 'Only when you click'],
  ['Help pages, Report a problem, WhatsApp, the GST portal', 'When you click them', 'Opens them in your browser, like any link.', 'Only when you click'],
];

const cell = { padding: '0.45rem 0.6rem', borderTop: '1px solid var(--border)', verticalAlign: 'top' };

export default function PrivacyInternet() {
  const [offline, toggle] = useOfflineMode();
  return (
    <>
      <h3 className="section-title">Privacy &amp; internet <HelpButton title="Privacy and internet" doc="security#offline-mode" size={16} style={{ marginLeft: 6 }} /></h3>
      <p className="page-subtitle" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <ShieldCheck size={18} style={{ color: 'var(--success, #16a34a)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <span>Your invoices, clients and settings never leave this computer. The app has no tracking and no ads, and it does not need the internet to work. It goes online only for the things below.</span>
      </p>

      <label className="notice notice-info" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '1rem' }}>
        <input type="checkbox" checked={offline} onChange={(e) => toggle(e.target.checked)} style={{ marginTop: 4, width: 18, height: 18, flexShrink: 0 }} />
        <span>
          <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><WifiOff size={16} aria-hidden="true" /> Offline mode: never go online by itself</strong>
          <br />
          <span style={{ fontSize: '0.85rem' }}>
            {offline
              ? 'On. The app does not check for updates, does not read the supporters list, and does not copy invoice PDFs to Google Drive. Things you click that need the internet, such as Check for Updates, still work when you click them.'
              : 'Off. Tick it and the app makes no internet connection by itself: no update check, no supporters list, no automatic copy to Google Drive. You can still update whenever you choose, with Check for Updates.'}
          </span>
        </span>
      </label>

      <div className="table-wrap" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              <th style={{ padding: '0.45rem 0.6rem' }}>What uses the internet</th>
              <th style={{ padding: '0.45rem 0.6rem' }}>When</th>
              <th style={{ padding: '0.45rem 0.6rem' }}>What it does</th>
              <th style={{ padding: '0.45rem 0.6rem' }}>Offline mode</th>
            </tr>
          </thead>
          <tbody>
            {USES.map(([what, when, does, stopped]) => (
              <tr key={what}>
                <td style={{ ...cell, fontWeight: 600 }}>{what}</td>
                <td style={cell}>{when}</td>
                <td style={cell}>{does}</td>
                <td style={cell}>{stopped}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '0.85rem', margin: '0.75rem 0 0' }}>
        Nothing else. Making invoices, PDFs, printing, payments, stock, reports, GST returns, backups and reading a bill from a photo all work with no internet at all.
      </p>

      <div style={{ marginTop: '1rem', padding: '0.75rem 0.9rem', borderRadius: 8, background: 'var(--bg-secondary)', fontSize: '0.85rem' }}>
        <strong>Check it yourself in 2 minutes.</strong> Turn off your Wi-Fi (or unplug the internet cable), close the app and open it again. Make an invoice, download its PDF, print it and open Reports: everything works. Turn the internet back on when you are done.{' '}
        <a href={docsLink('security#check-yourself')} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--primary)' }}>More ways to check →</a>
      </div>
    </>
  );
}

// About: the app's name and version, where it comes from (with the credit the
// MIT licence of the original asks for), reporting a problem, and what's new.
import { useEffect, useState } from 'react';
import { Info, Code } from 'lucide-react';
import WhatsNew from './WhatsNew';
import ProblemLog from './ProblemLog';
import { SafePrivateSection } from './SafePrivateNote';
import { APP_NAME, APP_MAKER, APP_REPO, BASED_ON } from '../brand';

const card = { padding: '1.25rem 1.5rem' };

export default function SupportView() {
  const [version, setVersion] = useState('');
  useEffect(() => {
    let live = true;
    fetch('/api/version').then((r) => r.json()).then((d) => { if (live && d?.current) setVersion(d.current); }).catch(() => {});
    return () => { live = false; };
  }, []);

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">About</h1>
          <p className="page-subtitle">{APP_NAME}{version ? ` v${version}` : ''}</p>
        </div>
      </div>

      <div className="glass-panel" style={{ ...card, marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <Info size={28} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem' }}>{APP_NAME}</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '70ch' }}>
            GST billing for {APP_MAKER}. Invoices, clients and settings are kept on this computer, and the app works offline.
          </p>
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '70ch' }}>
            <Code size={13} style={{ verticalAlign: '-2px' }} /> Based on{' '}
            <a href={BASED_ON.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{BASED_ON.name}</a>{' '}
            by {BASED_ON.by}, used under the MIT licence. Source code:{' '}
            <a href={APP_REPO} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{APP_REPO.replace('https://', '')}</a>.
          </p>
        </div>
      </div>

      <SafePrivateSection style={{ marginBottom: '1.25rem' }} />

      <WhatsNew />

      <ProblemLog />
    </div>
  );
}

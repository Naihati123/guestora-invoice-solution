// v1.10.83 - Never a white screen. Before this there was no error boundary:
// one screen throwing while rendering (an old invoice with an unexpected
// field, ERR-043) unmounted the whole app and left a blank page. App.jsx
// wraps the screen area in one of these (keyed by screen, so the sidebar keeps
// working and moving to another screen clears it), and main.jsx wraps the
// whole app as a last line.
//
// The panel itself must never throw, so it only renders plain markup and
// strings that were made safe in componentDidCatch.
import { Component } from 'react';
import { logProblem, copyText, openReport } from '../utils/problemLog';
import { isChunkLoadError, knownProblemFor, reportText } from '../utils/errorReport';

const RELOAD_KEY = 'fgsb_chunk_reload_at';

// A lazy screen whose file vanished after an update. React catches that here,
// so main.jsx's window listener never sees it: reload once, as it would have.
function reloadForChunkError() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 30_000) return false; // reloaded a moment ago: show the panel, never loop
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    setTimeout(() => window.location.reload(), 200);
    return true;
  } catch { return false; }
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, entry: null, copied: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    const message = String(error?.message || error || 'Unknown error');
    if (isChunkLoadError(message) && reloadForChunkError()) return;
    const stack = `${error?.stack || ''}\n${info?.componentStack || ''}`;
    this.setState({ entry: logProblem({ kind: 'screen', message, stack }) });
  }

  reset = () => this.setState({ failed: false, entry: null, copied: false });

  goHome = () => {
    try { sessionStorage.setItem('gst_currentView', 'dashboard'); } catch { /* ignore */ }
    if (this.props.onHome) this.props.onHome();
    this.reset();
  };

  copy = async () => {
    const ok = this.state.entry ? await copyText(reportText(this.state.entry)) : false;
    this.setState({ copied: ok ? 'Copied' : 'Could not copy' });
  };

  render() {
    if (!this.state.failed) return this.props.children;
    const { entry, copied } = this.state;
    let known = null;
    try { known = knownProblemFor(entry); } catch { /* panel must not throw */ }
    return (
      <div className="glass-panel problem-panel" role="alert">
        <h2>This screen ran into a problem. Your data is safe.</h2>
        <p>Nothing you saved is lost. Click <b>Try again</b>, or go back to the Dashboard. If it keeps happening, please report it so it can be fixed.</p>
        {known && (
          <div className="problem-known">
            <a href={known.url} target="_blank" rel="noopener noreferrer">This is a known problem: how to fix it</a>
            <div>{known.fix}</div>
          </div>
        )}
        {entry && <code>{String(entry.message)}</code>}
        <div className="problem-panel-actions">
          <button type="button" className="btn btn-primary" onClick={this.reset}>Try again</button>
          <button type="button" className="btn btn-secondary" onClick={this.goHome}>Go to Dashboard</button>
          {entry && <button type="button" className="btn btn-secondary" onClick={this.copy}>{copied || 'Copy details'}</button>}
          {entry && <button type="button" className="btn btn-secondary" onClick={() => openReport(entry)}>Report this problem</button>}
        </div>
      </div>
    );
  }
}

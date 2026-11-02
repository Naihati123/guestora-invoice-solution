// v1.10.83 (#112) - the cost centre picker and list filter shared by the
// invoice, purchase and expense screens and the Dashboard (loader: useCostCentres.js).
import { centreLabel, UNTAGGED } from '../utils/costCentres';

// Picks one centre for a document. Archived centres cannot be picked, but a
// document already tagged with one keeps it (shown as archived).
// onChange(id, name); id '' = none.
export function CostCentreSelect({ centres, value = '', name = '', onChange, id = 'cost-centre' }) {
  const current = value ? centres.find((c) => c.id === value) : null;
  const keepOld = value && (!current || current.archived);
  return (
    <select id={id} className="form-input" value={value} onChange={(e) => {
      const next = e.target.value;
      const c = centres.find((x) => x.id === next);
      onChange(next, c ? c.name : (next === value ? name : ''));
    }}>
      <option value="">None</option>
      {centres.filter((c) => !c.archived).map((c) => <option key={c.id} value={c.id}>{centreLabel(c)}</option>)}
      {keepOld && <option value={value}>{current ? centreLabel(current) : (name || 'Unknown')} (archived)</option>}
    </select>
  );
}

// The list filter: all, untagged, or one centre (archived ones too).
export function CostCentreFilter({ centres, value, onChange }) {
  return (
    <select className="filter-select" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Cost centre" title="Cost centre">
      <option value="">All cost centres</option>
      <option value={UNTAGGED}>No cost centre</option>
      {centres.map((c) => <option key={c.id} value={c.id}>{centreLabel(c)}{c.archived ? ' (archived)' : ''}</option>)}
    </select>
  );
}

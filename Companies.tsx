import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, errorText } from '../../lib/supabase';
import { useSettings } from '../../lib/settings';
import { LEVELS, PLAN_LABELS, type Company, type LevelId } from '../../lib/types';
import { LevelChip } from '../../components/Level';

function Row({ c, onChange }: { c: Company; onChange: () => void }) {
  const { settings } = useSettings();
  const [level, setLevel] = useState<LevelId>(c.level);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');

  async function saveLevel() {
    setErr('');
    if (!reason.trim()) { setErr('Write a reason for the level change.'); return; }
    const { error } = await supabase.rpc('set_company_level', { p_company: c.id, p_level: level, p_reason: reason });
    if (error) setErr(errorText(error)); else { setReason(''); onChange(); }
  }
  async function setStatus(status: 'live' | 'paused') {
    const { error } = await supabase.from('companies').update({ status }).eq('id', c.id);
    if (error) setErr(errorText(error)); else onChange();
  }

  return (
    <article className="card section">
      <div className="row-between">
        <div>
          <h3 className="serif"><Link to={`/company/${c.id}`}>{c.name}</Link></h3>
          <p className="muted small">{c.category} · {c.service_areas.join(', ')}</p>
        </div>
        <span className={`pill ${c.status === 'live' ? 'pill-green' : 'pill-gold'}`}>{c.status === 'live' ? 'Live' : c.status === 'paused' ? 'Paused' : c.status}</span>
      </div>
      <div className="meta-grid small">
        <div><span className="muted">Level</span><LevelChip level={c.level} /></div>
        <div><span className="muted">Plan</span>{PLAN_LABELS[c.plan]}</div>
        <div><span className="muted">Billing</span>{c.billing_status.replace(/_/g, ' ')}</div>
        <div><span className="muted">Payouts</span>{c.payouts_ready ? 'Ready' : 'Not set up'}</div>
        <div><span className="muted">Insurance</span>{c.insurance_expires ?? '—'}</div>
      </div>
      <details>
        <summary>Change level</summary>
        <div className="form">
          <select value={level} onChange={(e) => setLevel(e.target.value as LevelId)}>
            {LEVELS.map((l) => <option key={l} value={l}>{settings.level_names[l]}</option>)}
          </select>
          <textarea rows={2} placeholder="Reason (required, saved in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="btn btn-sm" disabled={level === c.level} onClick={saveLevel}>Save level</button>
        </div>
      </details>
      <div className="inline-inputs">
        {c.status === 'live'
          ? <button className="btn btn-ghost btn-sm" onClick={() => setStatus('paused')}>Pause listing</button>
          : <button className="btn btn-sm" onClick={() => setStatus('live')}>Restore listing</button>}
      </div>
      {err && <p className="error">{err}</p>}
    </article>
  );
}

export default function Companies() {
  const [list, setList] = useState<Company[] | null>(null);
  const [q, setQ] = useState('');
  const load = useCallback(async () => {
    const { data } = await supabase.from('companies').select('*').order('name');
    setList((data as Company[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const shown = (list ?? []).filter((c) => `${c.name} ${c.category}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="page wide">
      <h1 className="page-title">Companies</h1>
      <p className="muted">{list ? `${list.filter((c) => c.status === 'live').length} live of ${list.length}` : ''}</p>
      <label className="search"><span className="sr-only">Search companies</span><input type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <div className="card-grid">
        {list === null ? <p className="muted">Loading…</p> : shown.length === 0 ? <p className="muted">No companies yet. Approve an application to add one.</p> :
          shown.map((c) => <Row key={c.id} c={c} onChange={load} />)}
      </div>
    </div>
  );
}

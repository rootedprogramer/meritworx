import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, configured } from '../lib/supabase';
import { useSettings } from '../lib/settings';
import type { PublicCompany } from '../lib/types';
import { CompanyCard } from '../components/CompanyCard';
import { Sheet } from '../components/Sheet';
import { LevelsList } from '../components/Level';

export default function Browse() {
  const { settings } = useSettings();
  const [companies, setCompanies] = useState<PublicCompany[] | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [area, setArea] = useState('');
  const [levelsOpen, setLevelsOpen] = useState(false);

  useEffect(() => {
    if (!configured) { setCompanies([]); return; }
    supabase.from('public_companies').select('*')
      .order('level_rank', { ascending: false }).order('name')
      .then(({ data }) => setCompanies((data as PublicCompany[]) ?? []));
  }, []);

  const cats = settings.categories.filter((c) => c.on).map((c) => c.name);
  const shown = useMemo(() => (companies ?? []).filter((c) => {
    const text = `${c.name} ${c.category} ${c.about ?? ''}`.toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (!cat || c.category === cat) && (!area || c.service_areas.includes(area));
  }), [companies, q, cat, area]);

  return (
    <div className="page">
      <h1 className="page-title">Find a pro you can trust</h1>
      <p className="muted lead">Invitation-only Birmingham companies, checked before they join and ranked by the work they’ve done.</p>

      <label className="search">
        <span className="sr-only">Search companies</span>
        <input type="search" placeholder="Search plumbing, roofing, a company…" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      <div className="chips-row" role="group" aria-label="Category">
        <button className={`chip-btn${!cat ? ' is-on' : ''}`} onClick={() => setCat('')}>All</button>
        {cats.map((c) => (
          <button key={c} className={`chip-btn${cat === c ? ' is-on' : ''}`} onClick={() => setCat(cat === c ? '' : c)}>{c}</button>
        ))}
      </div>

      <div className="row-between">
        <select className="select-inline" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Area">
          <option value="">All areas</option>
          {settings.areas.map((a) => <option key={a}>{a}</option>)}
        </select>
        <button className="link-btn" onClick={() => setLevelsOpen(true)}>How levels work</button>
      </div>

      {companies === null ? <p className="muted">Loading companies…</p> : shown.length === 0 ? (
        <div className="empty card">
          <h3 className="serif">{companies.length === 0 ? 'Companies are joining now' : 'No companies match'}</h3>
          <p className="muted">{companies.length === 0
            ? 'We’re inviting and checking Birmingham’s best trades. Join the waitlist and we’ll tell you when booking opens.'
            : 'Try another category or area.'}</p>
          {companies.length === 0 && <Link to="/waitlist" className="btn">Join the waitlist</Link>}
        </div>
      ) : (
        <div className="stack">{shown.map((c) => <CompanyCard key={c.id} c={c} />)}</div>
      )}

      <p className="footnote muted small">Own a trade business? <Link to="/for-companies">See how MeritWorx works for companies</Link>.</p>

      <Sheet open={levelsOpen} onClose={() => setLevelsOpen(false)} title="How levels work">
        <p className="muted">Levels are earned, never bought. They come from verified activity on MeritWorx: reviews, paid jobs, and consistency over time.</p>
        <LevelsList />
      </Sheet>
    </div>
  );
}

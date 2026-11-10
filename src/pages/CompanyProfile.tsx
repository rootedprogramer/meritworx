import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, configured } from '../lib/supabase';
import { useSettings } from '../lib/settings';
import { VETTING_LINE, type PublicCompany } from '../lib/types';
import { CompanyTile } from '../components/CompanyCard';
import { LevelSeal, LevelsList } from '../components/Level';
import { Sheet } from '../components/Sheet';
import { Icon } from '../components/Icon';

export default function CompanyProfile() {
  const { id } = useParams();
  const { settings } = useSettings();
  const [c, setC] = useState<PublicCompany | null | undefined>(undefined);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    if (!id || !configured) { setC(null); return; }
    supabase.from('public_companies').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      setC((data as PublicCompany) ?? null);
      if (data) supabase.from('profile_views').insert({ company_id: id }).then(() => {});
    });
  }, [id]);

  if (c === undefined) return <div className="page"><p className="muted">Loading…</p></div>;
  if (c === null) return (
    <div className="page"><div className="empty card">
      <h3 className="serif">This company isn’t listed right now</h3>
      <Link to="/" className="btn">Back to Browse</Link>
    </div></div>
  );

  return (
    <div className="page has-action-bar">
      <Link to="/" className="back">‹ Browse</Link>
      <div className="profile-head">
        <CompanyTile c={c} size={76} />
        <div>
          <h1 className="page-title">{c.name}</h1>
          <p className="muted">{c.category} · {c.service_areas.join(', ')}</p>
        </div>
      </div>

      <button className="card level-card" onClick={() => setLevelsOpen(true)}>
        <LevelSeal level={c.level} size={44} />
        <div>
          <strong className="serif level-name">{settings.level_names[c.level]}</strong>
          <p className="muted small">{settings.level_descriptions[c.level]}</p>
        </div>
      </button>

      <section className="card section">
        <h2 className="h2">Reviews</h2>
        <p className="muted">No reviews yet. Reviews come only from jobs paid through MeritWorx.</p>
      </section>

      {c.about && <section className="card section"><h2 className="h2">About</h2><p>{c.about}</p></section>}

      {c.photos && c.photos.length > 0 && (
        <div className="photos">{c.photos.map((p) => <img key={p} src={p} alt="" />)}</div>
      )}

      <section className="card section facts">
        {c.owner_name && <div><span className="muted small">Owner</span><p>{c.owner_name}</p></div>}
        {c.phone && <div><span className="muted small">Phone</span><p><a href={`tel:${c.phone}`}>{c.phone}</a></p></div>}
        {c.website && <div><span className="muted small">Website</span><p><a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer">{c.website.replace(/^https?:\/\//, '')}</a></p></div>}
        <div><span className="muted small">Checked</span><p className="checked"><Icon name="check" size={18} /> {VETTING_LINE}</p></div>
        <div><span className="muted small">Years on The List</span><p>{c.years_on_list === 0 ? 'New this year' : c.years_on_list}</p></div>
      </section>

      <div className="action-bar">
        {c.phone && <a className="btn btn-ghost" href={`tel:${c.phone}`}><Icon name="phone" size={18} /> Call</a>}
        <button className="btn" onClick={() => setQuoteOpen(true)}>Request a quote</button>
      </div>

      <Sheet open={levelsOpen} onClose={() => setLevelsOpen(false)} title="How levels work">
        <p className="muted">Levels are earned, never bought.</p>
        <LevelsList current={c.level} />
      </Sheet>
      <Sheet open={quoteOpen} onClose={() => setQuoteOpen(false)} title="Request a quote">
        <p>Quote requests and in-app payments open soon. Join the waitlist and we’ll text you the day you can book {c.name} here.</p>
        <p className="muted small">Until then, you can call them directly.</p>
        <Link to="/waitlist" className="btn btn-block">Join the waitlist</Link>
      </Sheet>
    </div>
  );
}

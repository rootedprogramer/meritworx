import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase, errorText, uploadFile } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { LEVELS, type Company } from '../lib/types';
import { LevelSeal, LevelsList } from '../components/Level';
import { Sheet } from '../components/Sheet';
import { CompanyTile } from '../components/CompanyCard';

function useMyCompany() {
  const { session } = useAuth();
  const [company, setCompany] = useState<Company | null | undefined>(undefined);
  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from('companies').select('*').eq('owner_user_id', session.user.id).maybeSingle();
    setCompany((data as Company) ?? null);
  }, [session]);
  useEffect(() => { load(); }, [load]);
  return { company, reload: load };
}

function PendingState() {
  const [app, setApp] = useState<{ name: string; status: string; certificate_requested: boolean } | null | undefined>(undefined);
  useEffect(() => { supabase.rpc('my_application').then(({ data }) => setApp(data ?? null)); }, []);
  if (app === undefined) return <p className="muted">Loading…</p>;
  return (
    <div className="card empty">
      <h3 className="serif">{app ? 'Your application is in review' : 'No company on this account yet'}</h3>
      <p className="muted">{app
        ? app.certificate_requested ? 'We need a current insurance certificate before we can list you. Reply to our email with it.' : 'We’re checking your license and insurance. You’ll get an email when you’re live.'
        : 'MeritWorx is invitation-only. Use the link in your invitation to apply.'}</p>
    </div>
  );
}

export function CompanyHome() {
  const { profile } = useAuth();
  const { settings } = useSettings();
  const { company } = useMyCompany();
  const [views, setViews] = useState<number | null>(null);
  const [nextOpen, setNextOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!company) return;
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('company_id', company.id).gte('viewed_at', since)
      .then(({ count }) => setViews(count ?? 0));
  }, [company]);

  if (company === undefined) return <div className="page"><p className="muted">Loading…</p></div>;
  if (company === null) return <div className="page"><h1 className="page-title">Company home</h1><PendingState /></div>;

  const first = (company.owner_name || profile?.name || '').split(' ')[0];
  const idx = LEVELS.indexOf(company.level);
  const next = LEVELS[idx + 1];

  return (
    <div className="page">
      <h1 className="home-headline">Hi{first ? `, ${first}` : ''}</h1>
      <p className="muted">Your last 30 days</p>
      <div className="stats">
        <div className="stat"><strong>{views ?? '–'}</strong><span>Profile views</span></div>
        <div className="stat"><strong>0</strong><span>Quote requests</span></div>
        <div className="stat"><strong>0</strong><span>Paid in the app</span></div>
        <div className="stat"><strong>$0</strong><span>Total collected</span></div>
      </div>
      <button className="link-btn" onClick={() => setReportOpen(true)}>View monthly report</button>

      <div className="card level-card static">
        <LevelSeal level={company.level} size={48} />
        <div>
          <strong className="serif level-name">{settings.level_names[company.level]}</strong>
          <p className="muted small">{settings.level_descriptions[company.level]}</p>
          {next && <button className="link-btn" onClick={() => setNextOpen(true)}>What it takes to reach {settings.level_names[next]}</button>}
        </div>
      </div>

      {company.status === 'paused' && <p className="notice">Your listing is paused. Contact the MeritWorx team.</p>}
      <div className="notice">Quote requests and payments open when MeritWorx launches to homeowners. Your listing is {company.status === 'live' ? 'live now' : company.status}.</div>

      <div className="share-card">
        <LevelSeal level={company.level} size={64} />
        <p className="share-name">{company.name}</p>
        <p className="share-level">{settings.level_names[company.level]} on MeritWorx</p>
        <p className="share-tag">Where Reputation Meets Opportunity</p>
      </div>
      <p className="muted small center">Screenshot this to share on social media. Truck and yard-sign badges are coming.</p>

      <Sheet open={nextOpen} onClose={() => setNextOpen(false)} title={next ? `Reaching ${settings.level_names[next]}` : 'Levels'}>
        <p className="muted">Levels move automatically from verified activity in the app: reviews, rating quality, consistency over time, and completed jobs. The exact criteria will show here once paid jobs start.</p>
        <LevelsList current={company.level} />
      </Sheet>
      <Sheet open={reportOpen} onClose={() => setReportOpen(false)} title="Monthly report">
        <p>{views ? `${views} homeowners looked at your profile in the last 30 days.` : 'Your report fills in as homeowners find you.'}</p>
        <div className="stats">
          <div className="stat"><strong>{views ?? 0}</strong><span>Profile views</span></div>
          <div className="stat"><strong>0</strong><span>Quote requests</span></div>
        </div>
      </Sheet>
    </div>
  );
}

export function CompanyProfileEdit() {
  const { session } = useAuth();
  const { settings } = useSettings();
  const { company, reload } = useMyCompany();
  const [f, setF] = useState({ about: '', phone: '', website: '' });
  const [areas, setAreas] = useState<string[]>([]);
  const [logo, setLogo] = useState<File | undefined>();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (company) { setF({ about: company.about ?? '', phone: company.phone ?? '', website: company.website ?? '' }); setAreas(company.service_areas); }
  }, [company]);

  if (company === undefined) return <div className="page"><p className="muted">Loading…</p></div>;
  if (company === null) return <div className="page"><h1 className="page-title">Profile</h1><PendingState /></div>;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (areas.length === 0) { setErr('Keep at least one service area.'); return; }
    setBusy(true); setErr(''); setMsg('');
    try {
      const patch: Record<string, unknown> = { ...f, service_areas: areas };
      if (logo) patch.logo = await uploadFile('logos', session!.user.id, logo, 'logo');
      const { error } = await supabase.from('companies').update(patch).eq('id', company!.id);
      if (error) throw error;
      setMsg('Profile saved'); setLogo(undefined); reload();
    } catch (e2) { setErr(errorText(e2)); }
    setBusy(false);
  }

  return (
    <div className="page">
      <h1 className="page-title">Profile</h1>
      <div className="profile-head">
        <CompanyTile c={company} size={64} />
        <div><strong className="serif">{company.name}</strong><p className="muted small">{company.category}</p></div>
      </div>
      <form className="form card" onSubmit={save}>
        <label>About<textarea rows={5} value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })} /></label>
        <label>Phone<input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
        <label>Website<input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></label>
        <fieldset>
          <legend>Service areas</legend>
          <div className="chips-wrap">
            {settings.areas.map((a) => (
              <button type="button" key={a} aria-pressed={areas.includes(a)} className={`chip-btn${areas.includes(a) ? ' is-on' : ''}`}
                onClick={() => setAreas(areas.includes(a) ? areas.filter((x) => x !== a) : [...areas, a])}>{a}</button>
            ))}
          </div>
        </fieldset>
        <label>New logo<input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0])} /></label>
        {err && <p className="error">{err}</p>}
        {msg && <p className="success">{msg}</p>}
        <button className="btn btn-block" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
      <p className="muted small">To change your business name, trade, or license details, contact the MeritWorx team. <Link to={`/company/${company.id}`}>See your public profile</Link></p>
    </div>
  );
}

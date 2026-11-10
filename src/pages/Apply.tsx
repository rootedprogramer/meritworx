import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, errorText, uploadFile } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { PLAN_LABELS, type Plan } from '../lib/types';

interface Invite { name: string; owner_name: string | null; email: string | null; category: string | null; service_areas: string[]; status: string }

export default function Apply() {
  const { token } = useParams();
  const { session } = useAuth();
  const { settings } = useSettings();
  const [invite, setInvite] = useState<Invite | null | undefined>(undefined);
  const [f, setF] = useState({ name: '', owner_name: '', category: '', phone: '', email: '', website: '', about: '', license_number: '', insurance_expires: '', plan: 'app' as Plan, editors_guide_client: false });
  const [areas, setAreas] = useState<string[]>([]);
  const [files, setFiles] = useState<{ logo?: File; license?: File; insurance?: File }>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    supabase.rpc('get_invite', { p_token: token }).then(({ data }) => {
      const inv = data as Invite | null;
      setInvite(inv);
      if (inv) {
        setF((x) => ({ ...x, name: inv.name ?? '', owner_name: inv.owner_name ?? '', email: inv.email ?? '', category: inv.category ?? '' }));
        setAreas(inv.service_areas ?? []);
      }
    });
  }, [token]);

  if (invite === undefined) return <div className="page"><p className="muted">Checking your invitation…</p></div>;
  if (!invite) return <div className="page"><div className="card empty"><h3 className="serif">This invitation link isn’t valid</h3><p className="muted">Ask the person who invited you for a new link.</p></div></div>;
  if (invite.status === 'approved') return <div className="page"><div className="card empty"><h3 className="serif">You’re already approved</h3><Link className="btn" to="/dashboard">Open company home</Link></div></div>;
  if (done || invite.status === 'submitted' && !session) {
    return <div className="page"><div className="card empty"><h3 className="serif">Application received</h3><p className="muted">We’ll review your license and insurance and email you when you’re live.</p></div></div>;
  }
  if (!session) return (
    <div className="page narrow">
      <h1 className="page-title">You’re invited to MeritWorx</h1>
      <p className="lead">{invite.name}, sign in with your mobile number or email to start your application.</p>
      <Link className="btn btn-block" to={`/signin?next=${encodeURIComponent(`/apply/${token}`)}`}>Sign in to apply</Link>
    </div>
  );

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const toggleArea = (a: string) => setAreas(areas.includes(a) ? areas.filter((x) => x !== a) : [...areas, a]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (areas.length === 0) { setErr('Choose at least one service area.'); return; }
    if (!files.insurance) { setErr('Upload your insurance certificate. We can’t list a company without it.'); return; }
    setBusy(true); setErr('');
    try {
      const uid = session!.user.id;
      const logo = files.logo ? await uploadFile('logos', uid, files.logo, 'logo') : '';
      const license_file = files.license ? await uploadFile('documents', uid, files.license, 'license') : '';
      const insurance_file = await uploadFile('documents', uid, files.insurance, 'insurance');
      const { error } = await supabase.rpc('submit_application', {
        p_token: token, p: { ...f, service_areas: areas, logo, license_file, insurance_file },
      });
      if (error) throw error;
      setDone(true);
    } catch (e2) { setErr(errorText(e2)); }
    setBusy(false);
  }

  return (
    <div className="page">
      <h1 className="page-title">Apply to MeritWorx</h1>
      <p className="muted lead">This takes about five minutes. Have your license and insurance certificate ready.</p>
      <form className="form card" onSubmit={submit}>
        <h2 className="h2">Business</h2>
        <label>Business name<input required value={f.name} onChange={set('name')} /></label>
        <label>Owner’s name<input required value={f.owner_name} onChange={set('owner_name')} /></label>
        <label>Trade
          <select required value={f.category} onChange={set('category')}>
            <option value="">Choose one</option>
            {settings.categories.filter((c) => c.on).map((c) => <option key={c.name}>{c.name}</option>)}
          </select>
        </label>
        <fieldset>
          <legend>Service areas</legend>
          <div className="chips-wrap">
            {settings.areas.map((a) => (
              <button type="button" key={a} className={`chip-btn${areas.includes(a) ? ' is-on' : ''}`} aria-pressed={areas.includes(a)} onClick={() => toggleArea(a)}>{a}</button>
            ))}
          </div>
        </fieldset>
        <label>Business phone<input required type="tel" value={f.phone} onChange={set('phone')} /></label>
        <label>Business email<input required type="email" value={f.email} onChange={set('email')} /></label>
        <label>Website <span className="muted">(optional)</span><input value={f.website} onChange={set('website')} /></label>
        <label>About your business<textarea rows={4} value={f.about} onChange={set('about')} placeholder="What you do, how long you’ve done it, what homeowners can count on." /></label>
        <label>Logo <span className="muted">(optional)</span><input type="file" accept="image/*" onChange={(e) => setFiles({ ...files, logo: e.target.files?.[0] })} /></label>

        <h2 className="h2">License and insurance</h2>
        <p className="muted small">These stay private. Only the MeritWorx team can see them.</p>
        <label>License number<input value={f.license_number} onChange={set('license_number')} /></label>
        <label>License document<input type="file" accept="image/*,application/pdf" onChange={(e) => setFiles({ ...files, license: e.target.files?.[0] })} /></label>
        <label>Insurance certificate<input type="file" accept="image/*,application/pdf" onChange={(e) => setFiles({ ...files, insurance: e.target.files?.[0] })} /></label>
        <label>Insurance expires<input required type="date" value={f.insurance_expires} onChange={set('insurance_expires')} /></label>

        <h2 className="h2">Plan</h2>
        <p className="muted small">Listing is free until in-app payments go live.</p>
        {(Object.keys(PLAN_LABELS) as Plan[]).map((p) => (
          <label key={p} className="radio">
            <input type="radio" name="plan" checked={f.plan === p} onChange={() => setF({ ...f, plan: p, editors_guide_client: p !== 'app' || f.editors_guide_client })} />
            {PLAN_LABELS[p]}
          </label>
        ))}
        <label className="radio">
          <input type="checkbox" checked={f.editors_guide_client} onChange={(e) => setF({ ...f, editors_guide_client: e.target.checked })} />
          We already advertise with Editor’s Guide
        </label>

        {err && <p className="error">{err}</p>}
        <button className="btn btn-block" disabled={busy}>{busy ? 'Uploading…' : 'Send application'}</button>
      </form>
    </div>
  );
}

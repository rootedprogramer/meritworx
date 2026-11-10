import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase, errorText } from '../../lib/supabase';
import { useSettings } from '../../lib/settings';
import { LEVELS, PLAN_LABELS, type Applicant, type LevelId } from '../../lib/types';
import { Icon } from '../../components/Icon';

const today = () => new Date().toISOString().slice(0, 10);
const inviteLink = (t: string) => `${window.location.origin}/apply/${t}`;

function InviteForm({ onDone }: { onDone: () => void }) {
  const { settings } = useSettings();
  const [f, setF] = useState({ name: '', owner_name: '', email: '', category: '', area: '', referred_by: '' });
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr('');
    const { data, error } = await supabase.from('applicants').insert({
      name: f.name, owner_name: f.owner_name, email: f.email, category: f.category || null,
      service_areas: f.area ? [f.area] : [], referred_by: f.referred_by || null, invited: true,
    }).select('invite_token').single();
    if (error) { setErr(errorText(error)); return; }
    setLink(inviteLink((data as { invite_token: string }).invite_token));
    setF({ name: '', owner_name: '', email: '', category: '', area: '', referred_by: '' });
    onDone();
  }

  return (
    <form className="form card" onSubmit={submit}>
      <h2 className="h2">Invite a company</h2>
      <label>Company<input required value={f.name} onChange={set('name')} /></label>
      <label>Owner<input value={f.owner_name} onChange={set('owner_name')} /></label>
      <label>Email<input type="email" value={f.email} onChange={set('email')} /></label>
      <div className="two-col">
        <label>Category
          <select value={f.category} onChange={set('category')}>
            <option value="">Choose</option>
            {settings.categories.map((c) => <option key={c.name}>{c.name}</option>)}
          </select>
        </label>
        <label>Main area
          <select value={f.area} onChange={set('area')}>
            <option value="">Choose</option>
            {settings.areas.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
      </div>
      <label>Referred by<input value={f.referred_by} onChange={set('referred_by')} /></label>
      {err && <p className="error">{err}</p>}
      <button className="btn btn-block">Create invite link</button>
      {link && <CopyLink link={link} />}
    </form>
  );
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="copy-link">
      <code>{link}</code>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }}>
        <Icon name={copied ? 'check' : 'copy'} size={16} /> {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function ApplicantCard({ a, onChange }: { a: Applicant; onChange: () => void }) {
  const { settings } = useSettings();
  const rule = settings.starting_level_rule;
  const [level, setLevel] = useState<LevelId>(a.editors_guide_client ? rule.editors_guide_client : rule.default);
  const [rating, setRating] = useState(a.rating?.toString() ?? '');
  const [count, setCount] = useState(a.review_count?.toString() ?? '');
  const [notes, setNotes] = useState(a.admin_notes ?? '');
  const [err, setErr] = useState('');
  const insuranceOk = a.insurance_on_file && !!a.insurance_file && !!a.insurance_expires && a.insurance_expires >= today();

  async function update(patch: Partial<Applicant>) {
    setErr('');
    const { error } = await supabase.from('applicants').update(patch).eq('id', a.id);
    if (error) setErr(errorText(error)); else onChange();
  }
  async function openDoc(path: string | null) {
    if (!path) return;
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 300);
    if (error) setErr(errorText(error)); else window.open(data.signedUrl, '_blank', 'noopener');
  }
  async function approve() {
    setErr('');
    const { error } = await supabase.rpc('approve_applicant', { p_id: a.id, p_level: level });
    if (error) setErr(errorText(error)); else onChange();
  }

  return (
    <article className="card section applicant">
      <div className="row-between">
        <div>
          <h3 className="serif">{a.name}</h3>
          <p className="muted small">{a.owner_name} · {a.category} · {a.service_areas.join(', ')}</p>
        </div>
        <span className="pill pill-gold">{a.status === 'submitted' ? 'Applied' : 'Invited'}</span>
      </div>

      {a.status === 'invited' ? (
        <>
          <p className="muted small">Waiting for them to apply.{a.referred_by ? ` Referred by ${a.referred_by}.` : ''}</p>
          <CopyLink link={inviteLink(a.invite_token)} />
        </>
      ) : (
        <>
          <ul className="checks">
            <li className={rating && count ? 'ok' : ''}>
              <span>Rating and review count ({a.rating_source})</span>
              <span className="inline-inputs">
                <input aria-label="Rating" inputMode="decimal" placeholder="4.8" value={rating} onChange={(e) => setRating(e.target.value)} />
                <input aria-label="Review count" inputMode="numeric" placeholder="120" value={count} onChange={(e) => setCount(e.target.value)} />
                <button className="btn btn-ghost btn-sm" onClick={() => update({ rating: rating ? Number(rating) : null, review_count: count ? Number(count) : null })}>Save</button>
              </span>
            </li>
            <li className={a.license_on_file ? 'ok' : ''}>
              <span>License on file {a.license_number ? `(#${a.license_number})` : ''}</span>
              <span className="inline-inputs">
                {a.license_file && <button className="link-btn" onClick={() => openDoc(a.license_file)}>View</button>}
                <button className="btn btn-ghost btn-sm" onClick={() => update({ license_on_file: !a.license_on_file })}>{a.license_on_file ? 'Unmark' : 'Mark checked'}</button>
              </span>
            </li>
            <li className={insuranceOk ? 'ok' : ''}>
              <span>Insurance certificate {a.insurance_expires ? `(expires ${a.insurance_expires})` : '(no expiry date)'}</span>
              <span className="inline-inputs">
                {a.insurance_file && <button className="link-btn" onClick={() => openDoc(a.insurance_file)}>View</button>}
                {!a.insurance_on_file && !a.certificate_requested && <button className="btn btn-ghost btn-sm" onClick={() => update({ certificate_requested: true })}>Ask for certificate</button>}
                {!a.insurance_on_file && <button className="btn btn-ghost btn-sm" onClick={() => update({ insurance_on_file: true, certificate_requested: false })}>Mark received</button>}
              </span>
            </li>
          </ul>
          {a.certificate_requested && <p className="notice small">Certificate requested. Email {a.email || 'the company'} and mark it received when it arrives.</p>}
          <p className="muted small">Plan: {PLAN_LABELS[a.plan]}{a.editors_guide_client ? ' · Editor’s Guide client' : ''} · {a.phone} · {a.email}</p>
          <label className="small">Notes<textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (a.admin_notes ?? '') && update({ admin_notes: notes })} /></label>
          <div className="row-between wrap">
            <label className="inline-label">Starting level
              <select value={level} onChange={(e) => setLevel(e.target.value as LevelId)}>
                {LEVELS.map((l) => <option key={l} value={l}>{settings.level_names[l]}</option>)}
              </select>
            </label>
            <div className="inline-inputs">
              <button className="btn btn-ghost btn-sm" onClick={() => confirm(`Decline ${a.name}?`) && update({ status: 'declined' })}>Decline</button>
              <button className="btn btn-sm" disabled={!insuranceOk} onClick={approve}>Approve and go live</button>
            </div>
          </div>
          {!insuranceOk && <p className="muted small">Approval unlocks once a current insurance certificate is marked received.</p>}
        </>
      )}
      {err && <p className="error">{err}</p>}
    </article>
  );
}

export default function Approvals() {
  const [list, setList] = useState<Applicant[] | null>(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from('applicants').select('*').in('status', ['invited', 'submitted']).order('created_at', { ascending: false });
    setList((data as Applicant[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const submitted = (list ?? []).filter((a) => a.status === 'submitted');
  const invited = (list ?? []).filter((a) => a.status === 'invited');

  return (
    <div className="page wide">
      <h1 className="page-title">Approvals</h1>
      <div className="admin-grid">
        <div className="stack">
          <h2 className="h2">Ready to review <span className="count">{submitted.length}</span></h2>
          {list === null ? <p className="muted">Loading…</p> : submitted.length === 0 ? <p className="muted">No applications waiting.</p> :
            submitted.map((a) => <ApplicantCard key={a.id} a={a} onChange={load} />)}
          <h2 className="h2">Invited <span className="count">{invited.length}</span></h2>
          {invited.map((a) => <ApplicantCard key={a.id} a={a} onChange={load} />)}
        </div>
        <InviteForm onDone={load} />
      </div>
    </div>
  );
}

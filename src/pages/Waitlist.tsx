import { useState, type FormEvent } from 'react';
import { supabase, errorText } from '../lib/supabase';
import { useSettings } from '../lib/settings';

export default function Waitlist({ kind = 'homeowner' }: { kind?: 'homeowner' | 'company' }) {
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', phone: '', neighborhood: '', trade: '', business_name: '' });
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.email && !form.phone) { setErr('Add an email or a mobile number so we can reach you.'); return; }
    setBusy(true); setErr('');
    const { error } = await supabase.from('waitlist').insert({ ...form, kind });
    setBusy(false);
    if (error) setErr(errorText(error)); else setDone(true);
  }

  if (done) return (
    <div className={kind === 'homeowner' ? 'page' : ''}>
      <div className="card empty">
        <h3 className="serif">You’re on the list</h3>
        <p className="muted">{kind === 'homeowner' ? 'We’ll let you know when booking and paying in the app opens.' : 'We’ll be in touch about an invitation.'}</p>
      </div>
    </div>
  );

  const body = (
    <form className="form card" onSubmit={submit}>
      {kind === 'company' && <label>Business name<input required value={form.business_name} onChange={set('business_name')} /></label>}
      <label>{kind === 'company' ? 'Your name' : 'Name'}<input required value={form.name} onChange={set('name')} autoComplete="name" /></label>
      <label>Email<input type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
      <label>Mobile<input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
      {kind === 'homeowner' && (
        <label>Neighborhood
          <select value={form.neighborhood} onChange={set('neighborhood')}>
            <option value="">Choose one</option>
            {settings.areas.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
      )}
      <label>{kind === 'company' ? 'Your trade' : 'Trade you need'}
        <select value={form.trade} onChange={set('trade')}>
          <option value="">Choose one</option>
          {settings.categories.filter((c) => c.on).map((c) => <option key={c.name}>{c.name}</option>)}
          <option>Other</option>
        </select>
      </label>
      {err && <p className="error">{err}</p>}
      <button className="btn btn-block" disabled={busy}>{busy ? 'Saving…' : kind === 'company' ? 'Ask for an invitation' : 'Join the waitlist'}</button>
    </form>
  );

  if (kind === 'company') return body;
  return (
    <div className="page">
      <h1 className="page-title">Get early access</h1>
      <p className="muted lead">Be first to request quotes and pay Birmingham’s checked pros from your phone.</p>
      {body}
    </div>
  );
}

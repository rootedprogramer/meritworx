import { useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { supabase, errorText } from '../lib/supabase';
import { useAuth } from '../lib/auth';

function toE164(raw: string) {
  const d = raw.replace(/\D/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  return raw.startsWith('+') ? `+${d}` : '';
}

export default function SignIn() {
  const [params] = useSearchParams();
  const next = params.get('next') || '';
  const { session, profile } = useAuth();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (session && profile) {
    const home = next || (profile.role === 'admin' ? '/admin' : profile.role === 'company' ? '/dashboard' : '/');
    return <Navigate to={home} replace />;
  }

  async function send(e: FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    let error;
    if (mode === 'phone') {
      const phone = toE164(contact);
      if (!phone) { setBusy(false); setErr('Enter a 10-digit US mobile number.'); return; }
      ({ error } = await supabase.auth.signInWithOtp({ phone }));
    } else {
      ({ error } = await supabase.auth.signInWithOtp({ email: contact.trim(), options: { shouldCreateUser: true } }));
    }
    setBusy(false);
    if (error) setErr(errorText(error)); else setSent(true);
  }

  async function verify(e: FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    const { error } = mode === 'phone'
      ? await supabase.auth.verifyOtp({ phone: toE164(contact), token: code.trim(), type: 'sms' })
      : await supabase.auth.verifyOtp({ email: contact.trim(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) setErr('That code didn’t work. Check it, or send a new one.');
  }

  return (
    <div className="page narrow">
      <h1 className="page-title">Sign in</h1>
      <p className="muted lead">No password. We’ll send you a 6-digit code.</p>
      {!sent ? (
        <form className="form card" onSubmit={send}>
          <div className="segmented" role="group" aria-label="Sign in with">
            <button type="button" className={mode === 'phone' ? 'is-on' : ''} onClick={() => { setMode('phone'); setContact(''); }}>Text me</button>
            <button type="button" className={mode === 'email' ? 'is-on' : ''} onClick={() => { setMode('email'); setContact(''); }}>Email me</button>
          </div>
          <label>{mode === 'phone' ? 'Mobile number' : 'Email'}
            <input required type={mode === 'phone' ? 'tel' : 'email'} autoComplete={mode === 'phone' ? 'tel' : 'email'}
              value={contact} onChange={(e) => setContact(e.target.value)} placeholder={mode === 'phone' ? '(205) 555-0123' : 'you@company.com'} />
          </label>
          {err && <p className="error">{err}</p>}
          <button className="btn btn-block" disabled={busy}>{busy ? 'Sending…' : 'Send code'}</button>
        </form>
      ) : (
        <form className="form card" onSubmit={verify}>
          <p>We sent a code to <strong>{contact}</strong>.</p>
          <label>6-digit code
            <input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          {err && <p className="error">{err}</p>}
          <button className="btn btn-block" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
          <button type="button" className="link-btn" onClick={() => { setSent(false); setCode(''); }}>Use a different number or email</button>
        </form>
      )}
    </div>
  );
}

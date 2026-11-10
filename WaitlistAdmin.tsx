import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Entry { id: string; kind: string; name: string; email: string | null; phone: string | null; neighborhood: string | null; trade: string | null; business_name: string | null; created_at: string }

export default function WaitlistAdmin() {
  const [list, setList] = useState<Entry[] | null>(null);
  const [kind, setKind] = useState<'homeowner' | 'company'>('homeowner');
  useEffect(() => {
    supabase.from('waitlist').select('*').order('created_at', { ascending: false }).then(({ data }) => setList((data as Entry[]) ?? []));
  }, []);
  const shown = (list ?? []).filter((e) => e.kind === kind);

  function downloadCsv() {
    const cols: (keyof Entry)[] = ['kind', 'business_name', 'name', 'email', 'phone', 'neighborhood', 'trade', 'created_at'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...(list ?? []).map((e) => cols.map((c) => esc(e[c])).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'meritworx-waitlist.csv';
    a.click();
  }

  return (
    <div className="page wide">
      <h1 className="page-title">Waitlist</h1>
      <div className="row-between">
        <div className="segmented">
          <button className={kind === 'homeowner' ? 'is-on' : ''} onClick={() => setKind('homeowner')}>Homeowners ({(list ?? []).filter((e) => e.kind === 'homeowner').length})</button>
          <button className={kind === 'company' ? 'is-on' : ''} onClick={() => setKind('company')}>Companies ({(list ?? []).filter((e) => e.kind === 'company').length})</button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={downloadCsv}>Download CSV</button>
      </div>
      <div className="table-wrap card">
        <table>
          <thead><tr>{kind === 'company' && <th>Business</th>}<th>Name</th><th>Email</th><th>Phone</th>{kind === 'homeowner' && <th>Area</th>}<th>Trade</th><th>Joined</th></tr></thead>
          <tbody>
            {shown.map((e) => (
              <tr key={e.id}>
                {kind === 'company' && <td>{e.business_name}</td>}
                <td>{e.name}</td><td>{e.email}</td><td>{e.phone}</td>
                {kind === 'homeowner' && <td>{e.neighborhood}</td>}
                <td>{e.trade}</td><td>{new Date(e.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={7} className="muted">No one yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

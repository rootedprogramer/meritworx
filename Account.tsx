import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Account() {
  const { session, profile, signOut, loading } = useAuth();
  if (loading) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!session) return <Navigate to="/signin" replace />;
  return (
    <div className="page narrow">
      <h1 className="page-title">Your account</h1>
      <div className="card section">
        <p>{profile?.phone || profile?.email}</p>
        <div className="stack-sm">
          {profile?.role === 'admin' && <Link className="btn" to="/admin">Open admin</Link>}
          {profile?.role === 'company' && <Link className="btn" to="/dashboard">Open company home</Link>}
          <button className="btn btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

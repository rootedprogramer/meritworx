import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { Role } from '../lib/types';

// Hides screens from the wrong people. The real protection is row-level security on the server.
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading || (session && !profile)) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!session) return <Navigate to={`/signin?next=${encodeURIComponent(pathname)}`} replace />;
  if (profile?.role !== role && !(role === 'company' && profile?.role === 'admin')) {
    return <div className="page"><div className="card empty"><h3 className="serif">This area isn’t available to your account</h3></div></div>;
  }
  return <>{children}</>;
}

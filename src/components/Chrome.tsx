import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Icon } from './Icon';

export function TopBar() {
  const { profile, session } = useAuth();
  const home = profile?.role === 'admin' ? '/admin' : profile?.role === 'company' ? '/dashboard' : '/account';
  const who = profile?.name?.split(' ')[0] || (profile?.role === 'admin' ? 'Admin' : profile?.role === 'company' ? 'Company' : 'Account');
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-name">MeritWorx</span>
        <span className="brand-tag">Where Reputation Meets Opportunity</span>
      </Link>
      {session ? <Link to={home} className="pill who">{who}</Link> : <Link to="/signin" className="pill who">Sign in</Link>}
    </header>
  );
}

type Tab = { to: string; label: string; icon: string; end?: boolean };
const homeownerTabs: Tab[] = [
  { to: '/', label: 'Browse', icon: 'browse', end: true },
  { to: '/specials', label: 'Specials', icon: 'specials' },
  { to: '/requests', label: 'Requests', icon: 'requests' },
  { to: '/payments', label: 'Payments', icon: 'payments' },
];
const companyTabs: Tab[] = [
  { to: '/dashboard', label: 'Home', icon: 'home', end: true },
  { to: '/dashboard/requests', label: 'Requests', icon: 'requests' },
  { to: '/dashboard/get-paid', label: 'Get paid', icon: 'getpaid' },
  { to: '/dashboard/profile', label: 'Profile', icon: 'profile' },
];
const adminTabs: Tab[] = [
  { to: '/admin', label: 'Approvals', icon: 'approvals', end: true },
  { to: '/admin/companies', label: 'Companies', icon: 'companies' },
  { to: '/admin/waitlist', label: 'Waitlist', icon: 'waitlist' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export function TabBar({ badges = {} }: { badges?: Record<string, number> }) {
  const { pathname } = useLocation();
  const tabs = pathname.startsWith('/admin') ? adminTabs : pathname.startsWith('/dashboard') ? companyTabs : homeownerTabs;
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tab${isActive ? ' is-active' : ''}`}>
          <span className="tab-icon">
            <Icon name={t.icon} />
            {badges[t.to] ? <span className="badge">{badges[t.to]}</span> : null}
          </span>
          <span className="tab-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

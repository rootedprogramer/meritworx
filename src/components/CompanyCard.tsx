import { Link } from 'react-router-dom';
import type { PublicCompany } from '../lib/types';
import { logoUrl } from '../lib/supabase';
import { LevelChip, levelNumber } from './Level';

export function initials(name: string) {
  return name.replace(/^Sample\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function CompanyTile({ c, size = 52 }: { c: Pick<PublicCompany, 'name' | 'logo' | 'level'>; size?: number }) {
  const src = logoUrl(c.logo);
  return (
    <div className={`tile tint-${levelNumber(c.level)}`} style={{ width: size, height: size }}>
      {src ? <img src={src} alt="" /> : <span>{initials(c.name)}</span>}
    </div>
  );
}

export function CompanyCard({ c }: { c: PublicCompany }) {
  return (
    <Link to={`/company/${c.id}`} className="card company-card">
      <CompanyTile c={c} />
      <div className="company-card-main">
        <h3 className="serif">{c.name}</h3>
        <p className="muted small">{c.category} · {c.service_areas.slice(0, 3).join(', ')}{c.service_areas.length > 3 ? ` +${c.service_areas.length - 3}` : ''}</p>
        <div className="company-card-meta">
          <LevelChip level={c.level} />
          <span className="muted small">No reviews yet</span>
        </div>
      </div>
    </Link>
  );
}

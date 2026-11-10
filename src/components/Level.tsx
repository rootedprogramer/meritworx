import { LEVELS, type LevelId } from '../lib/types';
import { useSettings } from '../lib/settings';

export const levelNumber = (l: LevelId) => LEVELS.indexOf(l) + 1;

// Placeholder merit seal: a ring with one to five marks. Swap for final badge art later.
export function LevelSeal({ level, size = 18 }: { level: LevelId; size?: number }) {
  const n = levelNumber(level);
  const marks = Array.from({ length: n }, (_, i) => {
    const angle = (-90 + (i - (n - 1) / 2) * 34) * (Math.PI / 180);
    return { x: 12 + Math.cos(angle) * 6.2, y: 12 + Math.sin(angle) * 6.2 };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="seal">
      <circle cx="12" cy="12" r="10.5" fill="var(--seal)" />
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="var(--seal-gold)" strokeWidth="1.2" />
      {marks.map((m, i) => <circle key={i} cx={m.x} cy={m.y} r="1.45" fill="var(--cream)" />)}
      <path d="M8.6 14.2 11 16.4l4.4-4.6" fill="none" stroke="var(--cream)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LevelChip({ level }: { level: LevelId }) {
  const { settings } = useSettings();
  return (
    <span className="chip level-chip">
      <LevelSeal level={level} size={16} />
      {settings.level_names[level]}
    </span>
  );
}

export function LevelsList({ current }: { current?: LevelId }) {
  const { settings } = useSettings();
  return (
    <ol className="levels-list">
      {LEVELS.map((l) => (
        <li key={l} className={l === current ? 'is-current' : undefined}>
          <LevelSeal level={l} size={34} />
          <div>
            <strong>{settings.level_names[l]}</strong>
            <p>{settings.level_descriptions[l]}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

import { useEffect, useState } from 'react';
import { supabase, errorText } from '../../lib/supabase';
import { useSettings } from '../../lib/settings';
import { LEVELS, type LevelId, type Settings } from '../../lib/types';

export default function SettingsAdmin() {
  const { settings, reload } = useSettings();
  const [s, setS] = useState<Settings>(settings);
  const [newCat, setNewCat] = useState('');
  const [newArea, setNewArea] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { setS(settings); setRulesText(JSON.stringify(settings.level_rules, null, 2)); }, [settings]);

  async function save() {
    setErr(''); setMsg('');
    let level_rules;
    try { level_rules = rulesText.trim() ? JSON.parse(rulesText) : {}; } catch { setErr('Level rules must be valid JSON.'); return; }
    const { error } = await supabase.from('settings').update({
      level_names: s.level_names, level_descriptions: s.level_descriptions, categories: s.categories, areas: s.areas,
      auto_charge_hours: s.auto_charge_hours, reminder_days: s.reminder_days, starting_level_rule: s.starting_level_rule, level_rules,
    }).eq('id', 1);
    if (error) setErr(errorText(error)); else { setMsg('Settings saved. Changes apply app-wide.'); reload(); }
  }

  const setLevelField = (field: 'level_names' | 'level_descriptions', l: LevelId, v: string) => setS({ ...s, [field]: { ...s[field], [l]: v } });

  return (
    <div className="page wide">
      <h1 className="page-title">Settings</h1>
      <div className="card-grid">
        <section className="card section form">
          <h2 className="h2">Levels</h2>
          {LEVELS.map((l) => (
            <div key={l} className="level-edit">
              <input aria-label={`${l} name`} value={s.level_names[l]} onChange={(e) => setLevelField('level_names', l, e.target.value)} />
              <input aria-label={`${l} meaning`} value={s.level_descriptions[l]} onChange={(e) => setLevelField('level_descriptions', l, e.target.value)} />
            </div>
          ))}
          <div className="two-col">
            <label>New companies start at
              <select value={s.starting_level_rule.default} onChange={(e) => setS({ ...s, starting_level_rule: { ...s.starting_level_rule, default: e.target.value as LevelId } })}>
                {LEVELS.map((l) => <option key={l} value={l}>{s.level_names[l]}</option>)}
              </select>
            </label>
            <label>Editor’s Guide clients start at
              <select value={s.starting_level_rule.editors_guide_client} onChange={(e) => setS({ ...s, starting_level_rule: { ...s.starting_level_rule, editors_guide_client: e.target.value as LevelId } })}>
                {LEVELS.map((l) => <option key={l} value={l}>{s.level_names[l]}</option>)}
              </select>
            </label>
          </div>
          <label>Level rules (factors, weights, minimums, review window), JSON
            <textarea rows={6} className="mono" value={rulesText} onChange={(e) => setRulesText(e.target.value)} placeholder='{"trusted": {"min_reviews": 5, "min_rating": 4.3, "window_days": 365}}' />
          </label>
        </section>

        <section className="card section form">
          <h2 className="h2">Categories</h2>
          {s.categories.map((c, i) => (
            <label key={c.name} className="radio">
              <input type="checkbox" checked={c.on} onChange={(e) => setS({ ...s, categories: s.categories.map((x, j) => j === i ? { ...x, on: e.target.checked } : x) })} />
              {c.name}
            </label>
          ))}
          <div className="inline-inputs">
            <input placeholder="Add a category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button className="btn btn-ghost btn-sm" onClick={() => { if (newCat.trim()) { setS({ ...s, categories: [...s.categories, { name: newCat.trim(), on: true }] }); setNewCat(''); } }}>Add</button>
          </div>

          <h2 className="h2">Service areas</h2>
          <div className="chips-wrap">
            {s.areas.map((a) => <button key={a} className="chip-btn is-on" title="Remove" onClick={() => setS({ ...s, areas: s.areas.filter((x) => x !== a) })}>{a} ×</button>)}
          </div>
          <div className="inline-inputs">
            <input placeholder="Add an area" value={newArea} onChange={(e) => setNewArea(e.target.value)} />
            <button className="btn btn-ghost btn-sm" onClick={() => { if (newArea.trim()) { setS({ ...s, areas: [...s.areas, newArea.trim()] }); setNewArea(''); } }}>Add</button>
          </div>

          <h2 className="h2">Payments (used in a later phase)</h2>
          <div className="two-col">
            <label>Hours before auto-charge<input type="number" min={1} value={s.auto_charge_hours} onChange={(e) => setS({ ...s, auto_charge_hours: Number(e.target.value) })} /></label>
            <label>Reminder days<input value={s.reminder_days.join(', ')} onChange={(e) => setS({ ...s, reminder_days: e.target.value.split(',').map((x) => Number(x.trim())).filter(Boolean) })} /></label>
          </div>
        </section>
      </div>
      {err && <p className="error">{err}</p>}
      {msg && <p className="success">{msg}</p>}
      <button className="btn" onClick={save}>Save settings</button>
    </div>
  );
}

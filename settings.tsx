import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { DEFAULT_SETTINGS, type Settings } from './types';

const Ctx = createContext<{ settings: Settings; reload: () => Promise<void> }>({
  settings: DEFAULT_SETTINGS, reload: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const reload = useCallback(async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
    if (data) setSettings({ ...DEFAULT_SETTINGS, ...(data as Partial<Settings>) });
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return <Ctx.Provider value={{ settings, reload }}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);

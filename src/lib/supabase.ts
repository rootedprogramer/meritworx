import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const configured = Boolean(url && key);
export const supabase = createClient(url || 'http://localhost:54321', key || 'not-configured');

export function errorText(e: unknown): string {
  if (!e) return 'Something went wrong. Try again.';
  if (typeof e === 'string') return e;
  const m = (e as { message?: string }).message;
  return m || 'Something went wrong. Try again.';
}

export function logoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return supabase.storage.from('logos').getPublicUrl(path).data.publicUrl;
}

export async function uploadFile(bucket: 'logos' | 'documents', userId: string, file: File, label: string) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${userId}/${label}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

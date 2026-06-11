import { createClient } from '@supabase/supabase-js';

let supabase: ReturnType<typeof createClient> | null = null;

export function initSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  if (!supabase) supabase = createClient(url, key);
  return supabase;
}

export function getSupabase() {
  if (!supabase) return initSupabase();
  return supabase;
}

export type NewsItem = {
  id: string;
  headline: string;
  summary: string | null;
  url: string;
  source: string;
  category: 'business_india' | 'business_global' | 'events';
  scraped_at: string;
  published_at: string | null;
  metrics: Record<string, string> | null;
  created_at: string;
};

export async function getNewsByCategory(category: string, limit: number = 10) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('news')
    .select('*')
    .eq('category', category)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as NewsItem[];
}

export async function searchNews(query: string, limit: number = 20) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('news')
    .select('*')
    .or(`headline.ilike.%${query}%,summary.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as NewsItem[];
}

export async function insertNews(newsItems: Omit<NewsItem, 'id' | 'created_at'>[]) {
  const sb = getSupabase();
  const { data, error } = await sb.from('news').insert(newsItems).select();
  if (error) throw error;
  return data as NewsItem[];
}

export async function checkIfNewsExists(url: string) {
  const sb = getSupabase();
  const { data, error } = await sb.from('news').select('id').eq('url', url).single();
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function getLatestNews(limit: number = 5) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as NewsItem[];
}

export async function getNewsStats() {
  const sb = getSupabase();
  const { count: indiaCount } = await sb
    .from('news')
    .select('*', { count: 'exact' })
    .eq('category', 'business_india');
  const { count: globalCount } = await sb
    .from('news')
    .select('*', { count: 'exact' })
    .eq('category', 'business_global');
  const { count: eventsCount } = await sb
    .from('news')
    .select('*', { count: 'exact' })
    .eq('category', 'events');
  return {
    business_india: indiaCount || 0,
    business_global: globalCount || 0,
    events: eventsCount || 0,
    total: (indiaCount || 0) + (globalCount || 0) + (eventsCount || 0),
  };
}

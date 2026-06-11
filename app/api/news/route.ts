import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const category = p.get('category');
    const limit = Math.min(parseInt(p.get('limit') || '20'), 100);
    const from = p.get('from');   // ISO date string e.g. "2026-06-13"
    const to = p.get('to');       // ISO date string e.g. "2026-06-13"

    const sb = getSupabase();
    let query = sb.from('news').select('*').order('published_at', { ascending: false }).limit(limit);

    if (category) query = query.eq('category', category);
    if (from)     query = query.gte('published_at', new Date(from).toISOString());
    if (to) {
      // Include the full "to" day by going to end of day
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('published_at', toDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

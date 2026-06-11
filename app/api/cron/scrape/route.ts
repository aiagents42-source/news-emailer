import { NextRequest, NextResponse } from 'next/server';
import { runScraper } from '@/lib/scraper';
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({}, {status: 401});
  try { const r = await runScraper(); return NextResponse.json(r); } 
  catch (e) { return NextResponse.json({error: String(e)}, {status: 500}); }
}

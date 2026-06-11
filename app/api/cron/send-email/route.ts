import { NextRequest, NextResponse } from 'next/server';
import { sendAllEmails } from '@/lib/emailer';
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({}, {status: 401});
  try { const r = await sendAllEmails(); return NextResponse.json({success: r}); } 
  catch (e) { return NextResponse.json({error: String(e)}, {status: 500}); }
}

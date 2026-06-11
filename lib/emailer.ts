import nodemailer from 'nodemailer';
import { getSupabase } from './supabase';
import { format } from 'date-fns';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

function articleCard(n: any, color: string) {
  return `
  <div style="background:#ffffff;border-radius:10px;padding:20px 24px;margin-bottom:16px;border-left:4px solid ${color};box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h3 style="margin:0 0 8px 0;font-size:17px;font-weight:700;line-height:1.4;color:#1a1a2e;">
      <a href="${n.url}" style="color:#1a1a2e;text-decoration:none;">${n.headline}</a>
    </h3>
    <p style="margin:0 0 12px 0;font-size:13px;color:#888;">
      ${n.source || 'Unknown'} &nbsp;•&nbsp; ${n.published_at ? format(new Date(n.published_at), 'MMM d, yyyy') : 'Today'}
    </p>
    ${n.summary ? `<p style="margin:0 0 14px 0;font-size:15px;color:#444;line-height:1.6;">${n.summary}</p>` : ''}
    <a href="${n.url}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:600;">Read More →</a>
  </div>`;
}

function sectionHeader(emoji: string, title: string, color: string) {
  return `
  <div style="margin:30px 0 16px 0;">
    <div style="display:inline-block;background:${color};color:#fff;padding:8px 20px;border-radius:20px;font-size:14px;font-weight:700;letter-spacing:0.5px;">
      ${emoji} ${title}
    </div>
  </div>`;
}

export async function sendAllEmails() {
  try {
    const sb = getSupabase();
    // Fetch today's news only (last 24 hours)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: indiaNews } = await sb.from('news').select('*').eq('category', 'business_india').gte('scraped_at', since).order('published_at', { ascending: false }).limit(7) as { data: any[] };
    const { data: globalNews } = await sb.from('news').select('*').eq('category', 'business_global').gte('scraped_at', since).order('published_at', { ascending: false }).limit(5) as { data: any[] };
    const { data: eventsNews } = await sb.from('news').select('*').eq('category', 'events').gte('scraped_at', since).order('published_at', { ascending: false }).limit(5) as { data: any[] };

    const today = format(new Date(), 'EEEE, MMMM d yyyy');

    const indiaHtml = (indiaNews || []).map(n => articleCard(n, '#2563eb')).join('');
    const globalHtml = (globalNews || []).map(n => articleCard(n, '#7c3aed')).join('');
    const eventsHtml = (eventsNews || []).map(n => articleCard(n, '#db2777')).join('');

    const hasBusinessNews = indiaHtml || globalHtml;
    const hasEventsNews = !!eventsHtml;

    const emailHtml = (bodyContent: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:14px;padding:32px 28px;margin-bottom:24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">📰</div>
      <h1 style="margin:0 0 6px 0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Daily News Brief</h1>
      <p style="margin:0;color:#a0aec0;font-size:14px;">${today}</p>
    </div>

    <!-- Content -->
    <div style="background:#f7f9fc;border-radius:14px;padding:24px;">
      ${bodyContent}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px 0 8px 0;">
      <p style="margin:0 0 8px 0;color:#888;font-size:13px;">View full archive & search all news</p>
      <a href="https://news-emailer-silk.vercel.app" style="display:inline-block;background:#1a1a2e;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;">📊 Open Dashboard</a>
      <p style="margin:16px 0 0 0;color:#bbb;font-size:12px;">You're receiving this because you set up the News Emailer system.</p>
    </div>

  </div>
</body>
</html>`;

    // Send Business Email
    if (hasBusinessNews) {
      const businessBody = `
        ${indiaHtml ? sectionHeader('🇮🇳', 'India Business', '#2563eb') + indiaHtml : ''}
        ${globalHtml ? sectionHeader('🌍', 'Global Business', '#7c3aed') + globalHtml : ''}
      `;
      await transporter.sendMail({
        from: `"News Brief" <${process.env.GMAIL_USER}>`,
        to: process.env.EMAIL_RECIPIENT,
        subject: `📊 Business News — ${format(new Date(), 'MMM d, yyyy')}`,
        html: emailHtml(businessBody),
      });
      console.log('✓ Business email sent');
    }

    // Send Events Email
    if (hasEventsNews) {
      const eventsBody = sectionHeader('🎉', 'Events Industry', '#db2777') + eventsHtml;
      await transporter.sendMail({
        from: `"News Brief" <${process.env.GMAIL_USER}>`,
        to: process.env.EMAIL_RECIPIENT,
        subject: `🎉 Events Industry News — ${format(new Date(), 'MMM d, yyyy')}`,
        html: emailHtml(eventsBody),
      });
      console.log('✓ Events email sent');
    }

    return true;
  } catch (err) {
    console.error('Email error:', err);
    return false;
  }
}

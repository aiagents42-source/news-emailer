import nodemailer from 'nodemailer';
import { getSupabase } from './supabase';
import { format } from 'date-fns';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

export async function sendAllEmails() {
  try {
    const sb = getSupabase();
    const { data: business } = await sb
      .from('news')
      .select('*')
      .in('category', ['business_india', 'business_global'])
      .order('published_at', { ascending: false })
      .limit(10) as { data: any[] };

    const { data: events } = await sb
      .from('news')
      .select('*')
      .eq('category', 'events')
      .order('published_at', { ascending: false })
      .limit(5) as { data: any[] };

    if (business?.length || events?.length) {
      const businessHtml = (business || [])
        .map((n) => `<li><strong>${n.headline}</strong><br/>${n.summary || ''}<br/><a href="${n.url}">Read more</a></li>`)
        .join('');
      const eventsHtml = (events || [])
        .map((n) => `<li><strong>${n.headline}</strong><br/>${n.summary || ''}<br/><a href="${n.url}">Read more</a></li>`)
        .join('');

      if (businessHtml) {
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: process.env.EMAIL_RECIPIENT,
          subject: `📊 Business News - ${format(new Date(), 'MMM d, yyyy')}`,
          html: `<h2>Top Business News</h2><ul>${businessHtml}</ul>`,
        });
      }

      if (eventsHtml) {
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: process.env.EMAIL_RECIPIENT,
          subject: `🎉 Events Industry News - ${format(new Date(), 'MMM d, yyyy')}`,
          html: `<h2>Events Industry News</h2><ul>${eventsHtml}</ul>`,
        });
      }
    }

    return true;
  } catch (err) {
    console.error('Email error:', err);
    return false;
  }
}

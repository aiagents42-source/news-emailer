# News Emailer Setup Guide

## ✅ What's Already Built

### Backend API Endpoints (Working ✓)
- **GET /api/stats** — Returns news counts per category
- **GET /api/news** — Fetches news with category/limit filtering
- **GET /api/search** — Full-text search on headlines
- **GET /api/cron/scrape** — Triggers web scraper (Bearer token required)
- **GET /api/cron/send-email** — Triggers email sender (Bearer token required)

### Frontend Pages (Working ✓)
- **/** — Dashboard with news statistics
- **/business** — Business news (India + Global)
- **/events** — Events industry news
- **/search** — Search functionality

### Core Libraries (Ready ✓)
- **lib/supabase.ts** — Database client & queries
- **lib/scraper.ts** — Web scraping orchestrator
- **lib/emailer.ts** — Email formatter & sender
- **lib/sources.ts** — News source configurations

---

## 📋 Next Steps (5 min setup)

### 1. Fill in .env.local
Edit ~/Desktop/news-emailer/.env.local:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Gmail SMTP
GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Security
CRON_SECRET=news-emailer-secure-key
```

**Get Supabase credentials:**
1. Go to https://supabase.com → Create project
2. Copy URL from Settings → API
3. Create table with this SQL:
```sql
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  summary TEXT,
  url TEXT UNIQUE,
  source VARCHAR(50),
  category VARCHAR(50),
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_category ON news(category);
```

**Get Gmail credentials:**
1. Enable 2-Factor Authentication on Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Select Mail & Windows Computer
4. Copy 16-character password

### 2. Test Locally
```bash
cd ~/Desktop/news-emailer
npm run dev

# Test scraper
curl "http://localhost:3000/api/cron/scrape" \
  -H "Authorization: Bearer news-emailer-secure-key"

# Test email
curl "http://localhost:3000/api/cron/send-email" \
  -H "Authorization: Bearer news-emailer-secure-key"
```

### 3. Deploy to Vercel
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/news-emailer.git
git push -u origin main
```

Then connect to Vercel:
1. Go to https://vercel.com/import
2. Select your GitHub repo
3. Add environment variables from .env.local
4. Deploy

### 4. Set Up Daily Scheduler
Use Render.com (free tier) or Railway.app:

**Render.com Setup:**
1. Create new Cron Job
2. Schedule: `0 2 * * *` (8:00 AM IST = 2:30 AM UTC, adjust as needed)
3. Webhook URL: `https://your-vercel-app.vercel.app/api/cron/scrape`
4. Headers: `Authorization: Bearer news-emailer-secure-key`

**Repeat for email sender:**
- Schedule: `0 2:30 * * *` (30 min after scraper)
- Webhook URL: `https://your-vercel-app.vercel.app/api/cron/send-email`

---

## 🔍 Testing Checklist

- [ ] Home page loads with stats dashboard
- [ ] /business page shows news
- [ ] /events page shows events
- [ ] /search works with sample queries
- [ ] API /api/cron/scrape returns `{"success":true}`
- [ ] API /api/cron/send-email returns `{"success":true}`
- [ ] Email arrives daily at 8:00 AM IST
- [ ] Supabase shows accumulated news items

---

## 📞 Quick Reference

| File | Purpose |
|------|---------|
| app/page.tsx | Home/dashboard |
| app/business/page.tsx | Business news listing |
| app/events/page.tsx | Events news listing |
| app/search/page.tsx | Search page |
| lib/scraper.ts | News scraping logic |
| lib/emailer.ts | Email sending logic |
| lib/sources.ts | News source URLs |
| app/api/\* | All API endpoints |

**To modify news sources:** Edit `lib/sources.ts`
**To change email template:** Edit `lib/emailer.ts`
**To add new scraping sites:** Add to sources array & implement parsing


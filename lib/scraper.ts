import axios from 'axios';
import { newsSources } from './sources';
import { checkIfNewsExists, insertNews } from './supabase';

const USER_AGENT = 'Mozilla/5.0 (compatible; NewsBot/1.0; +https://news-emailer-silk.vercel.app)';

const stripCDATA = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();

async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const res = await axios.head(url, {
      timeout: 5000,
      maxRedirects: 3,
      headers: { 'User-Agent': USER_AGENT }
    });
    return res.status >= 200 && res.status < 400;
  } catch {
    // Some sites block HEAD but allow GET — assume accessible
    return true;
  }
}

export async function runScraper() {
  console.log('Starting scraper...');
  const allArticles: any[] = [];

  for (const source of newsSources) {
    try {
      const { data } = await axios.get(source.url, {
        timeout: 15000,
        headers: { 'User-Agent': USER_AGENT }
      });

      const itemMatches = data.match(/<item[\s\S]*?<\/item>/g) || [];
      const articles = itemMatches.slice(0, 5).map((item: string) => {
        const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        const linkMatch = item.match(/<link[^>]*>([\s\S]*?)<\/link>/);
        const descMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/);
        const contentMatch = item.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/);
        const pubMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/);

        const headline = titleMatch ? stripCDATA(titleMatch[1]).slice(0, 200) : '';
        const url = linkMatch ? stripCDATA(linkMatch[1]).trim() : '';

        // Try description first, fall back to content:encoded
        const rawDesc = descMatch ? stripCDATA(descMatch[1]) : '';
        const rawContent = contentMatch ? stripCDATA(contentMatch[1]) : '';
        const summary = (rawDesc || rawContent).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim().slice(0, 500);

        const publishedAt = pubMatch ? new Date(pubMatch[1].trim()).toISOString() : new Date().toISOString();

        if (!headline || !url || !url.startsWith('http')) return null;
        return { headline, url, source: source.name, category: source.category, summary, publishedAt };
      }).filter(Boolean);

      console.log(`✓ ${source.name}: ${articles.length} articles`);
      allArticles.push(...articles);
    } catch (err) {
      console.error(`✗ Failed to scrape ${source.name}`);
    }
  }

  if (allArticles.length === 0) return { success: true, inserted: 0 };

  const unique: any[] = [];
  const urls = new Set<string>();

  for (const article of allArticles) {
    if (!urls.has(article.url)) {
      urls.add(article.url);
      const exists = await checkIfNewsExists(article.url).catch(() => false);
      if (!exists) {
        // Verify URL is accessible before saving
        const accessible = await isUrlAccessible(article.url);
        if (accessible) {
          unique.push({
            headline: article.headline,
            url: article.url,
            source: article.source,
            category: article.category,
            summary: article.summary || null,
            scraped_at: new Date().toISOString(),
            published_at: article.publishedAt,
            metrics: null
          });
        } else {
          console.log(`✗ Skipping inaccessible URL: ${article.url}`);
        }
      }
    }
  }

  if (unique.length === 0) return { success: true, inserted: 0 };
  await insertNews(unique as any);
  return { success: true, inserted: unique.length };
}

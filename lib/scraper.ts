import axios from 'axios';
import { newsSources } from './sources';
import { checkIfNewsExists, insertNews } from './supabase';

export async function runScraper() {
  console.log('Starting scraper...');
  const allArticles = [];

  for (const source of newsSources) {
    try {
      const { data } = await axios.get(source.url, { timeout: 10000 });

      // Parse RSS feed
      const itemMatches = data.match(/<item>[\s\S]*?<\/item>/g) || [];
      const articles = itemMatches.slice(0, 5).map((item: string) => {
        const titleMatch = item.match(/<title[^>]*>([^<]+)<\/title>/);
        const linkMatch = item.match(/<link[^>]*>([^<]+)<\/link>/);
        const descMatch = item.match(/<description[^>]*>([^<]*)<\/description>/);

        const headline = titleMatch ? titleMatch[1].trim().slice(0, 200) : '';
        const url = linkMatch ? linkMatch[1].trim() : '';
        const summary = descMatch ? descMatch[1].trim().slice(0, 200) : '';

        if (!headline || !url) return null;
        return { headline, url, source: source.name, category: source.category, summary };
      }).filter(Boolean);

      allArticles.push(...articles);
    } catch (err) {
      console.error(`Failed to scrape ${source.name}`);
    }
  }

  if (allArticles.length === 0) return { success: true, inserted: 0 };

  const unique = [];
  const urls = new Set();
  for (const article of allArticles) {
    if (!urls.has(article.url)) {
      urls.add(article.url);
      const exists = await checkIfNewsExists(article.url).catch(() => false);
      if (!exists) unique.push({...article, scraped_at: new Date().toISOString(), published_at: new Date().toISOString(), metrics: null});
    }
  }

  if (unique.length === 0) return { success: true, inserted: 0 };
  await insertNews(unique as any);
  return { success: true, inserted: unique.length };
}

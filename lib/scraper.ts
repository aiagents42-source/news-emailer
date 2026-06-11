import axios from 'axios';
import * as cheerio from 'cheerio';
import { newsSources } from './sources';
import { checkIfNewsExists, insertNews } from './supabase';

export async function runScraper() {
  console.log('Starting scraper...');
  const allArticles = [];

  for (const source of newsSources) {
    try {
      const { data } = await axios.get(source.url, { timeout: 10000 });
      const $ = cheerio.load(data);
      const articles = $('article, div[class*="news"], div[class*="story"]')
        .slice(0, 5)
        .map((_, el) => {
          const headline = $(el).find('h2, h3, a').first().text().trim().slice(0, 200);
          const url = $(el).find('a').first().attr('href') || '';
          if (!headline || !url) return null;
          return { headline, url, source: source.name, category: source.category };
        })
        .get()
        .filter(Boolean);
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
      if (!exists) unique.push({...article, scraped_at: new Date().toISOString(), published_at: new Date().toISOString(), summary: null, metrics: null});
    }
  }

  if (unique.length === 0) return { success: true, inserted: 0 };
  await insertNews(unique);
  return { success: true, inserted: unique.length };
}

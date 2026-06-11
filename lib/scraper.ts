import axios from 'axios';
import * as cheerio from 'cheerio';
import { newsSources } from './sources';
import { checkIfNewsExists, insertNews } from './supabase';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const stripCDATA = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();

// Fetch the actual article page and extract 150-200 word summary
async function fetchArticleSummary(url: string): Promise<string> {
  try {
    const { data } = await axios.get(url, {
      timeout: 8000,
      headers: { 'User-Agent': USER_AGENT }
    });
    const $ = cheerio.load(data);

    // Remove junk elements
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .social, .related, .comments, figure').remove();

    // Extract paragraphs from article body
    const selectors = ['article p', '.article-body p', '.story-body p', '.content p', '.post-content p', 'main p', 'p'];
    let paragraphs: string[] = [];

    for (const selector of selectors) {
      const found = $(selector).map((_, el) => $(el).text().trim()).get().filter(t => t.length > 60);
      if (found.length >= 2) { paragraphs = found; break; }
    }

    // Join paragraphs and trim to 150-200 words
    const fullText = paragraphs.join(' ').replace(/\s+/g, ' ').trim();
    const words = fullText.split(' ');
    if (words.length > 150) {
      return words.slice(0, 180).join(' ') + '...';
    }
    return fullText.slice(0, 900);
  } catch {
    return '';
  }
}

async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const res = await axios.head(url, { timeout: 5000, maxRedirects: 3, headers: { 'User-Agent': USER_AGENT } });
    return res.status >= 200 && res.status < 400;
  } catch {
    return true; // Some sites block HEAD — assume accessible
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
        const titleMatch  = item.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        const linkMatch   = item.match(/<link[^>]*>([\s\S]*?)<\/link>/);
        const descMatch   = item.match(/<description[^>]*>([\s\S]*?)<\/description>/);
        const contentMatch = item.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/);
        const pubMatch    = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/);

        const headline = titleMatch ? stripCDATA(titleMatch[1]).slice(0, 200) : '';
        const url = linkMatch ? stripCDATA(linkMatch[1]).trim() : '';

        // RSS description as fallback summary
        const rawDesc = descMatch ? stripCDATA(descMatch[1]) : '';
        const rawContent = contentMatch ? stripCDATA(contentMatch[1]) : '';
        const rssSummary = (rawDesc || rawContent).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim().slice(0, 500);

        const publishedAt = pubMatch ? new Date(pubMatch[1].trim()).toISOString() : new Date().toISOString();

        if (!headline || !url || !url.startsWith('http')) return null;
        return { headline, url, source: source.name, category: source.category, rssSummary, publishedAt };
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
    if (urls.has(article.url)) continue;
    urls.add(article.url);

    const exists = await checkIfNewsExists(article.url).catch(() => false);
    if (exists) continue;

    const accessible = await isUrlAccessible(article.url);
    if (!accessible) {
      console.log(`✗ Skipping inaccessible: ${article.url}`);
      continue;
    }

    // Fetch full article content for 150-200 word summary
    let summary = article.rssSummary;
    const articleSummary = await fetchArticleSummary(article.url);
    if (articleSummary && articleSummary.split(' ').length > 30) {
      summary = articleSummary; // Use full article summary if richer
    }

    unique.push({
      headline: article.headline,
      url: article.url,
      source: article.source,
      category: article.category,
      summary: summary || null,
      scraped_at: new Date().toISOString(),
      published_at: article.publishedAt,
      metrics: null
    });
  }

  if (unique.length === 0) return { success: true, inserted: 0 };
  await insertNews(unique as any);
  return { success: true, inserted: unique.length };
}

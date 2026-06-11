import axios from 'axios';
import * as cheerio from 'cheerio';
import { newsSources, BUSINESS_KEYWORDS } from './sources';
import { checkIfNewsExists, insertNews } from './supabase';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const stripCDATA = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
const stripHTML  = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const wordCount  = (s: string) => s.split(/\s+/).filter(Boolean).length;

// Check if a headline is business-related
function isBusinessRelevant(headline: string): boolean {
  const lower = headline.toLowerCase();
  return BUSINESS_KEYWORDS.some(kw => lower.includes(kw));
}

// Fetch full article content for richer summaries
async function fetchArticleSummary(url: string): Promise<string> {
  try {
    const { data } = await axios.get(url, {
      timeout: 6000,
      headers: { 'User-Agent': USER_AGENT }
    });
    const $ = cheerio.load(data);
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .related, figure').remove();

    const selectors = ['article p', '.article-body p', '.story-body p', '.content p', '.post-content p', 'main p', 'p'];
    for (const sel of selectors) {
      const paras = $(sel).map((_, el) => $(el).text().trim()).get().filter(t => t.length > 60);
      if (paras.length >= 2) {
        const text = paras.join(' ').replace(/\s+/g, ' ').trim();
        const words = text.split(' ');
        return words.length > 160 ? words.slice(0, 160).join(' ') + '...' : text;
      }
    }
  } catch { /* silent */ }
  return '';
}

async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const res = await axios.head(url, { timeout: 4000, maxRedirects: 3, headers: { 'User-Agent': USER_AGENT } });
    return res.status >= 200 && res.status < 400;
  } catch { return true; }
}

export async function runScraper() {
  console.log('Starting scraper...');
  const allArticles: any[] = [];

  for (const source of newsSources) {
    try {
      const { data } = await axios.get(source.url, {
        timeout: 12000,
        headers: { 'User-Agent': USER_AGENT }
      });

      const itemMatches = data.match(/<item[\s\S]*?<\/item>/g) || [];
      let added = 0;

      for (const item of itemMatches) {
        if (added >= 5) break;

        const titleMatch   = item.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        const linkMatch    = item.match(/<link[^>]*>([\s\S]*?)<\/link>/);
        const descMatch    = item.match(/<description[^>]*>([\s\S]*?)<\/description>/);
        const contentMatch = item.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/);
        const pubMatch     = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/);

        const headline = titleMatch ? stripCDATA(titleMatch[1]).slice(0, 200) : '';
        const url      = linkMatch  ? stripCDATA(linkMatch[1]).trim() : '';
        if (!headline || !url || !url.startsWith('http')) continue;

        // Filter non-business headlines for general feeds
        if (source.filterBusiness && !isBusinessRelevant(headline)) {
          console.log(`  ✗ Skipping non-business: "${headline.slice(0, 60)}"`);
          continue;
        }

        const rawDesc    = descMatch    ? stripHTML(stripCDATA(descMatch[1]))    : '';
        const rawContent = contentMatch ? stripHTML(stripCDATA(contentMatch[1])) : '';
        const rssSummary = (rawDesc.length > rawContent.length ? rawDesc : rawContent).slice(0, 600);
        const publishedAt = pubMatch ? new Date(pubMatch[1].trim()).toISOString() : new Date().toISOString();

        allArticles.push({ headline, url, source: source.name, category: source.category, rssSummary, publishedAt });
        added++;
      }

      console.log(`✓ ${source.name}: ${added} articles`);
    } catch {
      console.error(`✗ Failed: ${source.name}`);
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
    if (!accessible) { console.log(`✗ Skip inaccessible: ${article.url}`); continue; }

    // Fetch article page if RSS summary is too short
    let summary = article.rssSummary;
    if (wordCount(summary) < 30) {
      const fetched = await fetchArticleSummary(article.url);
      if (wordCount(fetched) > wordCount(summary)) summary = fetched;
    }

    unique.push({
      headline:     article.headline,
      url:          article.url,
      source:       article.source,
      category:     article.category,
      summary:      summary || null,
      scraped_at:   new Date().toISOString(),
      published_at: article.publishedAt,
      metrics:      null
    });
  }

  if (unique.length === 0) return { success: true, inserted: 0 };
  await insertNews(unique as any);
  return { success: true, inserted: unique.length };
}

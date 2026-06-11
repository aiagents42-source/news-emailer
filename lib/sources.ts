export const newsSources = [
  // Business India — working feeds with business keyword filter applied in scraper
  { name: 'Mint Economy',      url: 'https://www.livemint.com/rss/economy',    category: 'business_india', filterBusiness: true },
  { name: 'Mint Companies',    url: 'https://www.livemint.com/rss/companies',  category: 'business_india', filterBusiness: true },
  { name: 'ET Economy',        url: 'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms', category: 'business_india', filterBusiness: false },
  { name: 'ET Industry',       url: 'https://economictimes.indiatimes.com/industry/rssfeeds/13352306.cms',       category: 'business_india', filterBusiness: false },
  { name: 'Hindu Business Line', url: 'https://www.thehindubusinessline.com/feeder/default.rss',                category: 'business_india', filterBusiness: false },

  // Business Global — verified working
  { name: 'BBC Business',      url: 'https://feeds.bbci.co.uk/news/business/rss.xml',             category: 'business_global', filterBusiness: false },
  { name: 'The Guardian',      url: 'https://www.theguardian.com/uk/business/rss',                category: 'business_global', filterBusiness: false },
  { name: 'New York Times',    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',  category: 'business_global', filterBusiness: false },
  { name: 'Reuters',           url: 'https://feeds.reuters.com/reuters/businessNews',             category: 'business_global', filterBusiness: false },

  // Events Industry
  { name: 'Event Industry News', url: 'https://www.eventindustrynews.com/feed',                  category: 'events', filterBusiness: false },
  { name: 'BizBash',            url: 'https://www.bizbash.com/feed',                             category: 'events', filterBusiness: false },
];

// Keywords to filter non-business articles from general feeds
export const BUSINESS_KEYWORDS = [
  'economy', 'market', 'business', 'company', 'corporate', 'industry', 'trade',
  'investment', 'startup', 'revenue', 'profit', 'gdp', 'rbi', 'sebi', 'nse', 'bse',
  'inflation', 'export', 'import', 'finance', 'bank', 'stock', 'share', 'rupee',
  'tax', 'budget', 'policy', 'merger', 'acquisition', 'ipo', 'fund', 'quarter',
  'manufacturing', 'retail', 'commerce', 'entrepreneur', 'sector'
];

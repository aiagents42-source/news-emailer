'use client';
import { useEffect, useState } from 'react';

type Article = { id: string; headline: string; summary: string; url: string; source: string; category: string; published_at: string; };

const CATEGORIES = [
  { value: '', label: '📰 All News', color: '#6b7280' },
  { value: 'business_india', label: '🇮🇳 India Business', color: '#2563eb' },
  { value: 'business_global', label: '🌍 Global Business', color: '#7c3aed' },
  { value: 'events', label: '🎉 Events', color: '#db2777' },
];

const QUICK_FILTERS = [
  { label: 'Today', getDates: () => { const d = new Date(); return { from: d.toISOString().slice(0,10), to: d.toISOString().slice(0,10) }; }},
  { label: 'Yesterday', getDates: () => { const d = new Date(); d.setDate(d.getDate()-1); return { from: d.toISOString().slice(0,10), to: d.toISOString().slice(0,10) }; }},
  { label: 'This Week', getDates: () => { const d = new Date(); const from = new Date(d); from.setDate(d.getDate() - d.getDay()); return { from: from.toISOString().slice(0,10), to: d.toISOString().slice(0,10) }; }},
  { label: 'This Month', getDates: () => { const d = new Date(); return { from: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`, to: d.toISOString().slice(0,10) }; }},
  { label: 'All Time', getDates: () => ({ from: '', to: '' }) },
];

function ArticleCard({ article }: { article: Article }) {
  const cat = CATEGORIES.find(c => c.value === article.category);
  const date = article.published_at ? new Date(article.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  return (
    <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', marginBottom: '14px', borderLeft: `4px solid ${cat?.color || '#6b7280'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', lineHeight: '1.4', flex: 1 }}>
          <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a2e', textDecoration: 'none' }}>{article.headline}</a>
        </h3>
        <span style={{ background: cat?.color || '#6b7280', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>{cat?.label || article.category}</span>
      </div>
      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#888' }}>{article.source} &nbsp;•&nbsp; {date}</p>
      {article.summary && <p style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#444', lineHeight: '1.6' }}>{article.summary}</p>}
      <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: cat?.color || '#6b7280', color: '#fff', padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>Read More →</a>
    </div>
  );
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState({ business_india: 0, business_global: 0, events: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [activeQuick, setActiveQuick] = useState('All Time');

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d.data || {}));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (category) params.set('category', category);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    fetch(`/api/news?${params}`).then(r => r.json()).then(d => { setArticles(d.data || []); setLoading(false); });
  }, [category, from, to]);

  const applyQuick = (q: typeof QUICK_FILTERS[0]) => {
    const dates = q.getDates();
    setFrom(dates.from); setTo(dates.to); setActiveQuick(q.label);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '28px 32px', color: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '800' }}>📰 News Repository</h1>
          <p style={{ margin: 0, color: '#a0aec0', fontSize: '14px' }}>Business &amp; Events Industry — Daily Briefings</p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[{ label: 'Total', value: stats.total, color: '#6b7280' }, { label: '🇮🇳 India', value: stats.business_india, color: '#2563eb' }, { label: '🌍 Global', value: stats.business_global, color: '#7c3aed' }, { label: '🎉 Events', value: stats.events, color: '#db2777' }].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '10px', padding: '18px', textAlign: 'center', borderTop: `3px solid ${s.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontSize: '30px', fontWeight: '800', marginTop: '8px', color: '#1a1a2e' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            {/* Category */}
            <div style={{ flex: '1', minWidth: '180px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', background: '#fff', cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {/* From Date */}
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>From Date</label>
              <input type="date" value={from} onChange={e => { setFrom(e.target.value); setActiveQuick(''); }} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            {/* To Date */}
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>To Date</label>
              <input type="date" value={to} onChange={e => { setTo(e.target.value); setActiveQuick(''); }} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            {/* Search link */}
            <a href="/search" style={{ padding: '9px 20px', background: '#1a1a2e', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' }}>🔍 Search</a>
          </div>

          {/* Quick filters */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', alignSelf: 'center', textTransform: 'uppercase' }}>Quick:</span>
            {QUICK_FILTERS.map(q => (
              <button key={q.label} onClick={() => applyQuick(q)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: activeQuick === q.label ? '#1a1a2e' : '#f0f4f8', color: activeQuick === q.label ? '#fff' : '#4b5563', transition: 'all 0.15s' }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Articles */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>
              {loading ? 'Loading...' : `${articles.length} articles`}
              {(from || to) && <span style={{ fontSize: '14px', fontWeight: '400', color: '#6b7280', marginLeft: '8px' }}>
                {from && to && from === to ? `on ${from}` : from && to ? `${from} → ${to}` : from ? `from ${from}` : `until ${to}`}
              </span>}
            </h2>
            {(from || to || category) && (
              <button onClick={() => { setFrom(''); setTo(''); setCategory(''); setActiveQuick('All Time'); }} style={{ padding: '6px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>
                ✕ Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Loading articles...</div>
          ) : articles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '12px', color: '#6b7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p style={{ margin: 0, fontSize: '16px' }}>No articles found for this filter. Try a different date or category.</p>
            </div>
          ) : (
            articles.map(a => <ArticleCard key={a.id} article={a} />)
          )}
        </div>
      </div>
    </div>
  );
}

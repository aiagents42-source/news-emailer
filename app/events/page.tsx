'use client';
import { useEffect, useState } from 'react';
export default function Events() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/news?category=events&limit=20')
      .then(r => r.json())
      .then(d => { setNews(d.data || []); setLoading(false); })
      .catch(console.error);
  }, []);
  return (
    <div style={{padding: '40px'}}>
      <h1>🎉 Events Industry News</h1>
      <p>{loading ? 'Loading...' : `Showing ${news.length} articles`}</p>
      {news.map((n, i) => (
        <div key={i} style={{marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px'}}>
          <h3 style={{margin: '0 0 10px 0'}}><a href={n.url} style={{color: '#ec4899'}}>{n.headline}</a></h3>
          <p style={{margin: '0 0 10px 0', color: '#666', fontSize: '14px'}}>{n.summary}</p>
          <p style={{margin: 0, fontSize: '12px', color: '#999'}}>{n.source}</p>
        </div>
      ))}
    </div>
  );
}

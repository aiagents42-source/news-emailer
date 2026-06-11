'use client';
import { useEffect, useState } from 'react';
export default function Business() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      fetch('/api/news?category=business_india&limit=10').then(r => r.json()),
      fetch('/api/news?category=business_global&limit=10').then(r => r.json())
    ]).then(([india, global]) => {
      setNews([...(india.data || []), ...(global.data || [])]);
      setLoading(false);
    }).catch(console.error);
  }, []);
  return (
    <div style={{padding: '40px'}}>
      <h1>💼 Business News</h1>
      <p>{loading ? 'Loading...' : `Showing ${news.length} articles`}</p>
      {news.map((n, i) => (
        <div key={i} style={{marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px'}}>
          <h3 style={{margin: '0 0 10px 0'}}><a href={n.url} style={{color: '#2563eb'}}>{n.headline}</a></h3>
          <p style={{margin: '0 0 10px 0', color: '#666', fontSize: '14px'}}>{n.summary}</p>
          <p style={{margin: 0, fontSize: '12px', color: '#999'}}>{n.source}</p>
        </div>
      ))}
    </div>
  );
}

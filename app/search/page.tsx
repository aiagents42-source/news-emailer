'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function SearchContent() {
  const query = useSearchParams().get('q');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!query);
  useEffect(() => {
    if (!query) return;
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => { setResults(d.data || []); setLoading(false); })
      .catch(console.error);
  }, [query]);
  return (
    <div style={{padding: '40px'}}>
      <h1>🔍 Search News</h1>
      <form style={{marginBottom: '20px'}}>
        <input type="text" placeholder="Search..." defaultValue={query || ''} style={{width: '100%', padding: '10px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ddd'}} />
      </form>
      <p>{loading ? 'Searching...' : `Found ${results.length} results`}</p>
      {results.map((n, i) => (
        <div key={i} style={{marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px'}}>
          <h3 style={{margin: '0 0 10px 0'}}><a href={n.url} style={{color: '#2563eb'}}>{n.headline}</a></h3>
          <p style={{margin: '0 0 10px 0', color: '#666', fontSize: '14px'}}>{n.summary}</p>
        </div>
      ))}
    </div>
  );
}

export default function Search() {
  return <Suspense fallback={<div style={{padding: '40px'}}>Loading...</div>}><SearchContent /></Suspense>;
}

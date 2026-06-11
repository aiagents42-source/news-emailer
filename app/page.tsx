'use client';
import { useEffect, useState } from 'react';
export default function Home() {
  const [stats, setStats] = useState({business_india: 0, business_global: 0, events: 0, total: 0});
  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d.data || {})).catch(console.error);
  }, []);
  return (
    <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px'}}>
      <div style={{maxWidth: '1200px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'}}>
        <h1 style={{fontSize: '36px', fontWeight: 'bold', margin: '0 0 10px 0'}}>📰 News Repository</h1>
        <p style={{color: '#666', marginBottom: '30px'}}>Stay updated with business & events industry news</p>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px'}}>
          <div style={{background: '#f0f0f0', padding: '20px', borderRadius: '8px', textAlign: 'center'}}>
            <div style={{fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase'}}>Total News</div>
            <div style={{fontSize: '32px', fontWeight: 'bold', marginTop: '10px'}}>{stats.total}</div>
          </div>
          <div style={{background: '#e0e7ff', padding: '20px', borderRadius: '8px', textAlign: 'center'}}>
            <div style={{fontSize: '12px', fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase'}}>India</div>
            <div style={{fontSize: '32px', fontWeight: 'bold', marginTop: '10px'}}>{stats.business_india}</div>
          </div>
          <div style={{background: '#f3e8ff', padding: '20px', borderRadius: '8px', textAlign: 'center'}}>
            <div style={{fontSize: '12px', fontWeight: 'bold', color: '#7c3aed', textTransform: 'uppercase'}}>Global</div>
            <div style={{fontSize: '32px', fontWeight: 'bold', marginTop: '10px'}}>{stats.business_global}</div>
          </div>
          <div style={{background: '#fce7f3', padding: '20px', borderRadius: '8px', textAlign: 'center'}}>
            <div style={{fontSize: '12px', fontWeight: 'bold', color: '#ec4899', textTransform: 'uppercase'}}>Events</div>
            <div style={{fontSize: '32px', fontWeight: 'bold', marginTop: '10px'}}>{stats.events}</div>
          </div>
        </div>

        <div style={{background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb'}}>
          <h2 style={{margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold'}}>Navigation:</h2>
          <ul style={{margin: 0, paddingLeft: '20px', listStyle: 'disc'}}>
            <li><a href="/" style={{color: '#2563eb', textDecoration: 'none'}}>Home</a></li>
            <li><a href="/business" style={{color: '#2563eb', textDecoration: 'none'}}>Business News</a></li>
            <li><a href="/events" style={{color: '#2563eb', textDecoration: 'none'}}>Events News</a></li>
            <li><a href="/search" style={{color: '#2563eb', textDecoration: 'none'}}>Search</a></li>
          </ul>
        </div>

        <div style={{marginTop: '30px', padding: '20px', background: '#e0e7ff', borderRadius: '8px', border: '1px solid #2563eb'}}>
          <h3 style={{margin: '0 0 10px 0'}}>🚀 To test the system:</h3>
          <pre style={{background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto', fontSize: '12px'}}>curl "http://localhost:3000/api/cron/scrape" \\
  -H "Authorization: Bearer news-emailer-secure-key"</pre>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';

export default function SearchGrid() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/passbook-search')
      .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, body: data })))
      .then(({ status, ok, body }) => {
        if (!ok) {
          throw new Error(body.error || `HTTP ${status}`);
        }
        setCustomers(body.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Customer Profiles Ledger (Raw Data Connection)</h1>
      
      {loading && <p>Loading connection to Vercel Serverless Function...</p>}
      
      {error && (
        <div style={{ color: 'red', border: '1px solid red', padding: '1rem', marginTop: '1rem' }}>
          <strong>Connection Error:</strong> {error}
        </div>
      )}
      
      {!loading && !error && (
        <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
              <th>Account #</th>
              <th>Customer Name</th>
              <th>Father's Name</th>
              <th>Village</th>
              <th>Phone</th>
              <th>Photo Link</th>
              <th>Face Vector</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={c.accountNumber || i}>
                <td>{c.accountNumber || '-'}</td>
                <td>{c.customerName || '-'}</td>
                <td>{c.fathersName || '-'}</td>
                <td>{c.village || '-'}</td>
                <td>{c.phone || '-'}</td>
                <td>{c.photoLink ? <a href={c.photoLink} target="_blank" rel="noreferrer">View</a> : '-'}</td>
                <td>{c.faceVector ? 'Present' : '-'}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No records found in spreadsheet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

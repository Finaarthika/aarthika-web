import { useState, useEffect } from 'react';

export default function SearchGrid() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/passbook-search')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(json => {
        setCustomers(json.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching customers:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Customer Profiles (Pristine Connection Phase)</h1>
      
      {loading && <p>Loading customers...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {!loading && !error && (
        <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th>Account Number</th>
              <th>Customer Name</th>
              <th>Father's Name</th>
              <th>Village</th>
              <th>Phone</th>
              <th>Photo Link</th>
              <th>Face Vector Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, idx) => (
              <tr key={customer.accountNumber || idx}>
                <td>{customer.accountNumber || '-'}</td>
                <td>{customer.customerName || '-'}</td>
                <td>{customer.fathersName || '-'}</td>
                <td>{customer.village || '-'}</td>
                <td>{customer.phone || '-'}</td>
                <td>
                  {customer.photoLink ? (
                    <a href={customer.photoLink} target="_blank" rel="noopener noreferrer">
                      View Photo
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{customer.faceVector ? 'Vector Loaded' : 'No Vector'}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No customer profiles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

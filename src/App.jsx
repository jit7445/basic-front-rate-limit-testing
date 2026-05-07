import React, { useState } from 'react';

function App() {
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello, this is a test message!'
  });
  
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('https://basic-backend-rate-limiting-test.onrender.com/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setResponse({ status: res.status, data });
      
      // Update the "Remaining" count from headers
      const rem = res.headers.get('RateLimit-Remaining');
      setRemaining(rem);

    } catch (err) {
      setResponse({ status: 'ERR', data: { error: 'Server Connection Failed', message: err.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Contact Form Security Tester</h1>
      <p style={styles.subtitle}>Testing Rate Limiting (10 per 1 min)</p>

      {remaining !== null && (
        <div style={{...styles.badge, backgroundColor: remaining > 0 ? '#065f46' : '#991b1b'}}>
          Remaining Submissions: <strong>{remaining}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Name</label>
          <input 
            style={styles.input}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input 
            style={styles.input}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Message</label>
          <textarea 
            style={{...styles.input, height: '100px'}}
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
          />
        </div>

        <button 
          style={loading ? {...styles.button, opacity: 0.5} : styles.button} 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Submit Contact Form'}
        </button>
      </form>

      {response && (
        <div style={{...styles.resultContainer, borderColor: response.status === 200 ? '#10b981' : '#ef4444'}}>
          <div style={styles.status}>
            Server Status: <span style={{ color: response.status === 200 ? '#10b981' : '#ef4444' }}>{response.status}</span>
          </div>
          <pre style={styles.pre}>
            {JSON.stringify(response.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '40px',
    maxWidth: '500px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#f8fafc',
    backgroundColor: '#0f172a',
    minHeight: '100vh',
  },
  title: { fontSize: '28px', marginBottom: '8px', color: '#38bdf8' },
  subtitle: { color: '#94a3b8', marginBottom: '24px', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: 'white',
    fontSize: '16px',
  },
  button: {
    padding: '14px',
    borderRadius: '8px',
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  badge: {
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '14px',
  },
  resultContainer: {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #334155',
  },
  status: { marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' },
  pre: { margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap', color: '#cbd5e1' }
};

export default App;

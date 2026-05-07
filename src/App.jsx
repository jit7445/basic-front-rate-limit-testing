import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello, this is a secure test message!'
  });
  
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [widgetId, setWidgetId] = useState(null);
  const turnstileRef = useRef(null);

  // Initialize Turnstile explicitly on mount
  useEffect(() => {
    if (turnstileRef.current && window.turnstile) {
      const id = window.turnstile.render(turnstileRef.current, {
        sitekey: import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY,
        theme: 'dark',
        callback: (token) => {
          // Token is handled on submit via window.turnstile.getResponse
        },
      });
      setWidgetId(id);
    }
    
    // Cleanup on unmount
    return () => {
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      // 1. Get fresh token from Turnstile
      const token = window.turnstile.getResponse(widgetId);
      
      if (!token) {
        setResponse({ 
          status: 'CLIENT_ERR', 
          data: { error: 'Security Check Required', message: 'Please complete the Turnstile challenge before submitting.' } 
        });
        setLoading(false);
        return;
      }

      // 2. Send to Production Backend
      const res = await fetch('https://basic-backend-rate-limiting-test.onrender.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, token }),
      });

      const data = await res.json();
      setResponse({ status: res.status, data });
      
      // 3. Update Remaining count from Headers
      const remHeader = res.headers.get('RateLimit-Remaining');
      setRemaining(remHeader);

    } catch (err) {
      setResponse({ 
        status: 'ERR', 
        data: { error: 'Connection Failed', message: 'The server is currently unreachable.' } 
      });
    } finally {
      setLoading(false);
      // 4. Always reset for the next attempt
      if (widgetId) {
        window.turnstile.reset(widgetId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-sky-500/30">
      <div className="max-w-md mx-auto">
        <header className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-extrabold text-sky-400 tracking-tight mb-2">
            Secure Contact
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Protected by Redis Rate Limiter & Cloudflare
          </p>
        </header>

        {/* Real-time Budget Stats */}
        {remaining !== null && (
          <div className={`mb-6 p-4 rounded-2xl text-center text-sm font-bold shadow-xl border backdrop-blur-md transition-all duration-500 ${
            parseInt(remaining) > 0 
              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-950/20 text-rose-400 border-rose-500/20 animate-pulse'
          }`}>
            Remaining Budget: <span className="text-lg ml-1">{remaining}</span> / 100
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-slate-800/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-700/50 shadow-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
            <input 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all placeholder:text-slate-600"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
            <input 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all placeholder:text-slate-600"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Message</label>
            <textarea 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all placeholder:text-slate-600 resize-none"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder="How can we help?"
              required
            />
          </div>

          {/* Turnstile Widget */}
          <div className="flex justify-center py-2">
            <div ref={turnstileRef} className="min-h-[65px]"></div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 transform active:scale-[0.97] shadow-xl ${
              loading 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950 hover:shadow-sky-500/30'
            }`}
          >
            {loading ? 'Processing...' : 'Submit Message'}
          </button>
        </form>

        {/* Server Response Log */}
        {response && (
          <div className={`mt-8 p-6 rounded-[1.5rem] border bg-slate-900/40 backdrop-blur-md transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 ${
            response.status === 200 ? 'border-emerald-500/30 shadow-emerald-500/5' : 'border-rose-500/30 shadow-rose-500/5'
          }`}>
            <div className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${
              response.status === 200 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${response.status === 200 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
              Server Status: {response.status}
            </div>
            <pre className="text-xs leading-relaxed text-slate-400 overflow-x-auto font-mono scrollbar-hide">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

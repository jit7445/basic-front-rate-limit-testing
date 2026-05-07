import React, { useState } from 'react';
import { Turnstile } from "@marsidev/react-turnstile";

function App() {
  const [token, setToken] = useState("");
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
        body: JSON.stringify({ ...formData,token }),
      });

      const data = await res.json();
      setResponse({ status: res.status, data });
      
      const rem = res.headers.get('RateLimit-Remaining');
      setRemaining(rem);

    } catch (err) {
      setResponse({ status: 'ERR', data: { error: 'Server Connection Failed', message: err.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-sky-400 tracking-tight mb-2">
            Security Tester
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Contact Form Rate Limiting (10 per min)
          </p>
        </header>

        {remaining !== null && (
          <div className={`mb-6 p-4 rounded-xl text-center text-sm font-bold shadow-lg transition-all duration-300 ${
            parseInt(remaining) > 0 ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20' : 'bg-rose-900/30 text-rose-400 border border-rose-500/20'
          }`}>
            Remaining Submissions: {remaining}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-slate-800/40 backdrop-blur-md p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</label>
            <input 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</label>
            <input 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message</label>
            <textarea 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder="Tell us something..."
            />
          </div>

          <div className="my-2 flex justify-center">
            <Turnstile
              siteKey={import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => {
                setToken(token);
              }}
              options={{
                theme: "dark"
              }}
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !token}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 transform active:scale-[0.98] ${
              loading || !token 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/20'
            }`}
          >
            {loading ? 'Processing...' : 'Submit Contact Form'}
          </button>
        </form>

        {response && (
          <div className={`mt-8 p-6 rounded-2xl border bg-slate-900/50 transition-all duration-500 ${
            response.status === 200 ? 'border-emerald-500/30' : 'border-rose-500/30'
          }`}>
            <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${
              response.status === 200 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              Server Response: {response.status}
            </div>
            <pre className="text-[13px] leading-relaxed text-slate-300 overflow-x-auto font-mono scrollbar-hide">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

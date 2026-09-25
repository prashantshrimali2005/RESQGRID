import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, session } = useAuth();

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase() || 'prashantshrimali2005@gmail.com';

  // If already logged in and is the admin, redirect immediately
  useEffect(() => {
    if (user && user.email?.toLowerCase() === adminEmail) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate, adminEmail]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (email.toLowerCase() !== adminEmail) {
      setError('Not authorized as admin. Access denied.');
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (signInError) {
      setError(signInError.message);
    }
    // AuthContext will automatically pick up the session and redirect via the useEffect above.
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    });
    
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 font-body-md text-on-surface">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-3xl shadow-lg border border-outline-variant/20">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="RESQGRID Logo" className="h-12 w-auto mb-4" onError={(e) => (e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuDGUa-E78kV18F2dK07EBsQukwuCLNCzktvNcJL7-RUCdoVEKoDSLf9pDn9IRF1REC0QrrGgOFalkAtn4mr1fg-jvRqjUlpVt2GK6LTd8VOU-eUgtBWEaEmZknT_yBNoK6yuZOTYmEC4JxfGwTOO0h20vdyBLd7f3RriMURb89TDgx77rLnXFLG_8BWJOMTlQ5Dpt4pDYXMluu_-BvVPe8YaG3Lt0Yc8g6XUqK0XDpYM0OkO32mhkMp1A")} />
          <h1 className="text-headline-md font-headline-md text-on-surface font-bold text-center">Authority Portal</h1>
          <p className="text-body-md text-on-surface-variant text-center mt-2">Authorized Personnel Only</p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mb-6 bg-white border border-outline-variant/50 text-on-surface py-3.5 rounded-xl font-bold hover:bg-surface-container-lowest transition-colors shadow-sm flex items-center justify-center gap-3"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Continue with Google (Gmail)
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-outline-variant/20 flex-1"></div>
          <span className="text-label-sm text-on-surface-variant">OR</span>
          <div className="h-px bg-outline-variant/20 flex-1"></div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-label-md font-bold text-on-surface mb-2">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder={adminEmail}
              className="w-full bg-surface-container px-4 py-3 rounded-xl text-body-lg text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-outline-variant/30"
              required
            />
          </div>
          <div>
            <label className="block text-label-md font-bold text-on-surface mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              className="w-full bg-surface-container px-4 py-3 rounded-xl text-body-lg text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-outline-variant/30"
              required
            />
          </div>

          {error && <p className="text-error text-body-sm mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary text-on-primary py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/home')}
            className="text-primary text-label-md font-bold hover:underline"
          >
            Return to Public Site
          </button>
        </div>
      </div>
    </div>
  );
}

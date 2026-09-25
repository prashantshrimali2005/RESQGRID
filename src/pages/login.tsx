import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showToast, Logo } from '../components';
import { supabase } from '../supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        showToast('Sign up successful! Please check your email or proceed.');
        // Navigate will be handled by the AuthContext effect if auto-login occurs
        navigate('/onboarding');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        showToast('Login successful. Welcome back!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'consent select_account',
          }
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Authentication failed');
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 w-full px-gutter-lg flex items-center justify-between">
          <div className="flex items-center gap-space-md">
            <Link to="/home" className="flex items-center gap-space-sm group">
              <Logo className="h-8 w-auto text-on-surface" />
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-space-lg">
            <Link to="/home" className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors">Home</Link>
            <Link to="/how-it-works" className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors">How It Works</Link>
            <Link to="/about" className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors">About</Link>
            <Link to="/login" aria-current="page" className="transition-colors text-primary font-title-sm font-semibold">Login</Link>
          </nav>
          <div className="flex items-center gap-space-md">
            <Link to="/report" className="inline-flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              <span>Report an Issue</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="w-full flex-grow pt-20 bg-surface flex items-center justify-center min-h-[calc(100vh-160px)] px-gutter-lg py-space-2xl relative overflow-hidden">
        <div className="absolute top-10 left-10 w-80 h-80 bg-primary-fixed rounded-full blur-3xl opacity-40 -z-10"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-tertiary-fixed rounded-full blur-3xl opacity-30 -z-10"></div>

        <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden">
          <div className="p-space-xl">
            <div className="flex justify-center mb-space-lg">
              <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-on-primary text-[32px]">shield_person</span>
              </div>
            </div>
            <h1 className="font-headline-md text-headline-md text-center text-on-surface tracking-tight">
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </h1>
            <p className="font-body-md text-body-md text-center text-on-surface-variant mt-2 mb-space-xl">
              {isSignUp ? 'Sign up to start improving your city.' : 'Sign in to manage your reports and civic engagements.'}
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg font-body-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleAuth} className="space-y-space-md">
              <div>
                <label htmlFor="email" className="block font-label-md text-label-md text-on-surface mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[18px]">mail</span>
                  </div>
                  <input 
                    type="email" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-surface-container hover:bg-surface-variant focus:bg-surface-container-lowest border border-transparent focus:border-primary rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed transition-colors" 
                    placeholder="citizen@example.com" 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block font-label-md text-label-md text-on-surface">Password</label>
                  {!isSignUp && <button type="button" onClick={() => showToast('Password reset link sent to your email.')} className="font-label-sm text-label-sm text-primary hover:underline">Forgot password?</button>}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[18px]">lock</span>
                  </div>
                  <input 
                    type="password" 
                    id="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-surface-container hover:bg-surface-variant focus:bg-surface-container-lowest border border-transparent focus:border-primary rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed transition-colors" 
                    placeholder="••••••••" 
                    required 
                    minLength={6}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-primary hover:bg-on-primary-fixed-variant disabled:opacity-50 text-on-primary font-title-md text-title-md rounded-lg shadow-md transition-colors mt-space-lg flex justify-center items-center gap-2">
                <span>{isSignUp ? (loading ? 'Signing up...' : 'Sign Up') : (loading ? 'Signing in...' : 'Sign In')}</span>
                <span className="material-symbols-outlined text-[18px]">{isSignUp ? 'person_add' : 'login'}</span>
              </button>
            </form>

            <div className="mt-space-lg flex items-center justify-center gap-2">
              <div className="h-px bg-outline-variant/30 flex-1"></div>
              <span className="font-label-sm text-on-surface-variant">OR</span>
              <div className="h-px bg-outline-variant/30 flex-1"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleAuth}
              className="mt-space-lg w-full py-2.5 px-4 bg-surface hover:bg-surface-container-low border border-outline-variant text-on-surface font-title-sm rounded-lg shadow-sm transition-colors flex justify-center items-center gap-3 active:scale-[0.98]"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
            
            <div className="mt-space-lg pt-space-lg border-t border-outline-variant/30 text-center">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"} 
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-title-sm hover:underline ml-1 focus:outline-none">
                  {isSignUp ? 'Sign in' : 'Create one'}
                </button>
              </p>
            </div>
          </div>
          
          <div className="bg-surface-container-low px-space-xl py-space-md flex items-center justify-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>Secure Municipal Portal Access</span>
          </div>
        </div>
      </main>
      <footer className="w-full bg-surface-container-low shadow-[0_-1px_0_rgba(0,0,0,0.04)] py-space-xl">
        <div className="w-full px-gutter-lg flex flex-col md:flex-row items-center justify-between text-on-surface-variant font-label-md text-label-md gap-space-sm">
          <span>© 2026 RESQGRID Municipal Technologies. All rights reserved.</span>
          <span>Civic Trust &amp; Open Infrastructure</span>
        </div>
      </footer>
    </>
  );
}

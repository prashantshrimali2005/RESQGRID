import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const LoginPage = ({ onNavigateBack }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="login-page">
      {/* Navbar for Login Page */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}>
        <button 
          className="btn btn-ghost" 
          onClick={onNavigateBack}
          style={{ padding: '0.5rem 1rem' }}
        >
          <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to Home
        </button>
      </div>

      <div className="login-wrapper" style={{ paddingTop: '5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div className="logo cursor-pointer" onClick={onNavigateBack} style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>
            <div className="logo-icon" style={{ width: '32px', height: '32px' }}>
              <ShieldAlert size={20} />
            </div>
            RESQGRID
          </div>

          <div className="login-card">
            <div className="login-header">
              <h2>
                {isLogin ? 'Sign in to RESQGRID' : 'Create an account'}
              </h2>
            <p>
              {isLogin 
                ? 'Sign in to access your dashboard and coordinate relief.' 
                : 'Join RESQGRID to offer resources and volunteer.'}
            </p>
          </div>

          <button className="btn btn-google w-full py-3 text-base" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
              <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9.001c0 1.452.348 2.827.957 4.04l3.007-2.334z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

          <div className="divider">or continue with email</div>

          <form onSubmit={(e) => e.preventDefault()}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="Enter your full name" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" className="form-input" placeholder="name@example.com" />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label mb-0">Password</label>
                {isLogin && <a href="#" style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: '600' }}>Forgot password?</a>}
              </div>
              <input type="password" className="form-input" placeholder="••••••••" />
            </div>
            
            <button className="btn btn-primary w-full mt-4 py-3 text-base">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                style={{ marginLeft: '0.5rem', fontWeight: '600', color: 'var(--accent-teal)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

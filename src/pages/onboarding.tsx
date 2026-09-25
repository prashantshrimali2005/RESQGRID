import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../supabase';

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      await updateProfile(user.id, {
        full_name: fullName,
        phone,
        address,
        is_verified: true,
      });

      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-gutter-lg">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl p-space-xl">
        <h1 className="font-headline-md text-headline-md text-center text-on-surface mb-2">Complete Your Profile</h1>
        <p className="text-center font-body-sm text-on-surface-variant mb-space-xl">
          We need a few more details to verify your identity before you can start reporting issues.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg font-body-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-space-md">
          <div>
            <label className="block font-label-md text-on-surface mb-1">Full Name</label>
            <input 
              type="text" 
              required 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container border border-transparent focus:border-primary rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block font-label-md text-on-surface mb-1">Phone Number</label>
            <input 
              type="tel" 
              required 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container border border-transparent focus:border-primary rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block font-label-md text-on-surface mb-1">Home Address</label>
            <input 
              type="text" 
              required 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container border border-transparent focus:border-primary rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed"
              placeholder="123 Civic Way, Ward 7"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-space-lg py-2.5 bg-primary text-on-primary font-title-md rounded-lg disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Complete Verification'}
          </button>
        </form>
      </div>
    </div>
  );
}

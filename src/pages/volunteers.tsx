import React, { useState, useEffect } from 'react';
import { Header, BottomNav, showToast } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { fetchVolunteer, upsertVolunteer, Volunteer } from '../supabase';
import { Handshake, ShieldCheck, CheckCircle2, ChevronDown } from 'lucide-react';

export default function VolunteersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  
  const [skills, setSkills] = useState<string>('');
  const [availability, setAvailability] = useState('Available');

  const availableSkills = ['Medical', 'Search & Rescue', 'Logistics', 'Driving', 'Communications', 'Debris Clearing'];

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchVolunteer(user.id).then(data => {
        if (data) {
          setVolunteer(data);
          setSkills(data.skills?.join(', ') || '');
          setAvailability(data.availability || 'Available');
        }
        setLoading(false);
      });
    }
  }, [user]);

  const toggleSkill = (skill: string) => {
    const currentSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
    if (currentSkills.includes(skill)) {
      setSkills(currentSkills.filter(s => s !== skill).join(', '));
    } else {
      setSkills([...currentSkills, skill].join(', '));
    }
  };

  const handleSave = async () => {
    if (!user) return showToast('Please login to register');
    setLoading(true);
    try {
      const updated = await upsertVolunteer({
        id: user.id,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        availability
      });
      setVolunteer(updated);
      showToast('Volunteer profile saved!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted font-sans text-text-primary">
      <Header title="Volunteer Network" />
      
      <main className="pt-24 pb-32 md:pb-24 px-4 max-w-3xl mx-auto flex flex-col gap-6">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-md text-white rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/30">
              <Handshake className="w-10 h-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Join the Rescue Network</h1>
            <p className="text-brand-100 font-medium text-lg max-w-lg mx-auto leading-relaxed">
              Register your skills and availability to be dispatched during active emergencies in your area. Your help saves lives.
            </p>
          </div>
        </div>

        {!user ? (
          <div className="bg-surface-elevated p-8 rounded-3xl shadow-sm border border-border-light text-center flex flex-col items-center">
            <ShieldCheck className="w-16 h-16 text-border-base mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">Authentication Required</h3>
            <p className="mb-6 text-text-muted font-medium max-w-sm">You must be logged in with a verified account to register as a responder.</p>
            <a href="#/login" className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold inline-block transition-all shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 hover:shadow-xl">Log In to Continue</a>
          </div>
        ) : loading && !volunteer ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-surface-elevated p-6 md:p-8 rounded-3xl shadow-sm border border-border-light flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {volunteer && volunteer.verified && (
              <div className="bg-gradient-to-r from-safe/5 to-safe/10 border border-safe/20 p-5 rounded-2xl flex items-start gap-4">
                <div className="bg-safe/20 p-2 rounded-xl text-safe shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-safe tracking-tight text-lg">Verified Responder</h3>
                  <p className="text-safe/80 font-medium text-sm mt-1 leading-relaxed">Your background has been cleared by authorities. You are eligible for high-priority dispatch alerts and sensitive missions.</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-text-secondary mb-4 uppercase tracking-wider">Your Expertise <span className="text-text-muted font-normal lowercase">(Select all that apply)</span></label>
              <div className="flex flex-wrap gap-2.5">
                {availableSkills.map(skill => {
                  const currentSkills = skills.split(',').map(s => s.trim());
                  const isSelected = currentSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                        isSelected 
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 ring-2 ring-brand-600 ring-offset-2' 
                          : 'bg-surface-muted text-text-secondary border border-border-light hover:bg-border-light hover:border-border-base'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      {skill}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6">
                <label className="block text-sm font-bold text-text-secondary mb-2">Other Skills</label>
                <input 
                  type="text" 
                  value={skills} 
                  onChange={e => setSkills(e.target.value)}
                  placeholder="e.g., Drone Pilot, Multilingual, CPR Certified..." 
                  className="w-full p-4 rounded-2xl bg-surface-muted border border-border-light outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-text-secondary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-secondary mb-3 uppercase tracking-wider">Current Status</label>
              <div className="relative">
                <select 
                  value={availability} 
                  onChange={e => setAvailability(e.target.value)}
                  className="w-full p-4 pl-4 pr-10 rounded-2xl bg-surface-muted border border-border-light outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none font-bold text-text-secondary transition-all"
                >
                  <option value="Available">🟢 Ready for Dispatch</option>
                  <option value="Deployed">🟡 Currently Deployed</option>
                  <option value="Unavailable">🔴 Unavailable</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full py-4 bg-text-primary hover:bg-black text-surface-elevated rounded-2xl font-black tracking-wide mt-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving Profile...
                </>
              ) : 'Update Volunteer Profile'}
            </button>
          </div>
        )}
      </main>
      
      <BottomNav active="volunteers" />
    </div>
  );
}

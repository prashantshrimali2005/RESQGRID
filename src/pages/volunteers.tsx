import React, { useState, useEffect } from 'react';
import { Header, BottomNav, showToast } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { fetchVolunteer, upsertVolunteer, Volunteer } from '../supabase';

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
    <div className="min-h-screen bg-surface font-body-md text-on-surface">
      <Header title="Volunteer Network" />
      
      <main className="pt-24 pb-32 md:pb-24 px-gutter-lg max-w-3xl mx-auto flex flex-col gap-space-lg">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto bg-primary-container text-primary rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[32px]">handshake</span>
          </div>
          <h1 className="font-headline-md text-headline-md font-bold">Join the Rescue Network</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Register your skills and availability to be dispatched during active emergencies in your area.
          </p>
        </div>

        {!user ? (
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 text-center">
            <p className="mb-4 text-on-surface-variant">You must be logged in to register as a volunteer.</p>
            <a href="#/login" className="px-6 py-2 bg-primary text-on-primary rounded-xl font-bold inline-block">Login Now</a>
          </div>
        ) : loading && !volunteer ? (
          <div className="flex justify-center p-12">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">autorenew</span>
          </div>
        ) : (
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col gap-6">
            
            {volunteer && volunteer.verified && (
              <div className="bg-tertiary-container/30 border border-tertiary/20 p-4 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-tertiary mt-0.5">verified_user</span>
                <div>
                  <h3 className="font-bold text-tertiary-fixed-dim">Verified Responder</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">Your background has been cleared by authorities. You may receive high-priority dispatch alerts.</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-label-md font-bold mb-3">Your Skills (Select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map(skill => {
                  const currentSkills = skills.split(',').map(s => s.trim());
                  const isSelected = currentSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-full font-title-sm border transition-colors ${
                        isSelected 
                          ? 'bg-primary text-on-primary border-primary' 
                          : 'bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              <input 
                type="text" 
                value={skills} 
                onChange={e => setSkills(e.target.value)}
                placeholder="Other skills (comma separated)..." 
                className="w-full mt-4 p-3 rounded-xl bg-surface-container outline-none focus:ring-2 focus:ring-primary/50 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-md font-bold mb-2">Current Availability</label>
              <select 
                value={availability} 
                onChange={e => setAvailability(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface-container outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="Available">🟢 Available for Dispatch</option>
                <option value="Deployed">🟡 Currently Deployed</option>
                <option value="Unavailable">🔴 Unavailable</option>
              </select>
            </div>

            <button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold mt-4 hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Volunteer Profile'}
            </button>
          </div>
        )}
      </main>
      
      <BottomNav active="volunteers" />
    </div>
  );
}

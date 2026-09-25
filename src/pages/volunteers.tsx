import React, { useState, useEffect, useMemo } from 'react';
import { Header, BottomNav, showToast } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { fetchVolunteer, upsertVolunteer, Volunteer } from '../supabase';
import { Handshake, ShieldCheck, CheckCircle2, ChevronDown, MapPin, Target, LocateFixed, Radar, Move } from 'lucide-react';
import { TilerMap, TilerMarker, TilerCircle, TilerMapHandle } from '../components';

// Compute zoom level so the circle radius fits the map viewport nicely
function getZoomForRadius(radiusKm: number): number {
  // Rough heuristic: at zoom 14 → ~1 km fits; each zoom-out doubles the distance
  if (radiusKm <= 1) return 14;
  if (radiusKm <= 2) return 13;
  if (radiusKm <= 5) return 12;
  if (radiusKm <= 10) return 11;
  if (radiusKm <= 20) return 10;
  if (radiusKm <= 40) return 9;
  if (radiusKm <= 80) return 8;
  return 7;
}

export default function VolunteersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  
  const [skills, setSkills] = useState<string>('');
  const [availability, setAvailability] = useState('Available');
  const [locationName, setLocationName] = useState('');
  const [radiusKm, setRadiusKm] = useState(10);
  const [currentLat, setCurrentLat] = useState<number | undefined>();
  const [currentLng, setCurrentLng] = useState<number | undefined>();
  const [gettingLocation, setGettingLocation] = useState(false);

  const mapRef = React.useRef<TilerMapHandle>(null);

  const availableSkills = ['Medical', 'Search & Rescue', 'Logistics', 'Driving', 'Communications', 'Debris Clearing'];

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchVolunteer(user.id).then(data => {
        if (data) {
          setVolunteer(data);
          setSkills(data.skills?.join(', ') || '');
          setAvailability(data.availability || 'Available');
          setLocationName(data.location_name || '');
          setRadiusKm(data.radius_km || 10);
          setCurrentLat(data.current_lat);
          setCurrentLng(data.current_lng);
        }
        setLoading(false);
      });
    }
  }, [user]);

  // Auto-adjust map zoom when radius changes
  useEffect(() => {
    if (mapRef.current && currentLat && currentLng) {
      mapRef.current.setZoom(getZoomForRadius(radiusKm));
      mapRef.current.panTo({ lat: currentLat, lng: currentLng });
    }
  }, [radiusKm, currentLat, currentLng]);

  const toggleSkill = (skill: string) => {
    const currentSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
    if (currentSkills.includes(skill)) {
      setSkills(currentSkills.filter(s => s !== skill).join(', '));
    } else {
      setSkills([...currentSkills, skill].join(', '));
    }
  };

  const handleGetLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLat(position.coords.latitude);
        setCurrentLng(position.coords.longitude);
        setLocationName('Current GPS Location');
        showToast('Location captured successfully');
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location', error);
        showToast('Could not get precise location. Please type it manually.');
        setGettingLocation(false);
      }
    );
  };

  const handleMapClick = (e: { lat: number; lng: number }) => {
    setCurrentLat(e.lat);
    setCurrentLng(e.lng);
    setLocationName('Pinned Location');
  };

  const handleSave = async () => {
    if (!user) return showToast('Please login to register');
    setLoading(true);
    try {
      const updated = await upsertVolunteer({
        id: user.id,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        availability,
        location_name: locationName,
        radius_km: radiusKm,
        current_lat: currentLat,
        current_lng: currentLng
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

  // Compute the area covered by the radius
  const areaCovered = useMemo(() => {
    return (Math.PI * radiusKm * radiusKm).toFixed(1);
  }, [radiusKm]);

  // Radius slider gradient fill percentage
  const sliderPercent = ((radiusKm - 1) / (100 - 1)) * 100;

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
              Register your skills, location, and availability to be dispatched during active emergencies. Your help saves lives.
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

            {/* Operating Area — Premium Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" /> Operating Area
                </label>
                {currentLat && currentLng && (
                  <span className="text-[11px] font-mono text-text-muted bg-surface-muted px-2.5 py-1 rounded-full border border-border-light">
                    {currentLat.toFixed(4)}°N, {currentLng.toFixed(4)}°E
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-0 rounded-2xl border border-border-light overflow-hidden bg-surface-muted">
                {/* Base Location Input */}
                <div className="p-4 pb-3 bg-white border-b border-border-light">
                  <label className="block text-[11px] font-bold text-text-muted mb-2 uppercase tracking-wider">Base Location</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input 
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="e.g., Downtown District, City"
                        className="w-full p-3 pl-10 rounded-xl bg-surface-muted border border-border-light outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-sm text-text-primary transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleGetLocation}
                      disabled={gettingLocation}
                      className="px-3.5 bg-brand-50 text-brand-600 border border-brand-100 hover:bg-brand-100 rounded-xl font-bold flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
                      title="Use Current GPS Location"
                    >
                      {gettingLocation ? (
                        <div className="w-5 h-5 border-2 border-brand-600/30 border-t-brand-600 rounded-full animate-spin"></div>
                      ) : (
                        <LocateFixed className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Map with Circle Radius Overlay */}
                <div className="w-full h-72 md:h-80 relative">
                  <TilerMap
                    ref={mapRef}
                    id="VOLUNTEER_LOCATE_MAP"
                    defaultZoom={11}
                    defaultCenter={{ lat: 31.25471, lng: 75.70434 }}
                    center={currentLat && currentLng ? { lat: currentLat, lng: currentLng } : undefined}
                    onClick={handleMapClick}
                  >
                    {/* Service Radius Circle */}
                    {currentLat && currentLng && (
                      <TilerCircle
                        center={{ lat: currentLat, lng: currentLng }}
                        radius={radiusKm * 1000}
                        fillColor="#3b82f6"
                        fillOpacity={0.08}
                        strokeColor="#3b82f6"
                        strokeOpacity={0.5}
                        strokeWeight={2}
                      />
                    )}
                    {/* Inner highlight ring */}
                    {currentLat && currentLng && (
                      <TilerCircle
                        center={{ lat: currentLat, lng: currentLng }}
                        radius={Math.max(radiusKm * 200, 500)}
                        fillColor="#2563eb"
                        fillOpacity={0.12}
                        strokeColor="#2563eb"
                        strokeOpacity={0.3}
                        strokeWeight={1}
                      />
                    )}
                    {currentLat && currentLng && (
                      <TilerMarker 
                        position={{ lat: currentLat, lng: currentLng }} 
                        icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                        draggable={true}
                        onDragEnd={(e: { lat: number; lng: number }) => {
                          setCurrentLat(e.lat);
                          setCurrentLng(e.lng);
                          setLocationName('Pinned Location');
                        }}
                      />
                    )}
                  </TilerMap>

                  {/* Map overlay hints */}
                  {!currentLat && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/5">
                      <div className="bg-white/95 backdrop-blur-sm text-text-primary px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-2 border border-border-light">
                        <MapPin className="w-4 h-4 text-brand-600" /> Tap anywhere on the map to set your base
                      </div>
                    </div>
                  )}

                  {/* Radius badge on map */}
                  {currentLat && currentLng && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-brand-100">
                      <Radar className="w-3.5 h-3.5 text-brand-600" />
                      <span className="text-xs font-black text-brand-600">{radiusKm} km radius</span>
                    </div>
                  )}

                  {/* Drag hint */}
                  {currentLat && currentLng && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <Move className="w-3 h-3 text-white/80" />
                      <span className="text-[10px] font-bold text-white/90">Drag pin to reposition</span>
                    </div>
                  )}
                </div>
                
                {/* Service Radius Slider — Premium */}
                <div className="p-5 bg-white border-t border-border-light">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                        <Radar className="w-4 h-4" />
                      </div>
                      <label className="text-sm font-bold text-text-primary">Service Radius</label>
                    </div>
                    <div className="bg-brand-50 border border-brand-100 px-3 py-1 rounded-full">
                      <span className="text-brand-700 font-black text-sm">{radiusKm} km</span>
                    </div>
                  </div>
                  
                  {/* Custom styled range slider */}
                  <div className="relative mt-1 mb-3">
                    <div className="w-full h-2 bg-border-base rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-150"
                        style={{ width: `${sliderPercent}%` }}
                      />
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      step="1"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                      style={{ margin: 0 }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-text-muted font-bold uppercase tracking-wider">
                    <span>1 km</span>
                    <span>25 km</span>
                    <span>50 km</span>
                    <span>75 km</span>
                    <span>100 km</span>
                  </div>

                  {/* Stats row */}
                  {currentLat && currentLng && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="bg-surface-muted rounded-xl p-2.5 text-center border border-border-light">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Diameter</p>
                        <p className="text-sm font-black text-text-primary mt-0.5">{radiusKm * 2} km</p>
                      </div>
                      <div className="bg-surface-muted rounded-xl p-2.5 text-center border border-border-light">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Area</p>
                        <p className="text-sm font-black text-text-primary mt-0.5">{areaCovered} km²</p>
                      </div>
                      <div className="bg-brand-50 rounded-xl p-2.5 text-center border border-brand-100">
                        <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Status</p>
                        <p className="text-sm font-black text-brand-700 mt-0.5">Active</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-4 uppercase tracking-wider flex items-center gap-2">
                <Handshake className="w-4 h-4" /> Your Expertise <span className="text-text-muted font-normal lowercase">(Select all that apply)</span>
              </label>
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
              <div className="mt-4">
                <label className="block text-xs font-bold text-text-muted mb-2">Other Skills</label>
                <input 
                  type="text" 
                  value={skills} 
                  onChange={e => setSkills(e.target.value)}
                  placeholder="e.g., Drone Pilot, Multilingual, CPR Certified..." 
                  className="w-full p-4 rounded-xl bg-surface-muted border border-border-light outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-text-secondary transition-all"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-3 uppercase tracking-wider">Current Status</label>
              <div className="relative">
                <select 
                  value={availability} 
                  onChange={e => setAvailability(e.target.value)}
                  className="w-full p-4 pl-4 pr-10 rounded-xl bg-surface-muted border border-border-light outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none font-bold text-text-secondary transition-all"
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

            {/* Submit */}
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

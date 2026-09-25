import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header, BottomNav, showToast } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { supabase, updateProfile, fetchReports, CivicReport } from '../supabase';
import Cropper, { Point, Area } from 'react-easy-crop';
import { TilerMap, TilerMarker } from '../components';
import { 
  User, ShieldCheck, Settings, History, 
  HeartHandshake, LogOut, Trash2, Camera, 
  ChevronRight, X, AlertTriangle, CheckCircle2,
  Bell, Moon, MapPin, Navigation, LocateFixed
} from 'lucide-react';

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [pendingAvatarBase64, setPendingAvatarBase64] = useState<string | null>(null);

  const [reports, setReports] = useState<CivicReport[]>([]);
  const [stats, setStats] = useState({ total: 0, accuracy: 0, impact: '0.0' });

  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkEnabled, setDarkEnabled] = useState(() => localStorage.getItem('dashboard_dark_mode') === 'true');

  // Map state
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number}>({ lat: 31.25471, lng: 75.70434 });
  const [userPin, setUserPin] = useState<{lat: number, lng: number} | null>(null);
  const [locatingGPS, setLocatingGPS] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || '');
      setEditPhone(profile.phone || '');
      setEditAddress(profile.address || '');
    }
    if (user) {
      const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
      if (savedAvatar) {
        setLocalAvatar(savedAvatar);
      }
      // Load saved pin from localStorage
      const savedPin = localStorage.getItem(`profile_pin_${user.id}`);
      if (savedPin) {
        try {
          const pin = JSON.parse(savedPin);
          setUserPin(pin);
          setMapCenter(pin);
        } catch (e) { /* ignore */ }
      }
    }
  }, [profile, user]);

  useEffect(() => {
    async function loadReports() {
      if (!user) return;
      try {
        const data = await fetchReports(user.id);
        setReports(data || []);
        
        const total = data.length;
        const verifiedOrResolved = data.filter(r => r.status === 'Verified' || r.status === 'Resolved').length;
        const accuracy = total > 0 ? Math.round((verifiedOrResolved / total) * 100) : 100;
        const impact = total > 0 ? Math.min((verifiedOrResolved * 0.5) + (total * 0.1), 5.0).toFixed(1) : '0.0';

        setStats({ total, accuracy, impact });
      } catch (err) {
        console.error('Failed to load reports for stats:', err);
      }
    }
    loadReports();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showToast('Successfully signed out');
      navigate('/login');
    } catch (err) {
      console.error('Error signing out:', err);
      showToast('Error signing out');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await supabase.from('profiles').update({
        full_name: 'Deleted User',
        phone: null,
        address: null,
        avatar_url: null,
        is_verified: false
      }).eq('id', user.id);

      await supabase.from('reports').update({
        status: 'Cancelled',
        cancellation_reason: 'Account Deleted'
      }).eq('user_id', user.id);

      localStorage.removeItem(`avatar_${user.id}`);
      
      await supabase.auth.signOut();
      showToast('Account successfully wiped and deleted.');
      navigate('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      showToast('Error deleting account. Please try again.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirmCrop = async () => {
    if (imageSrc && croppedAreaPixels) {
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      setPendingAvatarBase64(croppedBase64);
      setImageSrc(null);
    }
  };

  const saveProfileData = async () => {
    if (!user) return;
    try {
      await updateProfile(user.id, {
        full_name: editName,
        phone: editPhone,
        address: editAddress,
      });
      await refreshProfile();
      showToast('Profile updated successfully');
      setActiveModal(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    
    if (pendingAvatarBase64) {
      localStorage.setItem(`avatar_${user.id}`, pendingAvatarBase64);
      setLocalAvatar(pendingAvatarBase64);
      setPendingAvatarBase64(null);
      window.dispatchEvent(new Event('avatarChanged'));
    }
    
    saveProfileData();
  };

  const handleMapClick = useCallback((e: { lat: number; lng: number }) => {
      const pin = { lat: e.lat, lng: e.lng };
      setUserPin(pin);
      setMapCenter(pin);
      if (user) {
        localStorage.setItem(`profile_pin_${user.id}`, JSON.stringify(pin));
      }
  }, [user]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser');
      return;
    }
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pin = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserPin(pin);
        setMapCenter(pin);
        if (user) {
          localStorage.setItem(`profile_pin_${user.id}`, JSON.stringify(pin));
        }
        showToast('📍 Location updated!');
        setLocatingGPS(false);
      },
      () => {
        showToast('Could not get your location');
        setLocatingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const emailName = user?.email?.split('@')[0] || 'Citizen';
  const initial = profile?.full_name?.charAt(0).toUpperCase() || emailName.charAt(0).toUpperCase();
  const displayAvatar = pendingAvatarBase64 || localAvatar || profile?.avatar_url;

  return (
    <div className={`min-h-screen bg-surface-muted font-sans text-text-primary pb-24 ${darkEnabled ? 'dark' : ''}`}>
      <Header title="Profile" showBrand={false} showBack={true} />
      
      <main className="pt-24 px-4 max-w-2xl mx-auto flex flex-col gap-8">
        
        {/* Profile Card Header */}
        <section className="relative">
          <div className="bg-surface-elevated rounded-3xl shadow-sm border border-border-light overflow-hidden">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            </div>
            
            <div className="px-6 pb-6 relative">
              {/* Avatar */}
              <div className="relative -mt-16 mb-4 flex justify-between items-end">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full p-1.5 bg-surface-elevated shadow-lg relative z-10">
                    {displayAvatar ? (
                      <img alt="Profile" className="w-full h-full rounded-full object-cover" src={displayAvatar} />
                    ) : (
                      <div className="w-full h-full rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-4xl font-black">
                        {initial}
                      </div>
                    )}
                    <button 
                      onClick={() => setActiveModal('personalInfo')}
                      className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg border-2 border-surface-elevated hover:bg-brand-700 transition-colors group-hover:scale-105"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div 
                  onClick={() => setActiveModal('community')}
                  className="mb-2 px-4 py-2 bg-safe/10 text-safe rounded-full font-bold text-sm border border-safe/20 flex items-center gap-2 cursor-pointer hover:bg-safe/20 transition-colors shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" /> Active Citizen
                </div>
              </div>

              {/* Info */}
              <div>
                <h1 className="text-2xl font-black text-text-primary tracking-tight">{profile?.full_name || emailName}</h1>
                <p className="text-text-secondary font-medium flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-text-muted" />
                  {profile?.address || 'Location not set'}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border-light">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-text-primary">{stats.total}</span>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">Reports</span>
                </div>
                <div className="flex flex-col border-l border-border-light pl-4">
                  <span className="text-3xl font-black text-text-primary">{stats.accuracy}%</span>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">Accuracy</span>
                </div>
                <div className="flex flex-col border-l border-border-light pl-4">
                  <span className="text-3xl font-black text-brand-600">{stats.impact}</span>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">Impact Score</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* My Location Map */}
        <section>
          <div className="bg-surface-elevated rounded-3xl shadow-sm border border-border-light overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-text-primary text-sm">My Location</h3>
                  <p className="text-xs text-text-muted font-medium">
                    {userPin ? `${userPin.lat.toFixed(4)}, ${userPin.lng.toFixed(4)}` : 'Tap the map or use GPS to set'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLocateMe}
                disabled={locatingGPS}
                className="px-3.5 py-2 bg-brand-50 text-brand-600 border border-brand-100 hover:bg-brand-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {locatingGPS ? (
                  <div className="w-4 h-4 border-2 border-brand-600/30 border-t-brand-600 rounded-full animate-spin"></div>
                ) : (
                  <LocateFixed className="w-4 h-4" />
                )}
                {locatingGPS ? 'Locating...' : 'Use GPS'}
              </button>
            </div>
            <div className="h-52 relative">
              <TilerMap
                id="PROFILE_MAP"
                defaultZoom={12}
                defaultCenter={mapCenter}
                center={mapCenter}
                onClick={handleMapClick}
              >
                {userPin && (
                  <TilerMarker
                    position={userPin}
                    icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                    draggable={true}
                    onDragEnd={(e: { lat: number; lng: number }) => {
                        const pin = { lat: e.lat, lng: e.lng };
                        setUserPin(pin);
                        setMapCenter(pin);
                        if (user) {
                          localStorage.setItem(`profile_pin_${user.id}`, JSON.stringify(pin));
                        }
                    }}
                  />
                )}
              </TilerMap>
              {!userPin && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/5">
                  <div className="bg-white/90 backdrop-blur-sm text-text-primary px-4 py-2 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Tap anywhere to set your location
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Menu Sections */}
        <section className="flex flex-col gap-6">
          
          {/* Account Settings */}
          <div>
            <h3 className="text-xs font-black text-text-muted uppercase tracking-widest pl-4 mb-3">Account</h3>
            <div className="bg-surface-elevated rounded-3xl shadow-sm border border-border-light overflow-hidden divide-y divide-border-light">
              
              <button onClick={() => setActiveModal('personalInfo')} className="w-full flex items-center justify-between p-5 hover:bg-border-light/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-text-primary">Personal Information</span>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted" />
              </button>
              
              <button onClick={() => setActiveModal('identity')} className="w-full flex items-center justify-between p-5 hover:bg-border-light/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-text-primary">Identity Verification</span>
                </div>
                <div className="flex items-center gap-3">
                  {profile?.is_verified ? (
                    <span className="bg-safe/10 text-safe px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-safe/20">Verified</span>
                  ) : (
                    <span className="bg-critical/10 text-critical px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-critical/20">Unverified</span>
                  )}
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
              </button>
              
              <button onClick={() => setActiveModal('appSettings')} className="w-full flex items-center justify-between p-5 hover:bg-border-light/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-text-primary">App Settings</span>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted" />
              </button>

            </div>
          </div>
          
          {/* Civic Engagement */}
          <div>
            <h3 className="text-xs font-black text-text-muted uppercase tracking-widest pl-4 mb-3">Civic Engagement</h3>
            <div className="bg-surface-elevated rounded-3xl shadow-sm border border-border-light overflow-hidden divide-y divide-border-light">
              
              <button onClick={() => navigate('/dashboard')} className="w-full flex items-center justify-between p-5 hover:bg-border-light/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <History className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-text-primary">My Report History</span>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted" />
              </button>
              
              <button onClick={() => setActiveModal('community')} className="w-full flex items-center justify-between p-5 hover:bg-border-light/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-text-primary">Community Contributions</span>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted" />
              </button>
              
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-3 mt-4">
            <button 
              onClick={handleSignOut} 
              className="w-full py-4 rounded-2xl bg-surface-elevated border border-border-base text-text-primary font-bold hover:bg-border-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
            
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              className="w-full py-4 rounded-2xl bg-critical/5 hover:bg-critical/10 text-critical font-bold flex items-center justify-center gap-2 transition-colors border border-critical/20 active:scale-[0.98]"
            >
              <Trash2 className="w-5 h-5" /> Delete Account
            </button>
          </div>

        </section>

      </main>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
          <div className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
          
          <div className="relative bg-surface-elevated w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            
            <div className="flex items-center justify-between p-6 border-b border-border-light">
              <h3 className="text-xl font-black text-text-primary">
                {activeModal === 'personalInfo' && 'Personal Information'}
                {activeModal === 'identity' && 'Identity Verification'}
                {activeModal === 'appSettings' && 'App Settings'}
                {activeModal === 'community' && 'Community Contributions'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-muted hover:bg-border-light transition-colors text-text-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              
              {activeModal === 'personalInfo' && (
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Profile Picture</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-sm text-text-secondary file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:font-bold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100 transition-colors cursor-pointer"
                    />
                    {pendingAvatarBase64 && (
                      <div className="mt-3 text-brand-600 text-sm font-bold flex items-center gap-2 bg-brand-50 p-3 rounded-xl border border-brand-100">
                        <CheckCircle2 className="w-4 h-4" /> Cropped image ready to save
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Full Name</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required className="w-full px-5 py-4 rounded-2xl bg-surface-muted text-text-primary border border-border-light focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Phone Number</label>
                    <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} required className="w-full px-5 py-4 rounded-2xl bg-surface-muted text-text-primary border border-border-light focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Address</label>
                    <textarea value={editAddress} onChange={e => setEditAddress(e.target.value)} required className="w-full px-5 py-4 rounded-2xl bg-surface-muted text-text-primary border border-border-light focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none h-28 font-medium" />
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full mt-2 py-4 bg-brand-600 text-white rounded-2xl font-black hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center shadow-lg shadow-brand-600/30 hover:shadow-xl hover:-translate-y-0.5">
                    {isSaving ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Save Changes'}
                  </button>
                </form>
              )}

              {activeModal === 'identity' && (
                <div className="flex flex-col items-center text-center py-6 gap-5">
                  {profile?.is_verified ? (
                    <>
                      <div className="w-24 h-24 rounded-full bg-safe/10 text-safe flex items-center justify-center border-4 border-safe/20">
                        <ShieldCheck className="w-12 h-12" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-text-primary mb-2">Verified Citizen</h4>
                        <p className="text-text-secondary font-medium leading-relaxed">Your identity has been confirmed by the municipal network. You have full access to priority reporting features.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 rounded-full bg-critical/10 text-critical flex items-center justify-center border-4 border-critical/20">
                        <AlertTriangle className="w-12 h-12" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-text-primary mb-2">Unverified</h4>
                        <p className="text-text-secondary font-medium leading-relaxed">Please complete your profile information to verify your identity.</p>
                      </div>
                      <button onClick={() => {setActiveModal('personalInfo')}} className="mt-4 px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/30">Complete Profile</button>
                    </>
                  )}
                </div>
              )}

              {activeModal === 'appSettings' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between p-4 bg-surface-muted rounded-2xl border border-border-light">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-text-primary shadow-sm">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary">Push Notifications</h4>
                        <p className="text-xs font-medium text-text-secondary mt-0.5">Alerts for report updates</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={pushEnabled} onChange={() => setPushEnabled(!pushEnabled)} />
                      <div className="w-11 h-6 bg-border-base peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface-muted rounded-2xl border border-border-light">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-text-primary shadow-sm">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary">Dark Mode</h4>
                        <p className="text-xs font-medium text-text-secondary mt-0.5">Toggle dark theme</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={darkEnabled} onChange={() => {
                        const newState = !darkEnabled;
                        setDarkEnabled(newState);
                        localStorage.setItem('dashboard_dark_mode', String(newState));
                        showToast(newState ? 'Dark mode enabled' : 'Dark mode disabled');
                      }} />
                      <div className="w-11 h-6 bg-border-base peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {activeModal === 'community' && (
                <div className="flex flex-col gap-4">
                  <div className="p-5 bg-gradient-to-r from-brand-50 to-white rounded-2xl border border-brand-100 flex gap-4 items-center shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-black text-text-primary mb-1">Active Citizen</h4>
                      <p className="text-sm font-medium text-text-secondary">Awarded for filing 10+ verified reports.</p>
                    </div>
                  </div>
                  
                  <div className="p-5 bg-surface-muted rounded-2xl border border-border-light flex gap-4 items-center opacity-70 grayscale">
                    <div className="w-14 h-14 rounded-2xl bg-border-base text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-black text-text-primary mb-1">Perfect Accuracy</h4>
                      <p className="text-sm font-medium text-text-secondary">Reach 95% accuracy rate (Current: {stats.accuracy}%)</p>
                    </div>
                  </div>
                  
                  <div className="text-center pt-6">
                    <p className="text-sm font-bold text-brand-600 bg-brand-50 inline-block px-4 py-2 rounded-full border border-brand-100">Keep reporting to unlock more badges!</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Cropper Overlay */}
      {imageSrc && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-surface-muted">
          <div className="relative flex-1">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="p-6 bg-surface-elevated flex gap-4 justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative z-10 border-t border-border-light">
            <button 
              onClick={() => setImageSrc(null)} 
              className="px-8 py-4 font-bold text-text-secondary bg-surface-muted hover:bg-border-light transition-colors rounded-2xl"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmCrop} 
              className="px-10 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/30"
            >
              Crop Picture
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-text-primary/60 backdrop-blur-md" onClick={() => !isDeleting && setShowDeleteConfirm(false)}></div>
          <div className="relative bg-surface-elevated w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200 border border-critical/10">
            <div className="w-20 h-20 rounded-full bg-critical/10 text-critical flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-text-primary mb-3">Delete Account?</h3>
            <p className="font-medium text-text-secondary mb-8 leading-relaxed">
              This action is permanent. Your personal profile will be completely erased, your identity unverified, and all your active reports will be immediately cancelled.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-4 bg-critical text-white font-black rounded-2xl transition-all hover:bg-critical/90 active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-critical/20"
              >
                {isDeleting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Yes, Delete Everything'}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="w-full py-4 bg-surface-muted hover:bg-border-light text-text-primary font-bold rounded-2xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  );
}

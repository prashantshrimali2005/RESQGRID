import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header, BottomNav, showToast } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { supabase, updateProfile, fetchReports, CivicReport } from '../supabase';
import Cropper, { Point, Area } from 'react-easy-crop';

// Helper to crop image
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
  
  // Edit Profile State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  // Cropper State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [pendingAvatarBase64, setPendingAvatarBase64] = useState<string | null>(null);

  // Stats State
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [stats, setStats] = useState({ total: 0, accuracy: 0, impact: '0.0' });

  // App Settings State (Mock Local)
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkEnabled, setDarkEnabled] = useState(() => localStorage.getItem('dashboard_dark_mode') === 'true');

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
      // 1. Wipe profile data
      await supabase.from('profiles').update({
        full_name: 'Deleted User',
        phone: null,
        address: null,
        avatar_url: null,
        is_verified: false
      }).eq('id', user.id);

      // 2. Cancel all user's reports
      await supabase.from('reports').update({
        status: 'Cancelled',
        cancellation_reason: 'Account Deleted'
      }).eq('user_id', user.id);

      // 3. Delete local avatar if exists
      localStorage.removeItem(`avatar_${user.id}`);
      
      // 4. Sign out
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

  const emailName = user?.email?.split('@')[0] || 'Citizen';
  const initial = profile?.full_name?.charAt(0).toUpperCase() || emailName.charAt(0).toUpperCase();
  const displayAvatar = pendingAvatarBase64 || localAvatar || profile?.avatar_url;

  return (
    <div className={darkEnabled ? "dark" : ""}>
      <Header title="Profile" showBrand={false} showBack={true} />
      <main className="flex-1 flex flex-col relative w-full pt-20 pb-24 md:pb-8 md:ml-24 bg-surface dark:bg-slate-900 min-h-screen transition-colors duration-300">
        <div className="w-full max-w-2xl mx-auto flex flex-col px-margin gap-space-lg pt-space-md">

          {/* Profile Card */}
          <section>
            <div className="relative rounded-3xl bg-surface-container-lowest dark:bg-slate-800 p-space-lg shadow-xl shadow-surface-container-highest/30 dark:shadow-black/40 border border-outline-variant/20 dark:border-slate-700 overflow-hidden flex flex-col items-center text-center transition-colors">
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-primary/10 to-tertiary/10 dark:from-blue-900/30 dark:to-emerald-900/30"></div>
              
              <div className="relative mt-4 mb-4">
                <div className="w-24 h-24 rounded-full p-1 bg-surface-container-lowest dark:bg-slate-800 shadow-md border border-outline-variant/10 dark:border-slate-700 relative z-10 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[3px] border-transparent" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-tertiary)) border-box', WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'destination-out', maskComposite: 'exclude' }}></div>
                  
                  {displayAvatar ? (
                    <img alt="Profile" className="w-full h-full rounded-full object-cover relative z-10" src={displayAvatar} />
                  ) : (
                    <div className="w-full h-full rounded-full bg-primary dark:bg-blue-600 text-on-primary flex items-center justify-center text-3xl font-bold relative z-10">
                      {initial}
                    </div>
                  )}
                  
                  <button onClick={() => setActiveModal('personalInfo')} className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-surface-container-lowest dark:bg-slate-700 flex items-center justify-center shadow-lg z-20 hover:scale-110 transition-transform">
                    <div className="w-5 h-5 rounded-full bg-primary dark:bg-blue-600 text-on-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[12px]">edit</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1 relative z-10">
                <h2 className="font-headline-sm text-headline-sm text-on-surface dark:text-white font-bold tracking-tight">{profile?.full_name || emailName}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-300">{profile?.address || 'No Address Set'}</p>
              </div>
              
              <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full bg-tertiary-container/30 dark:bg-emerald-900/30 text-tertiary dark:text-emerald-400 font-label-sm text-label-sm font-bold uppercase tracking-wider border border-tertiary/20 dark:border-emerald-800/30 backdrop-blur-sm cursor-pointer hover:bg-tertiary-container/50 dark:hover:bg-emerald-900/50 transition-colors" onClick={() => setActiveModal('community')}>
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                <span>Active Citizen</span>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full mt-6 pt-6 border-t border-outline-variant/10 dark:border-slate-700 relative z-10">
                <div className="flex flex-col items-center">
                  <span className="font-title-lg text-title-lg text-on-surface dark:text-white font-bold">{stats.total}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant dark:text-slate-400">Reports</span>
                </div>
                <div className="flex flex-col items-center border-l border-r border-outline-variant/20 dark:border-slate-700">
                  <span className="font-title-lg text-title-lg text-on-surface dark:text-white font-bold">{stats.accuracy}%</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant dark:text-slate-400">Accuracy</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-title-lg text-title-lg text-on-surface dark:text-white font-bold">{stats.impact}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant dark:text-slate-400">Impact</span>
                </div>
              </div>
            </div>
          </section>

          {/* Menus */}
          <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400 font-bold uppercase tracking-widest pl-4">Account</h3>
              <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-2xl shadow-sm border border-outline-variant/20 dark:border-slate-700 overflow-hidden transition-colors">
                <button onClick={() => setActiveModal('personalInfo')} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low dark:hover:bg-slate-700 transition-colors active:bg-surface-container dark:active:bg-slate-600 border-b border-outline-variant/10 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-blue-900/40 text-primary dark:text-blue-400 flex items-center justify-center"><span className="material-symbols-outlined">person</span></div>
                    <span className="font-title-md text-title-md text-on-surface dark:text-white font-medium">Personal Information</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400">chevron_right</span>
                </button>
                <button onClick={() => setActiveModal('identity')} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low dark:hover:bg-slate-700 transition-colors active:bg-surface-container dark:active:bg-slate-600 border-b border-outline-variant/10 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 dark:bg-slate-600/40 text-secondary dark:text-slate-300 flex items-center justify-center"><span className="material-symbols-outlined">verified_user</span></div>
                    <span className="font-title-md text-title-md text-on-surface dark:text-white font-medium">Identity Verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile?.is_verified ? (
                      <span className="font-label-sm text-label-sm bg-tertiary-container dark:bg-emerald-900 text-on-tertiary-container dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">Verified</span>
                    ) : (
                      <span className="font-label-sm text-label-sm bg-error-container dark:bg-red-900 text-on-error-container dark:text-red-200 px-2 py-0.5 rounded-full font-bold">Unverified</span>
                    )}
                    <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400">chevron_right</span>
                  </div>
                </button>
                <button onClick={() => setActiveModal('appSettings')} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low dark:hover:bg-slate-700 transition-colors active:bg-surface-container dark:active:bg-slate-600">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high dark:bg-slate-600 text-on-surface dark:text-white flex items-center justify-center"><span className="material-symbols-outlined">settings</span></div>
                    <span className="font-title-md text-title-md text-on-surface dark:text-white font-medium">App Settings</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400">chevron_right</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400 font-bold uppercase tracking-widest pl-4">Civic Engagement</h3>
              <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-2xl shadow-sm border border-outline-variant/20 dark:border-slate-700 overflow-hidden transition-colors">
                <button onClick={() => navigate('/dashboard')} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low dark:hover:bg-slate-700 transition-colors active:bg-surface-container dark:active:bg-slate-600 border-b border-outline-variant/10 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-tertiary/10 dark:bg-emerald-900/40 text-tertiary dark:text-emerald-400 flex items-center justify-center"><span className="material-symbols-outlined">history</span></div>
                    <span className="font-title-md text-title-md text-on-surface dark:text-white font-medium">My Report History</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400">chevron_right</span>
                </button>
                
                <button onClick={() => setActiveModal('community')} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low dark:hover:bg-slate-700 transition-colors active:bg-surface-container dark:active:bg-slate-600">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-error/10 dark:bg-red-900/40 text-error dark:text-red-400 flex items-center justify-center"><span className="material-symbols-outlined">volunteer_activism</span></div>
                    <span className="font-title-md text-title-md text-on-surface dark:text-white font-medium">Community Contributions</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400">chevron_right</span>
                </button>
              </div>
            </div>
            
            <button onClick={handleSignOut} className="w-full mt-2 py-3 rounded-xl bg-surface-container-lowest dark:bg-slate-800 border border-error/20 dark:border-red-900 text-error dark:text-red-400 font-title-md text-title-md hover:bg-error/5 dark:hover:bg-red-900/20 active:scale-95 transition-all font-bold flex items-center justify-center gap-2 shadow-sm">
              <span className="material-symbols-outlined">logout</span>
              Sign Out
            </button>
            
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              className="w-full py-3 rounded-xl bg-error/10 hover:bg-error/20 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-error dark:text-red-400 font-title-md font-bold flex items-center justify-center gap-2 transition-colors border border-error/20 dark:border-red-900/50 shadow-sm"
            >
              <span className="material-symbols-outlined">delete_forever</span>
              Delete Account
            </button>
            
            <div className="text-center font-label-sm text-[11px] text-on-surface-variant/60 dark:text-slate-500 pb-8 mt-4">
              RESQGRID v2.1.0 (Build 9021)<br/>Developed by Department of Municipal Innovation
            </div>
          </section>

        </div>
      </main>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-scrim/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
          
          <div className="relative bg-surface-container-lowest dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/10 dark:border-slate-700">
              <h3 className="font-title-lg text-title-lg text-on-surface dark:text-white font-bold">
                {activeModal === 'personalInfo' && 'Personal Information'}
                {activeModal === 'identity' && 'Identity Verification'}
                {activeModal === 'appSettings' && 'App Settings'}
                {activeModal === 'community' && 'Community Contributions'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high dark:hover:bg-slate-700 transition-colors text-on-surface-variant dark:text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-space-lg overflow-y-auto">
              
              {activeModal === 'personalInfo' && (
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                  <div>
                    <label className="block font-label-md text-on-surface dark:text-slate-200 mb-1">Profile Picture (Optional)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full font-body-sm text-on-surface-variant dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-primary-container dark:file:bg-blue-900 file:text-on-primary-container dark:file:text-blue-100 hover:file:bg-primary/20 dark:hover:file:bg-blue-800"
                    />
                    {pendingAvatarBase64 && (
                      <div className="mt-2 text-primary dark:text-blue-400 font-label-sm font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Cropped image ready to save
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-label-md text-on-surface dark:text-slate-200 mb-1">Full Name</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-surface-container dark:bg-slate-700 text-on-surface dark:text-white border border-outline-variant/30 dark:border-slate-600 focus:border-primary dark:focus:border-blue-500 focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block font-label-md text-on-surface dark:text-slate-200 mb-1">Phone Number</label>
                    <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-surface-container dark:bg-slate-700 text-on-surface dark:text-white border border-outline-variant/30 dark:border-slate-600 focus:border-primary dark:focus:border-blue-500 focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block font-label-md text-on-surface dark:text-slate-200 mb-1">Address</label>
                    <textarea value={editAddress} onChange={e => setEditAddress(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-surface-container dark:bg-slate-700 text-on-surface dark:text-white border border-outline-variant/30 dark:border-slate-600 focus:border-primary dark:focus:border-blue-500 focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 outline-none transition-all resize-none h-24" />
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full mt-2 py-3 bg-primary dark:bg-blue-600 text-on-primary rounded-xl font-title-md font-bold hover:bg-primary/90 dark:hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70 flex justify-center">
                    {isSaving ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'Save Changes'}
                  </button>
                </form>
              )}

              {activeModal === 'identity' && (
                <div className="flex flex-col items-center text-center py-4 gap-4">
                  {profile?.is_verified ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-tertiary-container dark:bg-emerald-900 text-on-tertiary-container dark:text-emerald-200 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[40px]">verified</span>
                      </div>
                      <h4 className="font-title-lg text-title-lg font-bold text-on-surface dark:text-white">Verified Citizen</h4>
                      <p className="font-body-md text-on-surface-variant dark:text-slate-300">Your identity has been confirmed by the municipal network. You have full access to reporting features.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-error-container dark:bg-red-900 text-on-error-container dark:text-red-200 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[40px]">gpp_maybe</span>
                      </div>
                      <h4 className="font-title-lg text-title-lg font-bold text-on-surface dark:text-white">Unverified</h4>
                      <p className="font-body-md text-on-surface-variant dark:text-slate-300">Please complete your profile information to verify your identity.</p>
                      <button onClick={() => {setActiveModal('personalInfo')}} className="mt-4 px-6 py-2 bg-primary dark:bg-blue-600 text-on-primary rounded-full font-bold">Complete Profile</button>
                    </>
                  )}
                </div>
              )}

              {activeModal === 'appSettings' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-title-md font-bold text-on-surface dark:text-white">Push Notifications</h4>
                      <p className="font-body-sm text-on-surface-variant dark:text-slate-400">Get alerts for report updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={pushEnabled} onChange={() => setPushEnabled(!pushEnabled)} />
                      <div className="w-11 h-6 bg-surface-container-highest dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-title-md font-bold text-on-surface dark:text-white">Dark Mode</h4>
                      <p className="font-body-sm text-on-surface-variant dark:text-slate-400">Toggle dark theme</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={darkEnabled} onChange={() => {
                        const newState = !darkEnabled;
                        setDarkEnabled(newState);
                        localStorage.setItem('dashboard_dark_mode', String(newState));
                        showToast(newState ? 'Dark mode enabled for dashboard' : 'Dark mode disabled for dashboard');
                      }} />
                      <div className="w-11 h-6 bg-surface-container-highest dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between opacity-50">
                    <div>
                      <h4 className="font-title-md font-bold text-on-surface dark:text-white">Location Services</h4>
                      <p className="font-body-sm text-on-surface-variant dark:text-slate-400">Required for map features</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-not-allowed">
                      <input type="checkbox" className="sr-only peer" checked={true} disabled />
                      <div className="w-11 h-6 bg-primary dark:bg-blue-500 peer-focus:outline-none rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:translate-x-[20px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>
              )}

              {activeModal === 'community' && (
                <div className="flex flex-col gap-6">
                  <div className="p-4 bg-tertiary-container/30 dark:bg-emerald-900/30 rounded-2xl border border-tertiary/20 dark:border-emerald-800 flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-tertiary dark:bg-emerald-600 text-on-tertiary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    </div>
                    <div>
                      <h4 className="font-title-md font-bold text-on-surface dark:text-white">Active Citizen</h4>
                      <p className="font-body-sm text-on-surface-variant dark:text-slate-300">Awarded for filing 10+ verified reports.</p>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-container dark:bg-slate-700 rounded-2xl flex gap-4 items-center opacity-70">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest dark:bg-slate-600 text-on-surface-variant dark:text-slate-300 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]">verified</span>
                    </div>
                    <div>
                      <h4 className="font-title-md font-bold text-on-surface dark:text-white">Perfect Accuracy</h4>
                      <p className="font-body-sm text-on-surface-variant dark:text-slate-300">Reach 95% accuracy rate (Current: {stats.accuracy}%)</p>
                    </div>
                  </div>
                  <div className="text-center pt-4">
                    <p className="font-label-md text-primary dark:text-blue-400 font-bold">Keep reporting to unlock more badges!</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Cropper Overlay */}
      {imageSrc && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-surface dark:bg-slate-900">
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
          <div className="p-4 bg-surface-container-lowest dark:bg-slate-800 flex gap-4 justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-black/50 relative z-10">
            <button 
              onClick={() => setImageSrc(null)} 
              className="px-6 py-3 font-title-md font-bold text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-slate-700 transition-colors rounded-xl"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmCrop} 
              className="px-8 py-3 bg-primary dark:bg-blue-600 text-on-primary font-title-md font-bold rounded-xl hover:bg-primary/90 dark:hover:bg-blue-700 transition-colors shadow-sm"
            >
              Crop Picture
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-scrim/60 dark:bg-black/80 backdrop-blur-md" onClick={() => !isDeleting && setShowDeleteConfirm(false)}></div>
          <div className="relative bg-surface-container-lowest dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-space-lg text-center animate-in fade-in zoom-in-95 duration-200 border border-error/20 dark:border-red-900/50">
            <div className="w-16 h-16 rounded-full bg-error-container/50 dark:bg-red-900/30 text-error dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <h3 className="font-headline-sm font-bold text-on-surface dark:text-white mb-2">Delete Account?</h3>
            <p className="font-body-md text-on-surface-variant dark:text-slate-300 mb-6">
              This action is permanent. Your personal profile will be completely erased, your identity unverified, and all your active reports will be immediately cancelled and removed from public view.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-3 bg-error dark:bg-red-600 text-white font-bold rounded-xl transition-colors hover:bg-error/90 dark:hover:bg-red-700 flex justify-center items-center gap-2"
              >
                {isDeleting ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'Yes, Delete Everything'}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="w-full py-3 bg-surface-container hover:bg-surface-container-high dark:bg-slate-700 dark:hover:bg-slate-600 text-on-surface dark:text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

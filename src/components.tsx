import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { fetchReports } from './supabase';
import { generateAlerts, Alert } from './pages/alerts';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40" fill="none">
      <rect x="4" y="6" width="28" height="28" rx="8" fill="#E11D48"/>
      <path d="M18 11V29M9 20H27" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
      <circle cx="18" cy="20" r="11" stroke="white" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="2 2"/>
      <text x="40" y="26" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="20" letterSpacing="0.05em" fill="currentColor">RESQ<tspan fill="#E11D48">GRID</tspan></text>
    </svg>
  );
}

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showBrand?: boolean;
}

export function Header({ title = '', showBack = false, showBrand = true }: HeaderProps) {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [headerAlerts, setHeaderAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user) {
      fetchReports(user.id).then(reports => {
        const generated = generateAlerts(reports || []);
        setHeaderAlerts(generated.slice(0, 3));
        setUnreadCount(generated.filter(a => !a.isRead).length);
      });
    }
  }, [user, showNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current && !popupRef.current.contains(event.target as Node) &&
        btnRef.current && !btnRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadAvatar = () => {
      if (user) {
        const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
        if (savedAvatar) {
          setLocalAvatar(savedAvatar);
        }
      }
    };
    
    loadAvatar();
    window.addEventListener('avatarChanged', loadAvatar);
    return () => window.removeEventListener('avatarChanged', loadAvatar);
  }, [user]);

  const emailName = user?.email?.split('@')[0] || 'Citizen';
  const initial = profile?.full_name?.charAt(0).toUpperCase() || emailName.charAt(0).toUpperCase();
  const displayAvatar = localAvatar || profile?.avatar_url;

  return (
    <header className="fixed top-0 w-full md:w-[calc(100%-6rem)] md:ml-24 z-50 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-[0_1px_4px_rgba(0,0,0,0.02)] border-b border-outline-variant/20 dark:border-slate-700 pt-safe transition-all">
      <div className="h-20 px-margin flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          {showBack && (
            <button aria-label="Go back" className="w-11 h-11 -ml-space-xs flex items-center justify-center rounded-full text-on-surface dark:text-white hover:bg-surface-container-high dark:hover:bg-slate-800 transition-colors active:scale-95" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          )}
          {showBrand && (
            <div className="flex items-center gap-space-xs group cursor-pointer" onClick={() => navigate('/dashboard')}>
              <Logo className="h-8 w-auto text-on-surface dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" />
            </div>
          )}
          {title && !showBrand && (
            <h1 className="font-headline-sm text-headline-sm text-on-surface dark:text-white tracking-tight truncate">{title}</h1>
          )}
        </div>
        <div className="flex items-center gap-space-sm relative">
          <button ref={btnRef} onClick={() => setShowNotifications(!showNotifications)} className="relative w-11 h-11 flex items-center justify-center rounded-full bg-surface-container-lowest dark:bg-slate-800 shadow-sm text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 hover:bg-surface-bright dark:hover:bg-slate-700 transition-colors" type="button">
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-container-lowest"></span>
            )}
          </button>
          
          {showNotifications && (
            <div ref={popupRef} className="absolute top-14 right-0 w-80 md:w-96 bg-surface-container-lowest/95 dark:bg-slate-800/95 backdrop-blur-3xl rounded-2xl shadow-2xl border border-outline-variant/20 dark:border-slate-700 overflow-hidden z-[100] transform origin-top-right transition-all">
              <div className="flex items-center justify-between p-4 border-b border-outline-variant/10 dark:border-slate-700 bg-surface/50 dark:bg-slate-900/50">
                <h3 className="font-title-md text-title-md text-on-surface dark:text-white font-bold">Notifications</h3>
                <Link to="/notifications" className="text-primary dark:text-blue-400 font-label-sm text-label-sm hover:underline" onClick={() => setShowNotifications(false)}>View all</Link>
              </div>
              <div className="max-h-[60vh] overflow-y-auto no-scrollbar flex flex-col">
                {headerAlerts.length === 0 ? (
                  <div className="p-6 text-center text-on-surface-variant dark:text-slate-400 font-body-sm">
                    No new notifications.
                  </div>
                ) : (
                  headerAlerts.map(alert => (
                    <Link key={alert.id} to={`/tracking?id=${encodeURIComponent(alert.ticketId)}`} className="p-4 border-b border-outline-variant/5 dark:border-slate-700/50 flex gap-3 hover:bg-surface-container-low dark:hover:bg-slate-700/50 transition-colors group" onClick={() => setShowNotifications(false)}>
                      <div className={`w-10 h-10 rounded-full ${alert.iconBg} ${alert.iconColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <span className="material-symbols-outlined text-[20px]">{alert.icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`font-title-sm text-title-sm text-on-surface dark:text-white truncate ${!alert.isRead ? 'font-bold' : ''}`}>{alert.title}</span>
                        <span className="font-body-sm text-[12px] text-on-surface-variant dark:text-slate-300 line-clamp-2 mt-0.5">{alert.body}</span>
                        <span className={`font-label-sm text-[10px] mt-1 ${!alert.isRead ? 'text-primary dark:text-blue-400 font-bold' : 'text-on-surface-variant dark:text-slate-500'}`}>{alert.time}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <Link to="/notifications" className="p-3 bg-surface-container dark:bg-slate-700 text-center block" onClick={() => setShowNotifications(false)}>
                <span className="font-label-sm text-label-sm text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 transition-colors uppercase tracking-wider font-bold cursor-pointer">View all alerts</span>
              </Link>
            </div>
          )}

          <Link className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-primary to-tertiary shadow-sm hover:scale-105 transition-transform flex items-center justify-center overflow-hidden border-2 border-surface-container-lowest dark:border-slate-800" to="/profile">
            {displayAvatar ? (
              <img alt="Profile" className="w-full h-full rounded-full object-cover" src={displayAvatar} />
            ) : (
              <div className="w-full h-full rounded-full bg-primary-container dark:bg-blue-900 text-on-primary-container dark:text-blue-100 flex items-center justify-center font-bold text-lg">
                {initial}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

export interface BottomNavProps {
  active?: string;
}

export function BottomNav({ active }: BottomNavProps = {}) {
  const location = useLocation();
  const activePath = active || location.pathname.replace('/', '') || 'dashboard';

  const items = [
    { path: 'dashboard', icon: 'grid_view', label: 'Home', isFab: false },
    { path: 'map', icon: 'public', label: 'Incidents', isFab: false },
    { path: 'report', icon: 'campaign', label: 'Report', isFab: true },
    { path: 'resources', icon: 'inventory_2', label: 'Resources', isFab: false },
    { path: 'volunteers', icon: 'handshake', label: 'Volunteer', isFab: false },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 md:bottom-auto md:top-0 md:left-0 md:right-auto md:h-screen md:w-[96px] md:border-r md:border-outline-variant/20 dark:md:border-slate-700 z-50 md:bg-surface-container-lowest dark:md:bg-slate-800 bg-white/40 dark:bg-[#0f111a]/50 backdrop-blur-2xl md:rounded-none rounded-[32px] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border border-white/60 dark:border-white/10 md:border-none pb-safe md:pb-0 transition-colors duration-300">
      {/* Optional inset highlight for the glass edge on mobile */}
      <div className="absolute inset-0 rounded-[32px] pointer-events-none border border-white/30 dark:border-white/5 md:hidden"></div>
      
      <div className="relative flex items-center md:flex-col justify-around md:justify-center md:gap-3 h-[68px] md:h-full px-2 md:px-0 pt-1">
        
        {items.map(item => {
          if (item.isFab) {
            return (
              <div key={item.path} className="relative flex items-center justify-center -top-6 md:top-0 md:mb-6 z-10 px-2 shrink-0">
                <Link title={item.label} className="w-14 h-14 md:w-16 md:h-16 rounded-full md:rounded-2xl bg-gradient-to-tr from-primary to-blue-400 dark:from-blue-600 dark:to-blue-400 text-on-primary flex flex-col items-center justify-center shadow-[0_4px_16px_rgba(37,99,235,0.4)] dark:shadow-[0_4px_16px_rgba(37,99,235,0.6)] active:scale-95 transition-all hover:scale-105 hover:-translate-y-1 border border-white/20 dark:border-white/10" to={`/${item.path}`}>
                  <span className="material-symbols-outlined text-[28px] drop-shadow-sm">{item.icon}</span>
                </Link>
              </div>
            );
          }
          
          const isActive = activePath === item.path;
          return (
            <Link key={item.path} title={item.label} aria-current={isActive ? "page" : undefined} className={`group flex flex-col items-center justify-center min-w-[56px] md:w-full py-1 md:py-2 transition-all`} to={`/${item.path}`}>
              <div className={`relative flex items-center justify-center w-12 md:w-[64px] h-8 md:h-[36px] rounded-full transition-all duration-300 ${isActive ? 'bg-white/60 dark:bg-white/10 text-primary dark:text-blue-300 shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-none' : 'text-slate-600 dark:text-slate-400 group-hover:bg-white/40 dark:group-hover:bg-white/5 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}>{item.icon}</span>
              </div>
              <span className={`font-label-sm mt-1 text-[10px] md:text-[12px] font-medium transition-colors duration-300 ${isActive ? 'text-slate-800 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Pill gesture handle for mobile (Samsung One UI style) */}
      <div className="md:hidden flex justify-center pb-2.5 pt-0.5">
         <div className="w-16 h-[3px] bg-black/20 dark:bg-white/20 rounded-full shadow-[0_1px_2px_rgba(255,255,255,0.5)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.5)]"></div>
      </div>
    </nav>
  );
}

let toastTimeout: number | null = null;
export function showToast(message: string) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    document.body.appendChild(toast);
  }
  toast.className = 'fixed bottom-24 md:bottom-10 left-0 right-0 mx-auto w-max max-w-[calc(100vw-32px)] md:left-auto md:right-10 md:mx-0 md:max-w-sm z-[100] px-space-md py-space-sm rounded-xl bg-inverse-surface/95 dark:bg-slate-100/95 backdrop-blur-md text-inverse-on-surface dark:text-slate-900 font-title-sm text-title-sm shadow-2xl flex items-center gap-space-sm toast-in border border-outline-variant/20 dark:border-slate-300';
  toast.innerHTML = `<span class="material-symbols-outlined text-[20px] text-tertiary-fixed dark:text-emerald-600 shrink-0">check_circle</span><span class="break-words">${message}</span>`;
  if (toastTimeout) window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toast!.className = toast!.className.replace('toast-in', 'toast-out');
    window.setTimeout(() => { toast!.remove(); }, 300);
  }, 3500);
}

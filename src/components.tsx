import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { fetchReports } from './supabase';
import { generateAlerts, Alert } from './pages/alerts';
import { ShieldAlert } from 'lucide-react';
export * from './components/TilerMap';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-bold text-xl tracking-tight ${className}`}>
      <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center shrink-0">
        <ShieldAlert size={14} />
      </div>
      RESQGRID
    </div>
  );
}

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showBrand?: boolean;
}

export function Header({ title = '', showBack = false, showBrand = true }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
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

  const currentPath = location.pathname.replace('/', '') || 'dashboard';

  return (
    <header className="fixed top-0 left-0 w-full z-[60] bg-white shadow-sm border-b border-border-light pt-safe transition-all">
      <div className="h-20 px-4 md:px-8 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
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

        {/* Central Top Navigation (Matches Landing Page Style) */}
        <div className="hidden md:flex items-center gap-2">
          {[
            { path: 'dashboard', label: 'Dashboard' },
            { path: 'map', label: 'Live Map' },
            { path: 'report', label: 'Report' },
            { path: 'resources', label: 'Resources' },
            { path: 'volunteers', label: 'Volunteer' },
          ].map(item => {
            const isActive = currentPath === item.path;
            return (
              <Link 
                key={item.path} 
                to={`/${item.path}`} 
                className={`font-semibold text-sm px-4 py-2 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-brand-50 text-brand-600 shadow-sm ring-1 ring-brand-100' 
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
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
    { path: 'dashboard', icon: 'grid_view', label: 'Home' },
    { path: 'map', icon: 'public', label: 'Incidents' },
    { path: 'report', icon: 'campaign', label: 'Report' },
    { path: 'resources', icon: 'inventory_2', label: 'Resources' },
    { path: 'volunteers', icon: 'handshake', label: 'Volunteer' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border-light z-50 bg-white pb-safe transition-colors duration-300">
      
      <div className="relative flex items-center justify-around h-[72px] px-2">
        
        {items.map(item => {
          const isActive = activePath === item.path;
          return (
            <Link key={item.path} title={item.label} aria-current={isActive ? "page" : undefined} className={`group flex flex-col items-center justify-center w-full transition-all`} to={`/${item.path}`}>
              <div className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl transition-all duration-300 ${isActive ? 'bg-brand-600 text-white shadow-md' : 'text-text-secondary bg-transparent group-hover:bg-brand-50 group-hover:text-brand-600'}`}>
                <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}>{item.icon}</span>
              </div>
              <span className={`mt-1.5 text-[10px] md:text-xs font-bold transition-colors duration-300 ${isActive ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Pill gesture handle for mobile (Samsung One UI style) */}
      <div className="md:hidden flex justify-center pb-2 pt-1">
         <div className="w-16 h-[3px] bg-black/20 rounded-full"></div>
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

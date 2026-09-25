import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile, fetchProfile } from '../supabase';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then((p) => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Protected route and verification logic
  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/home', '/login', '/how-it-works', '/about', '/privacy-policy', '/terms-of-service', '/report-an-issue'];
    const isPublic = publicPaths.includes(location.pathname) || location.pathname === '/';
    const isAdminRoute = location.pathname.startsWith('/admin');

    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase() || 'prashantshrimali2005@gmail.com';

    if (isAdminRoute) {
      if (location.pathname === '/admin/login') {
        if (user && user.email?.toLowerCase() === adminEmail) {
          navigate('/admin', { replace: true });
        }
        return; // Allow unauthenticated users on admin login page
      }
      
      // For /admin or other admin sub-routes
      if (!user || user.email?.toLowerCase() !== adminEmail) {
        navigate('/admin/login', { replace: true });
        return;
      }
      return; // Admin is authorized
    }

    // Intercept Admin if Supabase OAuth defaults to landing page
    if (user && user.email?.toLowerCase() === adminEmail) {
      if (location.pathname === '/' || location.pathname === '/home' || location.pathname === '/login') {
        navigate('/admin', { replace: true });
        return;
      }
    }

    // Public app routing
    if (!user && !isPublic) {
      navigate('/login', { replace: true });
    } else if (user && profile) {
      // If user is logged in but not verified, redirect to onboarding (unless they are already there or signing out)
      if (!profile.is_verified && location.pathname !== '/onboarding') {
        navigate('/onboarding', { replace: true });
      } else if (profile.is_verified && location.pathname === '/onboarding') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, loading, location.pathname, navigate]);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

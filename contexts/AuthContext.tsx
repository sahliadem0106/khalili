import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from '../types';
import { MOCK_USER } from '../constants';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  rawUser: SupabaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  isPremium: boolean;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [rawUser, setRawUser] = useState<SupabaseUser | null>(null);
  const [appUser, setAppUser] = useState<User | null>(MOCK_USER);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check for existing Supabase session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          handleSession(session);
        } else {
          // Check if user was in "Guest Mode" previously
          const savedGuest = localStorage.getItem('muslimDaily_isGuest');
          if (savedGuest === 'true') {
            setIsGuest(true);
            setAppUser({ ...MOCK_USER, name: "Guest Believer" });
          }
        }
      } catch (e) {
        console.error("Auth Init Error:", e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handleSession(session);
        setIsGuest(false);
        localStorage.removeItem('muslimDaily_isGuest');
      } else if (!isGuest) {
        // Only reset if we aren't explicitly in guest mode
        setSession(null);
        setRawUser(null);
        setAppUser(MOCK_USER);
        setIsPremium(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isGuest]);

  const handleSession = async (session: Session) => {
    setSession(session);
    setRawUser(session.user);
    await fetchProfile(session.user.id, session.user);
  };

  const fetchProfile = async (userId: string, authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setAppUser({
          name: data.display_name || authUser.user_metadata?.full_name || 'Believer',
          location: data.location_city || 'Unknown Location',
          avatar: data.avatar_url || authUser.user_metadata?.avatar_url || MOCK_USER.avatar,
          hijriDate: MOCK_USER.hijriDate,
          currentHeartState: undefined,
          email: authUser.email
        });
        setIsPremium(data.tier === 'mukhlis');
      } else {
        // Fallback if profile doesn't exist yet
        setAppUser({
            ...MOCK_USER,
            name: authUser.user_metadata?.full_name || 'Believer',
            email: authUser.email
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const signInWithGoogle = async () => {
    // SECURITY CHECK: Google blocks Auth inside Iframes (Preview Windows)
    if (window.self !== window.top) {
        alert("Security Notice: Google Sign-In cannot run inside this Preview window.\n\nPlease click 'Open in New Tab' (top right corner) to sign in securely.");
        return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      alert(`Login failed: ${error.message}`);
    }
  };

  const signInAnonymously = async () => {
    // Local Guest Mode (No Backend Call needed for basic features)
    setIsGuest(true);
    setAppUser({ ...MOCK_USER, name: "Guest Believer" });
    localStorage.setItem('muslimDaily_isGuest', 'true');
    setLoading(false);
  };

  const signOut = async () => {
    if (isGuest) {
      setIsGuest(false);
      localStorage.removeItem('muslimDaily_isGuest');
      setAppUser(MOCK_USER);
    } else {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      rawUser, 
      user: appUser, 
      loading, 
      signInWithGoogle, 
      signInAnonymously, 
      signOut,
      isPremium,
      isGuest
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
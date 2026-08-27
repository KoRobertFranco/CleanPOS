import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type Role = 'admin' | 'manager' | 'cashier';

export interface StaffProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  initials: string;
  permissions: string[];
}

interface AuthValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  hasPermission: (permission: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (session: Session | null): Promise<AuthUser | null> => {
    if (!session?.user) return null;

    const { data: profile, error } = await supabase
      .from('staff_profiles')
      .select('id, email, full_name, role, is_active')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error || !profile) return null;
    if (!profile.is_active) return null;

    const { data: perms } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', profile.role);

    const permissions = (perms ?? []).map((p) => p.permission_id);

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role as Role,
      initials: getInitials(profile.full_name),
      permissions,
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      const profile = await loadProfile(session);
      if (!mounted) return;
      setUser(profile);
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        const profile = await loadProfile(session);
        if (mounted) setUser(profile);
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign-up failed. Please try again.' };

    const { error: rpcError } = await supabase.rpc('create_staff_profile', {
      p_email: email.trim().toLowerCase(),
      p_full_name: fullName,
      p_role: 'cashier',
    });
    if (rpcError) return { error: rpcError.message };

    return { error: null };
  };

  const signOut = useCallback(() => {
    (async () => {
      await supabase.auth.signOut();
      setUser(null);
    })();
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      return user.permissions.includes(permission);
    },
    [user],
  );

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const profile = await loadProfile(session);
    setUser(profile);
  }, [loadProfile]);

  const value: AuthValue = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    hasPermission,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

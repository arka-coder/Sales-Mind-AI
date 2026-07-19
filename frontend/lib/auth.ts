/**
 * SalesMind AI — Auth utilities (Supabase)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
};

// ── Sign Up ──────────────────────────────────────────────
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  return { data, error };
}

// ── Sign In ──────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// ── Sign Out ─────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// ── Get current session ──────────────────────────────────
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

// ── Get current user ─────────────────────────────────────
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    full_name: user.user_metadata?.full_name,
    avatar_url: user.user_metadata?.avatar_url,
  };
}

// ── Reset password ───────────────────────────────────────
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

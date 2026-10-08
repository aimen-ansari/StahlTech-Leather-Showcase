import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/withTimeout';

const AuthContext = createContext(null);

// Guard so the "Verifying Secure Session" screen can never spin forever on a
// slow or stalled connection (supabase-js requests have no built-in timeout).
const SESSION_TIMEOUT_MS = 10000;
const ROLE_TIMEOUT_MS = 15000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_TIMEOUT_MS,
          'Session check timed out.'
        );
        if (session) {
          await checkAdminRole(session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        // Timed out or the session check failed: render the app anyway instead
        // of hanging on the loading screen forever.
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    };
    initializeAuth();

    // IMPORTANT: never call supabase.auth.* or run an authenticated request
    // from inside this callback. supabase-js *awaits* auth-state callbacks
    // while it still holds its internal auth lock, so any authenticated call
    // made here (it needs the same lock) deadlocks until it times out — which
    // then flips isAdmin to false and kicks a logged-in admin to /login.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        // Defer the role lookup so it runs after the emit finishes and the
        // auth lock is released.
        setTimeout(() => checkAdminRole(session.user), 0);
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdminRole(supabaseUser) {
    try {
      setUser(supabaseUser);
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('role')
          .eq('id', supabaseUser.id)
          .single(),
        ROLE_TIMEOUT_MS,
        'Role check timed out.'
      );

      if (error) {
        // A transient failure must NOT sign an admin out: keep the previous
        // admin state so a flaky role check can't boot them to the login page.
        console.error('Role check failed:', error.message);
        return;
      }
      setIsAdmin(data?.role === 'admin');
    } catch (err) {
      // Timeout or network error: keep the last known state instead of logging out.
      console.error('Role check error:', err?.message || err);
    } finally {
      setLoading(false); // Fixes the infinite loading pulse
    }
  }

  const login = async (email, password) => supabase.auth.signInWithPassword({ email, password });
  const logout = async () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, isAdmin, isAuthenticated: Boolean(user), loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
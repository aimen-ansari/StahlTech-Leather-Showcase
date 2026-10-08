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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await checkAdminRole(session.user);
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

      if (!error && data?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      setIsAdmin(false);
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
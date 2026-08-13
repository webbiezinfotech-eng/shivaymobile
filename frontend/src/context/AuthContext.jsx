import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as authService from '../services/authService';
import { ApiError } from '../services/api';

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'shivay_auth_user';
const AUTH_REFRESH_GAP_MS = 5 * 60 * 1000;

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeUser(user) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);
  const lastAuthRefreshRef = useRef(0);
  const authInFlightRef = useRef(false);

  const refreshUser = useCallback(async ({ silent = false, force = false } = {}) => {
    if (silent && !force) {
      const now = Date.now();
      if (now - lastAuthRefreshRef.current < AUTH_REFRESH_GAP_MS) {
        return readStoredUser();
      }
    }

    if (authInFlightRef.current) {
      return readStoredUser();
    }

    authInFlightRef.current = true;

    try {
      const data = await authService.getCurrentUser();
      setUser(data.user);
      storeUser(data.user);
      lastAuthRefreshRef.current = Date.now();
      return data.user;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        storeUser(null);
      } else if (!silent && !readStoredUser()) {
        setUser(null);
      }
      return readStoredUser();
    } finally {
      authInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    refreshUser({ force: true }).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        refreshUser({ silent: true });
      }
    };

    document.addEventListener('visibilitychange', handleResume);

    return () => {
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, [refreshUser]);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setUser(data.user);
    storeUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    storeUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isOwner: user?.role === 'owner',
      isSameer: user?.role === 'sameer',
      login,
      logout,
      refreshUser,
    }),
    [user, loading, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

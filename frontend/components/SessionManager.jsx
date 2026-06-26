'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// --- Helper functions (copy from lib/auth or define here) ---
const TOKEN_KEY = 'auth_token';
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};
const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('auth_user');
  }
};
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch { return true; }
};
// ------------------------------------------------------------

const SESSION_CHECK_INTERVAL = 60000; // Check every 1 minute

export default function SessionManager({ children }) {
  const router = useRouter();

  useEffect(() => {
    const checkSession = () => {
      const token = getAuthToken();
      if (!token) return;

      if (isTokenExpired(token)) {
        removeAuthToken();
        router.push('/login');
        return;
      }
    };

    checkSession();
    const intervalId = setInterval(checkSession, SESSION_CHECK_INTERVAL);
    return () => clearInterval(intervalId);
  }, [router]);

  return <>{children}</>;
}

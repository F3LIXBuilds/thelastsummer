import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    api('/auth/me').then(setMe).catch(() => setMe(null)).finally(() => setLoading(false));
    const onExpired = () => { setMe(null); setExpired(true); };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const authed = useCallback(async (path, body) => { const d = await api(path, { method: 'POST', body }); setExpired(false); setMe(d); return d; }, []);
  const value = {
    user: me?.user ?? null,
    profile: me?.profile ?? null,
    loading, expired,
    login: (b) => authed('/auth/login', b),
    register: (b) => authed('/auth/register', b),
    logout: async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); setMe(null); },
    saveProfile: async (b) => setMe(await api('/profile', { method: 'PUT', body: b })),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

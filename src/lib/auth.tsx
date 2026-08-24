import { createContext, useContext, useState, type ReactNode } from 'react';

export interface User {
  name: string;
  role: string;
  initials: string;
}

interface AuthValue {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

const DEMO_ACCOUNTS = [
  { email: 'cashier@minimart.mm', password: 'minimart123', name: 'Alex Morgan', role: 'Cashier' },
  { email: 'admin@minimart.mm', password: 'minimart123', name: 'Sarah Lee', role: 'Manager' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    const account = DEMO_ACCOUNTS.find(
      (a) => a.email === email.trim().toLowerCase() && a.password === password,
    );
    if (!account) return false;
    const initials = account.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    setUser({ name: account.name, role: account.role, initials });
    return true;
  };

  const logout = () => setUser(null);

  const value: AuthValue = { user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export const DEMO_CREDENTIALS = DEMO_ACCOUNTS;

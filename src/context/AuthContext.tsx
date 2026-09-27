import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from './ToastContext';
import type { Address, Order, User } from '../lib/types';

interface SessionUser {
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  addresses: Address[];
  orders: Order[];
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<SessionUser>) => void;
  updatePassword: (newPassword: string) => boolean;
  addAddress: (address: Omit<Address, 'id'>) => void;
  removeAddress: (id: string) => void;
  placeOrder: (order: Order) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useLocalStorage<User[]>('sucre_users', []);
  const [session, setSession] = useLocalStorage<SessionUser | null>('sucre_session', null);
  const [addresses, setAddresses] = useLocalStorage<Address[]>('sucre_addresses', []);
  const [orders, setOrders] = useLocalStorage<Order[]>('sucre_orders', []);
  const { showToast } = useToast();

  const login = useCallback(
    (email: string, password: string) => {
      try {
        const list = Array.isArray(users) ? users : [];
        const found = list.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (!found) {
          showToast('Invalid email or password');
          return false;
        }
        setSession({ name: found.name, email: found.email, phone: found.phone });
        showToast(`Welcome back, ${found.name.split(' ')[0]}`);
        return true;
      } catch (err) {
        console.error('[Auth] login error', err);
        showToast('Something went wrong. Please try again.');
        return false;
      }
    },
    [users, setSession, showToast]
  );

  const register = useCallback(
    (name: string, email: string, password: string) => {
      try {
        const list = Array.isArray(users) ? users : [];
        if (list.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          showToast('An account with this email already exists');
          return false;
        }
        const newUser: User = { name, email, password };
        setUsers((prev) => [...(Array.isArray(prev) ? prev : []), newUser]);
        setSession({ name, email });
        showToast(`Welcome to SUCRÉ, ${name.split(' ')[0]}`);
        return true;
      } catch (err) {
        console.error('[Auth] register error', err);
        showToast('Something went wrong. Please try again.');
        return false;
      }
    },
    [users, setUsers, setSession, showToast]
  );

  const logout = useCallback(() => {
    setSession(null);
    showToast('Signed out');
  }, [setSession, showToast]);

  const updateProfile = useCallback(
    (updates: Partial<SessionUser>) => {
      setSession((prev) => (prev ? { ...prev, ...updates } : prev));
      setUsers((prev) =>
        (Array.isArray(prev) ? prev : []).map((u) =>
          session && u.email === session.email ? { ...u, ...updates } : u
        )
      );
      showToast('Profile updated');
    },
    [session, setSession, setUsers, showToast]
  );

  const updatePassword = useCallback(
    (newPassword: string) => {
      const list = Array.isArray(users) ? users : [];
      const found = list.some((u) => session && u.email === session.email);
      if (!found) {
        showToast('Something went wrong. Please try again.');
        return false;
      }
      setUsers((prev) =>
        (Array.isArray(prev) ? prev : []).map((u) =>
          session && u.email === session.email ? { ...u, password: newPassword } : u
        )
      );
      showToast('Password updated');
      return true;
    },
    [users, session, setUsers, showToast]
  );

  const addAddress = useCallback(
    (address: Omit<Address, 'id'>) => {
      const id = `addr_${Date.now()}`;
      setAddresses((prev) => [...prev, { ...address, id }]);
      showToast('Address saved');
    },
    [setAddresses, showToast]
  );

  const removeAddress = useCallback(
    (id: string) => {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    },
    [setAddresses]
  );

  const placeOrder = useCallback(
    (order: Order) => {
      setOrders((prev) => [order, ...prev]);
    },
    [setOrders]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session,
      isAuthenticated: Boolean(session),
      addresses,
      orders,
      login,
      register,
      logout,
      updateProfile,
      updatePassword,
      addAddress,
      removeAddress,
      placeOrder,
    }),
    [session, addresses, orders, login, register, logout, updateProfile, updatePassword, addAddress, removeAddress, placeOrder]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

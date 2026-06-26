'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff' | 'teacher';
  email: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock staff data for 10 different staff members
const mockStaff = [
  { id: 'STAFF1', name: 'Rajesh Kumar', email: 'rajesh@sss.com', password: '123', role: 'staff' as const },
  { id: 'STAFF2', name: 'Priya Sharma', email: 'priya@sss.com', password: '123', role: 'staff' as const },
  { id: 'STAFF3', name: 'Amit Verma', email: 'amit@sss.com', password: '123', role: 'staff' as const },
  { id: 'STAFF4', name: 'Sunita Reddy', email: 'sunita@sss.com', password: '123', role: 'staff' as const },
  { id: 'STAFF5', name: 'Vikram Singh', email: 'vikram@sss.com', password: '123', role: 'staff' as const },
  { id: 'STAFF6', name: 'Neha Gupta', email: 'neha@sss.com', password: '123', role: 'staff' as const },
  { id: 'STAFF7', name: 'Suresh Nair', email: 'suresh@sss.com', password: '123', role: 'staff' as const },
  { id: 'STAFF8', name: 'Kavita Joshi', email: 'kavita@sss.com', password: '123', role: 'staff' as const },
  { id: 'STAFF9', name: 'Deepak Patil', email: 'deepak@sss.com', password: '123', role: 'staff' as const },
  { id: 'STAFF10', name: 'Anjali Menon', email: 'anjali@sss.com', password: '123', role: 'staff' as const },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage for saved user on page load
    const savedUser = localStorage.getItem('sss_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Find user by email
    const foundUser = mockStaff.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('sss_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sss_user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
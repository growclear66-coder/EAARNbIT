import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '../types';
import { mockBackend } from '../services/mockBackend';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (u: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (user) {
        const updated = await mockBackend.refreshUser(user.id);
        if (updated) setUser(updated);
    }
  }, [user]);

  useEffect(() => {
    // Check for existing session
    mockBackend.onAuthChange((userData) => {
        if (userData && !userData.isBlocked) {
            setUser(userData);
        } else {
            setUser(null);
        }
        setLoading(false);
    });
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    mockBackend.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        isAdmin: user?.role === UserRole.ADMIN,
        login, 
        logout,
        refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
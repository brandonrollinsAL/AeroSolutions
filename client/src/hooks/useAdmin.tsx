import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export interface AdminUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('adminToken')
  );
  const [user, setUser] = useState<AdminUser | null>(null);

  // Check if token exists and fetch user data
  const { isLoading } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      if (!token) return null;
      
      try {
        const response = await apiRequest('GET', '/api/admin/me', null, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const userData = await response.json();
        setUser(userData);
        return userData;
      } catch (error) {
        console.error('Error fetching admin user', error);
        logout();
        return null;
      }
    },
    enabled: !!token,
  });

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiRequest('POST', '/api/admin/login', { email, password });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('adminToken', data.token);
      
      toast({
        title: 'Login successful',
        description: 'Welcome to the admin dashboard',
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('adminToken');
    queryClient.invalidateQueries({ queryKey: ['admin'] });
    toast({
      title: 'Logged out',
      description: 'You have been logged out of the admin dashboard',
    });
  };

  useEffect(() => {
    // Set default auth header for admin requests
    if (token) {
      // This is just a side effect, not actually making API calls here
      console.log('Admin token set in local storage');
    }
  }, [token]);

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminAuthProvider');
  }
  return context;
};
// Basic mock implementation of useAuth hook for landing page optimization demo
// In a real application, this would connect to the actual auth system

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export function useAuth() {
  // Mock user for demo purposes
  const mockUser: User = {
    id: 1,
    username: 'demo_admin',
    email: 'admin@elevion.dev',
    role: 'admin'
  };

  return {
    user: mockUser,
    isLoading: false,
    error: null
  };
}
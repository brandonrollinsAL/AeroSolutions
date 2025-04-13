import { useAuth } from '@/hooks/useAuth';

type Permission = 'admin' | 'marketing' | 'content' | 'user' | 'client';

/**
 * Hook for checking user permissions
 * 
 * @returns Object with functions to check user permissions
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if the current user has a specific permission
   * @param permission - The permission to check
   * @returns boolean - Whether the user has the permission
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check specific permissions
    switch (permission) {
      case 'admin':
        return user.role === 'admin';
      case 'marketing':
        return user.role === 'admin' || user.role === 'marketing';
      case 'content':
        return user.role === 'admin' || user.role === 'marketing' || user.role === 'content';
      case 'user':
        return true; // All authenticated users have basic user permissions
      case 'client':
        return user.role === 'admin' || user.role === 'client';
      default:
        return false;
    }
  };

  /**
   * Check if the current user has ALL of the specified permissions
   * @param permissions - Array of permissions to check
   * @returns boolean - Whether the user has all permissions
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Check if the current user has ANY of the specified permissions
   * @param permissions - Array of permissions to check
   * @returns boolean - Whether the user has any of the permissions
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission
  };
}
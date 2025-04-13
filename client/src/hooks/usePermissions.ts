// Type definition for permissions
type Permission = 'admin' | 'marketing' | 'content' | 'user' | 'client' | 'pricing.view' | 'pricing.manage';

/**
 * Hook for checking user permissions
 * 
 * @returns Object with functions to check user permissions
 */
export function usePermissions() {
  /**
   * Check if the current user has a specific permission
   * @param permission - The permission to check
   * @returns boolean - Whether the user has the permission
   */
  const hasPermission = (permission: Permission): boolean => {
    // For demonstration, we'll return true for admin, marketing, and pricing roles
    // In production, this would check against a real user role
    return ['admin', 'marketing', 'pricing.view', 'pricing.manage'].includes(permission);
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
// Type definition for permissions
// Define all available permission types
type Permission = 
  | 'admin'           // Full system access
  | 'marketing'       // Marketing features access
  | 'content'         // Content management access
  | 'user'            // Standard user access
  | 'client'          // Client-specific features
  | 'pricing.view'    // Can view pricing optimization data
  | 'pricing.manage'; // Can manage pricing (approve/reject changes)

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
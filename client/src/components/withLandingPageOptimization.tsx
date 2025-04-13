import { useState, ComponentType, useEffect } from 'react';
import LandingPageOptimizer from './LandingPageOptimizer';
import { Separator } from '@/components/ui/separator';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * Higher Order Component (HOC) that adds landing page optimization capabilities 
 * to any component that serves as a landing page.
 * 
 * @param WrappedComponent - The component to wrap with optimization capabilities
 * @param pagePath - The path of the landing page (defaults to current path)
 * @returns A new component with optimization features
 */
export default function withLandingPageOptimization<P extends object>(
  WrappedComponent: ComponentType<P & { optimizations?: any }>,
  pagePath?: string
) {
  // Return a new component with the added optimization features
  return function OptimizedLandingPage(props: P) {
    const [optimizations, setOptimizations] = useState<any>({});
    const { hasPermission } = usePermissions();
    const isAdmin = hasPermission('admin') || hasPermission('marketing');
    
    // Apply received optimizations to the component
    const handleApplyOptimizations = (newOptimizations: any) => {
      setOptimizations(newOptimizations);
    };
    
    // Get current path if not provided
    const currentPath = pagePath || window.location.pathname;
    
    return (
      <div className="flex flex-col min-h-screen">
        {/* Admin UI for page optimization (only visible to admins) */}
        {isAdmin && (
          <div className="bg-background border-b sticky top-0 z-50">
            <div className="container mx-auto py-4 px-4">
              <h2 className="text-lg font-medium mb-4">Landing Page Optimization</h2>
              <LandingPageOptimizer 
                pagePath={currentPath}
                isAdmin={true}
                onApplyOptimizations={handleApplyOptimizations}
              />
              <Separator className="my-4" />
            </div>
          </div>
        )}
        
        {/* Actual landing page component with optimizations passed down */}
        <div className="flex-1">
          <WrappedComponent {...props} optimizations={optimizations} />
        </div>
        
        {/* Normal users just get tracking via the invisible optimizer */}
        {!isAdmin && (
          <LandingPageOptimizer 
            pagePath={currentPath}
            isAdmin={false}
          />
        )}
      </div>
    );
  };
}
import React, { useEffect } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { Button } from '@/components/ui/button';

/**
 * A diagnostic page to help debug routing issues in the application
 */
const RouterDebugPage = () => {
  const [location] = useLocation();
  const [matchesParticle] = useRoute('/particle-background');
  const [matchesDesign] = useRoute('/design-tools');
  const [matchesHome] = useRoute('/');
  const [matchesDebug] = useRoute('/router-debug');

  // Log routing information on mount
  useEffect(() => {
    console.log('Current location:', location);
    console.log('Routes match:');
    console.log('- particle-background match:', matchesParticle);
    console.log('- design-tools match:', matchesDesign);
    console.log('- home match:', matchesHome);
    console.log('- router-debug match:', matchesDebug);
  }, [location, matchesParticle, matchesDesign, matchesHome, matchesDebug]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Router Diagnostic Page</h1>
      
      <div className="bg-slate-100 p-4 rounded-lg mb-6">
        <h2 className="font-semibold text-lg mb-2">Current Location: <span className="text-blue-600">{location}</span></h2>
        <p className="mb-4 text-slate-700">This diagnostic tool can help identify routing issues.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium mb-2">Route Matches</h3>
            <ul className="space-y-1">
              <li className="flex items-center">
                <span className="mr-2 font-mono text-sm">/particle-background:</span>
                {matchesParticle ? (
                  <span className="text-green-600 font-semibold">Match</span>
                ) : (
                  <span className="text-red-600 font-semibold">No Match</span>
                )}
              </li>
              <li className="flex items-center">
                <span className="mr-2 font-mono text-sm">/design-tools:</span>
                {matchesDesign ? (
                  <span className="text-green-600 font-semibold">Match</span>
                ) : (
                  <span className="text-red-600 font-semibold">No Match</span>
                )}
              </li>
              <li className="flex items-center">
                <span className="mr-2 font-mono text-sm">/:</span>
                {matchesHome ? (
                  <span className="text-green-600 font-semibold">Match</span>
                ) : (
                  <span className="text-red-600 font-semibold">No Match</span>
                )}
              </li>
              <li className="flex items-center">
                <span className="mr-2 font-mono text-sm">/router-debug:</span>
                {matchesDebug ? (
                  <span className="text-green-600 font-semibold">Match</span>
                ) : (
                  <span className="text-red-600 font-semibold">No Match</span>
                )}
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium mb-2">Navigation Test</h3>
            <p className="text-sm text-slate-600 mb-2">
              Click these links to test navigation. Watch the console for route debugging info.
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Navigate to Home
                </Button>
              </Link>
              <Link href="/design-tools">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Navigate to Design Tools
                </Button>
              </Link>
              <Link href="/particle-background">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Navigate to Particle Background
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow-sm">
          <h3 className="font-medium mb-2">Solution Steps</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Check if the correct routes are defined in <code>App.tsx</code></li>
            <li>Ensure routes are in the correct order (specific routes before catch-all)</li>
            <li>Verify the <code>ParticleBackgroundDemo</code> component is imported correctly</li>
            <li>Check for any Wouter router configuration issues</li>
            <li>Verify React component is correctly defined and exported</li>
          </ol>
        </div>
      </div>
      
      <div className="text-right">
        <Link href="/design-tools">
          <Button>Back to Design Tools</Button>
        </Link>
      </div>
    </div>
  );
};

export default RouterDebugPage;
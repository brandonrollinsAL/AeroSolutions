// Popup Routes Diagnostic Tool
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findRoutesInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract routes from Route components
    const routeRegex = /<Route\s+path=["']([^"']+)["']/g;
    const routeMatches = [...content.matchAll(routeRegex)];
    
    const routes = routeMatches.map(match => ({
      path: match[1],
      source: filePath,
      lineNumber: content.substring(0, match.index).split('\n').length
    }));
    
    // Check for popup related routes specifically
    const popupRoutes = routes.filter(route => 
      route.path.includes('popup') || 
      route.path.includes('modal') || 
      route.path.includes('dialog')
    );
    
    return {
      allRoutes: routes,
      popupRoutes: popupRoutes
    };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return { allRoutes: [], popupRoutes: [] };
  }
}

function scanDirectory(dir, results = { allRoutes: [], popupRoutes: [] }) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory() && !file.startsWith('node_modules') && !file.startsWith('.')) {
      scanDirectory(filePath, results);
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      const fileResults = findRoutesInFile(filePath);
      results.allRoutes.push(...fileResults.allRoutes);
      results.popupRoutes.push(...fileResults.popupRoutes);
    }
  }
  
  return results;
}

function checkMissingRoutes(routes) {
  // Particle Background route check
  const particleRoute = routes.find(route => route.path === '/particle-background');
  
  // Other potential popup routes
  const commonPopupRoutes = [
    '/modal',
    '/popup',
    '/dialog',
    '/lightbox',
    '/overlay'
  ];
  
  const missingCommonRoutes = commonPopupRoutes.filter(route => 
    !routes.some(r => r.path === route || r.path.includes(`${route}/`))
  );
  
  return {
    particleRoute: particleRoute || 'Missing',
    missingCommonRoutes
  };
}

function generateReport() {
  const results = scanDirectory('.');
  const missingRouteCheck = checkMissingRoutes(results.allRoutes);
  
  const reportContent = `
# Popup Routes Diagnostic Report
Generated: ${new Date().toISOString()}

## All Routes (${results.allRoutes.length})
${results.allRoutes.map(route => `- "${route.path}" defined in ${route.source}:${route.lineNumber}`).join('\n')}

## Popup-Related Routes (${results.popupRoutes.length})
${results.popupRoutes.length ? results.popupRoutes.map(route => `- "${route.path}" defined in ${route.source}:${route.lineNumber}`).join('\n') : 'No explicit popup routes found.'}

## Particle Background Route Check
${typeof missingRouteCheck.particleRoute === 'string' ? 'Missing: This route needs to be defined correctly' : `Found: "${missingRouteCheck.particleRoute.path}" in ${missingRouteCheck.particleRoute.source}:${missingRouteCheck.particleRoute.lineNumber}`}

## Common Popup Routes Check
${missingRouteCheck.missingCommonRoutes.length ? `Missing common popup routes: ${missingRouteCheck.missingCommonRoutes.join(', ')}` : 'All common popup routes are accounted for.'}

## Potential Issues
1. Route definition order: The order of routes in React routers matters. More specific routes should come before catch-all routes.
2. Wouter router specifics: Wouter has different behavior than React Router, ensure compatibility with dynamic segments.
3. Client-side routing: Ensure that when popup links are clicked, they use proper routing instead of direct URL changes.
4. Missing hash (#) for popups: Some apps use hash for modal/popup states rather than full routes.
5. Content Security Policy: Check if CSP is blocking popup content.

## Recommendations
1. Review App.tsx route order to ensure specific routes come before catch-all 404 routes.
2. Consider using hash-based navigation for popups vs. full route changes.
3. Add popup-specific route handlers that render the appropriate components.
4. Check if the popup state is managed via URL or component state.
`;

  fs.writeFileSync('popup-diagnostic.log', reportContent);
  console.log('Diagnostic report generated: popup-diagnostic.log');
}

generateReport();
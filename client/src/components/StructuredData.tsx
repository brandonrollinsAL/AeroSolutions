import React, { useEffect } from 'react';

interface StructuredDataProps {
  type: string; // Allow any schema.org type
  data: any;
}

const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  // Base structured data for organization
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Aero Solutions",
    "alternateName": "AeroSolutions",
    "url": "https://aerosolutions.dev",
    "logo": "https://aerosolutions.dev/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-303-555-0122",
      "contactType": "customer service",
      "areaServed": "US",
      "availableLanguage": ["English"]
    },
    "sameAs": [
      "https://www.facebook.com/aerosolutions",
      "https://www.linkedin.com/company/aerosolutions",
      "https://twitter.com/aerosolutions"
    ]
  };

  // Base structured data for website
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Aero Solutions",
    "url": "https://aerosolutions.dev",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://aerosolutions.dev/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  useEffect(() => {
    // Create the structured data based on the type
    let structuredData: any;
    
    switch (type) {
      case 'Organization':
        structuredData = { ...organizationData, ...data };
        break;
      case 'WebSite':
        structuredData = { ...websiteData, ...data };
        break;
      case 'ProfessionalService':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          ...data
        };
        break;
      case 'FAQPage':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          ...data
        };
        break;
      case 'ItemList':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          ...data
        };
        break;
      case 'BlogPosting':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          ...data
        };
        break;
      case 'SoftwareApplication':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          ...data
        };
        break;
      case 'Product':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "Product",
          ...data
        };
        break;
      case 'Service':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "Service",
          ...data
        };
        break;
      default:
        structuredData = {
          "@context": "https://schema.org",
          "@type": type,
          ...data
        };
    }

    // Create a unique ID for this structured data
    const scriptId = `structured-data-${type}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Check if the script already exists
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    // If it doesn't exist, create it
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    
    // Update the script content
    script.textContent = JSON.stringify(structuredData);
    
    // Cleanup function to remove the script when the component is unmounted
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        document.head.removeChild(scriptToRemove);
      }
    };
  }, [type, data]);

  // This component doesn't render anything visible
  return null;
};

export default StructuredData;
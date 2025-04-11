import React from 'react';
import { Helmet } from 'react-helmet';

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'Article' | 'Product' | 'Service' | 'BreadcrumbList' | 'FAQPage';
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

  // Merge the appropriate base data with the provided data
  let structuredData;
  
  switch (type) {
    case 'Organization':
      structuredData = { ...organizationData, ...data };
      break;
    case 'WebSite':
      structuredData = { ...websiteData, ...data };
      break;
    default:
      structuredData = {
        "@context": "https://schema.org",
        "@type": type,
        ...data
      };
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default StructuredData;
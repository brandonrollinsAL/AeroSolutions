import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';

interface SEOFooterProps {
  className?: string;
}

/**
 * SEOFooter component - enhances website's footer with additional SEO-friendly content
 * and legal information that helps search engines understand site structure and relationships.
 */
const SEOFooter: React.FC<SEOFooterProps> = ({ className = '' }) => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  // Array of aviation-related terms for improved SEO
  const aviationTerms = [
    { term: 'Aviation Software Solutions', path: '/services' },
    { term: 'Flight Management Systems', path: '/platforms/aeroflight' },
    { term: 'Aircraft Maintenance Software', path: '/platforms/aeroops' },
    { term: 'Aviation Data Integration', path: '/platforms/aerosync' },
    { term: 'Executive Flight Operations', path: '/platforms/execsync' },
    { term: 'Pilot Communication Tools', path: '/platforms/aerolink' },
    { term: 'Aviation Technology', path: '/services' },
    { term: 'Aviation Software Development', path: '/contact' }
  ];

  // Array of legal links for footer
  const legalLinks = [
    { title: 'Privacy Policy', path: '/privacy-policy' },
    { title: 'Terms of Service', path: '/terms' },
    { title: 'Cookie Policy', path: '/privacy-policy#cookies' },
    { title: 'GDPR Compliance', path: '/privacy-policy#gdpr' },
    { title: 'Accessibility', path: '/accessibility' },
    { title: 'Security', path: '/security' },
  ];

  return (
    <div className={`${className} text-sm text-muted-foreground`}>
      <Separator className="my-8" />
      
      {/* SEO-rich footer links section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {aviationTerms.map((item, index) => (
          <Link key={index} href={item.path} className="hover:text-primary transition-colors">
            {item.term}
          </Link>
        ))}
      </div>
      
      {/* Legal links section */}
      <div className="flex flex-wrap gap-4 md:gap-6 mb-6">
        {legalLinks.map((item, index) => (
          <Link key={index} href={item.path} className="hover:text-primary transition-colors">
            {item.title}
          </Link>
        ))}
      </div>
      
      {/* Address and Copyright with Schema Markup */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p itemScope itemType="https://schema.org/Organization">
            <span itemProp="name">Aero Solutions LLC</span> is located at{' '}
            <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
              <span itemProp="streetAddress">123 Aviation Way, Suite 450</span>,{' '}
              <span itemProp="addressLocality">Charlotte</span>,{' '}
              <span itemProp="addressRegion">NC</span>{' '}
              <span itemProp="postalCode">28202</span>,{' '}
              <span itemProp="addressCountry">United States</span>
            </span>
          </p>
        </div>
        <div className="text-right">
          <p>
            &copy; {currentYear} Aero Solutions LLC. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SEOFooter;
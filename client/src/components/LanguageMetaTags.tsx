import React from 'react';
import { Helmet } from 'react-helmet';

interface LanguageMetaTagsProps {
  currentPath: string;
}

/**
 * Component to add alternate language meta tags for SEO
 * These tags help search engines understand that the same content
 * is available in multiple languages and improves international SEO
 */
const LanguageMetaTags: React.FC<LanguageMetaTagsProps> = ({ currentPath }) => {
  // Base URL for the site
  const baseUrl = 'https://elevion.dev';
  
  // All supported languages
  const languages = ['en', 'es', 'fr', 'de', 'zh', 'ja'];
  
  // Clean the path to make sure it doesn't end with a trailing slash
  // unless it's the homepage
  const cleanPath = currentPath === '/' ? '' : currentPath;
  
  return (
    <Helmet>
      {/* Default canonical link */}
      <link rel="canonical" href={`${baseUrl}${cleanPath}`} />
      
      {/* Alternate language links */}
      {languages.map(lang => (
        <link 
          key={lang} 
          rel="alternate" 
          hrefLang={lang} 
          href={`${baseUrl}${cleanPath}${cleanPath ? '?' : ''}${cleanPath ? 'lng=' : 'lng='}${lang}`} 
        />
      ))}
      
      {/* Add x-default for language selection pages */}
      <link 
        rel="alternate" 
        hrefLang="x-default" 
        href={`${baseUrl}${cleanPath}`} 
      />
    </Helmet>
  );
};

export default LanguageMetaTags;
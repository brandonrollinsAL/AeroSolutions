import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Ownership from '@/components/Ownership';
import Platforms from '@/components/Platforms';
import About from '@/components/About';
import Testimonials from '@/components/Testimonials';
import Blog from '@/components/Blog';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import Copilot from '@/components/Copilot';

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Aero Solutions: Elevating Your Aviation Software to New Heights</title>
        <meta name="description" content="Full-stack development for aviation and technology by a self-taught pilot and software engineer—no payment until you're 100% satisfied with your custom solution." />
        <meta name="keywords" content="full-stack development for aviation, custom software solutions, aviation software development, no upfront payment software development, pilot software developer, flight management systems, aviation technology solutions, aircraft maintenance software" />
        <meta property="og:title" content="Aero Solutions: Top Aviation Software Development | No Payment Until 100% Satisfaction" />
        <meta property="og:description" content="Aero Solutions combines aviation expertise with cutting-edge software development to deliver solutions that soar. Founded by a professional pilot and self-taught software engineer." />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Aero Solutions: Aviation Software Development Experts" />
        <meta name="twitter:description" content="Full-stack aviation software development by pilots for pilots. You own 100% of your code upon project completion." />
        <link rel="canonical" href="https://aerosolutions.dev/" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              "name": "Aero Solutions",
              "description": "Aviation software development company providing full-stack custom solutions with no upfront payment.",
              "url": "https://aerosolutions.dev",
              "logo": "https://aerosolutions.dev/logo.png",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "1150 NW 72nd AVE Tower 1 STE 455 #17102",
                "addressLocality": "Miami",
                "addressRegion": "FL",
                "postalCode": "33126",
                "addressCountry": "US"
              },
              "telephone": "+1-800-555-0199",
              "priceRange": "$$",
              "founder": {
                "@type": "Person",
                "name": "Brandon Rollins",
                "jobTitle": "Founder and Lead Engineer",
                "description": "Professional pilot and self-taught software engineer"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Aviation Software Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "name": "Custom Software Development",
                    "description": "End-to-end software development for aviation companies"
                  },
                  {
                    "@type": "Offer",
                    "name": "Flight Management Systems",
                    "description": "Integrated systems for flight planning, tracking, and management"
                  },
                  {
                    "@type": "Offer",
                    "name": "Maintenance Tracking Applications",
                    "description": "Software for tracking maintenance schedules and history"
                  }
                ]
              }
            }
          `}
        </script>
      </Helmet>
      
      <Header />
      <main>
        <Hero />
        <Services />
        <Ownership />
        <Platforms />
        <About />
        <Testimonials />
        <Blog />
        <Contact />
      </main>
      <Footer />
      <Copilot />
    </>
  );
}

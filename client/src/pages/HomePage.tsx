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
        <title>Aero Solutions: Advanced Aviation Software Development by Pilots for Pilots</title>
        <meta name="description" content="Aero Solutions delivers aviation software that transforms flight operations—custom platforms including AeroSync, AeroFlight, AeroOps, and ExecSync built by pilots. No payment until 100% satisfaction guaranteed." />
        <meta name="keywords" content="aviation software development, AeroSync data platform, AeroFlight management system, AeroOps operations software, ExecSync executive solution, aviation technology integration, custom flight management systems, pilot-developed software, no upfront payment development, Miami aviation software company, aircraft maintenance tracking" />
        <meta property="og:title" content="Aero Solutions: Miami's Premier Aviation Software Development | No Payment Until 100% Satisfaction" />
        <meta property="og:description" content="Discover our industry-leading aviation platforms: AeroSync, AeroFlight, AeroOps, and ExecSync—built by pilots who understand your operational challenges. You own 100% of your custom solution upon completion." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://aerosolutions.dev/og-image-homepage.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Aero Solutions" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Aero Solutions: Pilot-Built Aviation Software | AeroSync, AeroFlight & More" />
        <meta name="twitter:description" content="Transform your flight operations with custom software built by pilots. Our platforms integrate with your existing systems for seamless aviation management." />
        <meta name="twitter:image" content="https://aerosolutions.dev/twitter-card-image.jpg" />
        <link rel="canonical" href="https://aerosolutions.dev/" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              "name": "Aero Solutions",
              "description": "Premier aviation software development company specializing in custom solutions with unique no-payment-until-satisfied guarantee.",
              "url": "https://aerosolutions.dev",
              "logo": "https://aerosolutions.dev/logo.png",
              "image": [
                "https://aerosolutions.dev/images/office.jpg",
                "https://aerosolutions.dev/images/team.jpg",
                "https://aerosolutions.dev/images/software-demo.jpg"
              ],
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "1150 NW 72nd AVE Tower 1 STE 455 #17102",
                "addressLocality": "Miami",
                "addressRegion": "FL",
                "postalCode": "33126",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "25.7777",
                "longitude": "-80.3220"
              },
              "telephone": "+1-800-555-0199",
              "email": "info@aerosolutions.dev",
              "priceRange": "$$",
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  "opens": "09:00",
                  "closes": "18:00"
                }
              ],
              "founder": {
                "@type": "Person",
                "name": "Brandon Rollins",
                "jobTitle": "Founder and Lead Engineer",
                "description": "Professional pilot and self-taught software engineer",
                "image": "https://aerosolutions.dev/images/brandon-rollins.jpg"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Aviation Software Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "name": "Custom Software Development",
                    "description": "End-to-end software development for aviation companies",
                    "url": "https://aerosolutions.dev/services/custom-development"
                  },
                  {
                    "@type": "Offer",
                    "name": "AeroSync Platform",
                    "description": "Comprehensive aviation data synchronization platform",
                    "url": "https://aerosolutions.dev/platforms/aerosync"
                  },
                  {
                    "@type": "Offer",
                    "name": "AeroFlight System",
                    "description": "Advanced flight simulation and training platform",
                    "url": "https://aerosolutions.dev/platforms/aeroflight"
                  },
                  {
                    "@type": "Offer",
                    "name": "AeroOps Management",
                    "description": "End-to-end aviation operations management platform",
                    "url": "https://aerosolutions.dev/platforms/aeroops"
                  },
                  {
                    "@type": "Offer",
                    "name": "ExecSync Solution",
                    "description": "Executive productivity and communication platform",
                    "url": "https://aerosolutions.dev/platforms/execsync"
                  }
                ]
              },
              "review": [
                {
                  "@type": "Review",
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5",
                    "bestRating": "5"
                  },
                  "author": {
                    "@type": "Person",
                    "name": "John Miller"
                  },
                  "reviewBody": "Aero Solutions transformed our flight operations with their custom software. The team's aviation expertise made all the difference."
                },
                {
                  "@type": "Review",
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5",
                    "bestRating": "5"
                  },
                  "author": {
                    "@type": "Person",
                    "name": "Sarah Johnson"
                  },
                  "reviewBody": "Their no-payment-until-satisfied model gave us confidence to pursue a complex project. The results exceeded our expectations."
                }
              ]
            }
          `}
        </script>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How does the no-payment-until-satisfied model work?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We develop your complete solution first, then you test it thoroughly in your environment. Only when you're 100% satisfied with the results do you pay. This ensures we're fully aligned with your goals and removes all risk from your investment."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What aviation platforms does Aero Solutions offer?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We've developed several proprietary platforms: AeroSync (data synchronization), AeroFlight (flight simulation and training), AeroOps (operations management), and ExecSync (executive productivity). These can be customized to your specific needs or integrated with your existing systems."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Do you offer ongoing support after project completion?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, we provide comprehensive support options including maintenance, updates, training, and 24/7 technical assistance. We can also implement new features as your needs evolve over time."
                  }
                }
              ]
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

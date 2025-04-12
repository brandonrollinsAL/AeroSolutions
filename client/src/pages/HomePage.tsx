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
import SEOHead from '@/components/SEOHead';
import StructuredData from '@/components/StructuredData';
import FreeMockupForm from '@/components/FreeMockupForm';

export default function HomePage() {
  // Professional service data for structured data
  const professionalServiceData = {
    name: "Elevion",
    description: "Premier web development company specializing in custom solutions for small businesses with unique no-payment-until-satisfied guarantee.",
    url: "https://elevion.dev",
    logo: "https://elevion.dev/logo.png",
    image: [
      "https://elevion.dev/images/office.jpg",
      "https://elevion.dev/images/team.jpg",
      "https://elevion.dev/images/development-demo.jpg"
    ],
    address: {
      "@type": "PostalAddress",
      "streetAddress": "1150 Web Development Dr, Suite 455",
      "addressLocality": "Miami",
      "addressRegion": "FL",
      "postalCode": "33126",
      "addressCountry": "US"
    },
    geo: {
      "@type": "GeoCoordinates",
      "latitude": "25.7777",
      "longitude": "-80.3220"
    },
    telephone: "+1-800-555-0199",
    email: "info@elevion.dev",
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      "name": "Web Development Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "name": "Custom Web Development",
          "description": "End-to-end web development for small businesses",
          "url": "https://elevion.dev/services/custom-development"
        },
        {
          "@type": "Offer",
          "name": "WebCraft Platform",
          "description": "Comprehensive website design and development platform",
          "url": "https://elevion.dev/platforms/webcraft"
        },
        {
          "@type": "Offer",
          "name": "EcomPro System",
          "description": "Advanced e-commerce solutions for online sales",
          "url": "https://elevion.dev/platforms/ecompro"
        },
        {
          "@type": "Offer",
          "name": "ContentHub Management",
          "description": "Content management systems for easy website updates",
          "url": "https://elevion.dev/platforms/contenthub"
        },
        {
          "@type": "Offer",
          "name": "AnalyticEdge Solution",
          "description": "Data analytics and business intelligence for growth",
          "url": "https://elevion.dev/platforms/analyticedge"
        },
        {
          "@type": "Offer",
          "name": "AppForge Platform",
          "description": "Mobile app development for expanded customer reach",
          "url": "https://elevion.dev/platforms/appforge"
        }
      ]
    },
    review: [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Jane Doe"
        },
        "reviewBody": "Elevion transformed our online presence with their custom website. The team's small business expertise made all the difference."
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
          "name": "John Smith"
        },
        "reviewBody": "Their no-payment-until-satisfied model gave us confidence to pursue a complex e-commerce project. The results exceeded our expectations."
      }
    ]
  };

  // FAQ structured data
  const faqData = {
    mainEntity: [
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
        "name": "What web development platforms does Elevion offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We've developed several proprietary platforms: WebCraft (website development), EcomPro (e-commerce solutions), ContentHub (content management), AnalyticEdge (data analytics), and AppForge (mobile app development). These can be customized to your specific needs or integrated with your existing systems."
        }
      },
      {
        "@type": "Question",
        "name": "How does the free mockup service work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We create a custom design concept tailored to your business at no cost. Just fill out our form with your business details, and our team will create a professional mockup so you can see what we can build for you before making any commitment."
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
  };

  return (
    <>
      <SEOHead
        title="Elevion: AI-Powered Web Development for Small Businesses | Free Mockups"
        description="Elevion delivers custom web solutions that transform your online presence—platforms including WebCraft, EcomPro, ContentHub, and more. No payment until 100% satisfaction guaranteed."
        keywords="web development, website design, small business websites, e-commerce solutions, WebCraft platform, EcomPro system, ContentHub management, AnalyticEdge solution, AppForge platform, free website mockup, no upfront payment development, Miami web development company, responsive website design"
        ogTitle="Elevion: Miami's Premier Web Development Company | Free Mockups, No Payment Until 100% Satisfaction"
        ogDescription="Discover our industry-leading web platforms: WebCraft, EcomPro, ContentHub, AnalyticEdge, and AppForge—built by developers who understand your business challenges. Get a free mockup today!"
        ogImage="https://elevion.dev/og-image-homepage.jpg"
        twitterTitle="Elevion: AI-Powered Web Development | Free Mockups, No Payment Until Satisfied"
        twitterDescription="Transform your online presence with custom web solutions. Our platforms integrate with your existing systems for seamless business growth."
        twitterImage="https://elevion.dev/twitter-card-image.jpg"
        canonicalUrl="https://elevion.dev/"
      >
        {/* Structured data is now separated into its own component */}
        <StructuredData type="ProfessionalService" data={professionalServiceData} />
        <StructuredData type="FAQPage" data={faqData} />
      </SEOHead>
      
      <Header />
      <main>
        <Hero />
        <Services />
        <FreeMockupForm />
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

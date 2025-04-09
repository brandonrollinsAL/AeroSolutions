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
        <title>Aero Solutions: Elevating Your Software to New Heights</title>
        <meta name="description" content="Full-stack development for aviation and technology—no payment until you're satisfied." />
        <meta name="keywords" content="full-stack development for aviation, custom software solutions, aviation software development, no upfront payment software development" />
        <meta property="og:title" content="Aero Solutions: Top Aviation Software Development | No Payment Until Satisfaction" />
        <meta property="og:description" content="Aero Solutions combines aviation expertise with cutting-edge software development to deliver solutions that soar." />
        <meta property="og:type" content="website" />
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

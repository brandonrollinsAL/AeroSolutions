import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Code, PenTool, Database, Layout, Zap } from 'lucide-react';
import ProtectedImage from '@/components/ProtectedImage';

const PortfolioPage: React.FC = () => {
  const { t } = useTranslation();
  
  const portfolioItems = [
    {
      id: 1,
      title: "E-commerce Platform for Artisan Craft Shop",
      description: "A fully-responsive e-commerce solution with secure payment processing, inventory management, and customer accounts.",
      imageSrc: "/images/portfolio/ecommerce-craft.jpg",
      imageAlt: "E-commerce platform screenshot",
      tags: ["E-commerce", "React", "Node.js", "Stripe"],
      link: "/portfolio/ecommerce-craft"
    },
    {
      id: 2,
      title: "Real Estate Listing Portal",
      description: "Interactive property search with map integration, virtual tours, and lead generation for real estate agents.",
      imageSrc: "/images/portfolio/real-estate.jpg",
      imageAlt: "Real estate portal screenshot",
      tags: ["Real Estate", "React", "Express", "Google Maps API"],
      link: "/portfolio/real-estate"
    },
    {
      id: 3,
      title: "Restaurant Ordering System",
      description: "Online ordering platform with table reservations, delivery tracking, and loyalty program integration.",
      imageSrc: "/images/portfolio/restaurant.jpg",
      imageAlt: "Restaurant ordering system screenshot",
      tags: ["Food & Beverage", "React", "Node.js", "Payment Processing"],
      link: "/portfolio/restaurant"
    },
    {
      id: 4,
      title: "Healthcare Provider Dashboard",
      description: "HIPAA-compliant patient management system with appointment scheduling and telehealth integration.",
      imageSrc: "/images/portfolio/healthcare.jpg",
      imageAlt: "Healthcare dashboard screenshot",
      tags: ["Healthcare", "React", "Express", "HIPAA Compliance"],
      link: "/portfolio/healthcare"
    },
    {
      id: 5,
      title: "Educational Learning Platform",
      description: "Interactive course delivery system with progress tracking, assessments, and certificate generation.",
      imageSrc: "/images/portfolio/education.jpg",
      imageAlt: "Educational platform screenshot",
      tags: ["Education", "React", "Node.js", "Video Streaming"],
      link: "/portfolio/education"
    },
    {
      id: 6,
      title: "Fitness Tracking Application",
      description: "Mobile-first workout tracking with personalized plans, progress visualization, and social features.",
      imageSrc: "/images/portfolio/fitness.jpg",
      imageAlt: "Fitness application screenshot",
      tags: ["Fitness", "React Native", "Express", "Data Visualization"],
      link: "/portfolio/fitness"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Portfolio | Elevion Web Development</title>
        <meta name="description" content="Explore our portfolio of web development projects showcasing our expertise in creating modern, responsive websites and applications." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-12 text-center p-8 rounded-lg bg-gradient-primary bg-opacity-10">
          <h1 className="text-4xl font-bold font-poppins mb-4 text-gradient-primary">
            Our Portfolio
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Showcasing our expertise in building modern, feature-rich web applications 
            for businesses across various industries.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button variant="outline" className="rounded-full">
              <Layout className="mr-2 h-4 w-4" />
              All Projects
            </Button>
            <Button variant="outline" className="rounded-full">
              <Code className="mr-2 h-4 w-4" />
              E-commerce
            </Button>
            <Button variant="outline" className="rounded-full">
              <PenTool className="mr-2 h-4 w-4" />
              Web Design
            </Button>
            <Button variant="outline" className="rounded-full">
              <Database className="mr-2 h-4 w-4" />
              Applications
            </Button>
            <Button variant="outline" className="rounded-full">
              <Zap className="mr-2 h-4 w-4" />
              Optimization
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolioItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                <ProtectedImage 
                  src={item.imageSrc} 
                  alt={item.imageAlt}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                  fallback={`/images/portfolio/placeholder-${item.id % 3}.jpg`}
                />
              </div>
              
              <CardHeader>
                <CardTitle className="font-poppins text-xl">{item.title}</CardTitle>
                <CardDescription className="line-clamp-2">{item.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-light-gray text-slate-blue text-xs font-medium rounded-full hover-electric-cyan cursor-pointer transition-all"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="ghost" size="sm" className="hover-electric-cyan">
                  View Details
                </Button>
                <Button variant="ghost" size="sm" className="hover-sunset-orange">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Visit Site
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center p-8 rounded-lg bg-gradient-accent bg-opacity-5">
          <h2 className="text-2xl font-bold font-poppins mb-4">Ready to create your own success story?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Let us help you build a modern, high-performance website or application 
            tailored to your specific business needs.
          </p>
          <Button size="lg" className="btn-sunset-orange">
            Start Your Project
          </Button>
        </div>
      </div>
    </>
  );
};

export default PortfolioPage;
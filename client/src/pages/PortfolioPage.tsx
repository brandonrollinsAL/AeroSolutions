import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Code, PenTool, Database, Layout, Zap, Search } from 'lucide-react';
import ProtectedImage from '@/components/ProtectedImage';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import type { PortfolioItem } from '@shared/schema';

const PortfolioPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Fetch all portfolio items from API
  const { data, isLoading, error } = useQuery<PortfolioItem[]>({
    queryKey: ['/api/portfolio'],
    refetchOnWindowFocus: false
  });
  
  // Make sure we have valid array data
  const portfolioItems = Array.isArray(data) ? data : [];
  
  // Filter items based on active filter and search query
  const filteredItems = portfolioItems.filter(item => {
    // Filter by industry type if not 'all'
    const matchesIndustry = activeFilter === 'all' || 
      item.industryType.toLowerCase() === activeFilter.toLowerCase();
    
    // Filter by search query if provided
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(item.technologies) && item.technologies.some(tech => 
        tech.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    return matchesIndustry && matchesSearch;
  });

  // Define industry filters - update based on our actual database entries
  const industryFilters = [
    { id: 'all', label: 'All Projects', icon: <Layout className="mr-2 h-4 w-4" /> },
    { id: 'Food & Beverage', label: 'Food & Beverage', icon: <Code className="mr-2 h-4 w-4" /> },
    { id: 'Health & Fitness', label: 'Health & Fitness', icon: <PenTool className="mr-2 h-4 w-4" /> },
    { id: 'Technology', label: 'Technology', icon: <Database className="mr-2 h-4 w-4" /> },
    { id: 'E-commerce', label: 'E-commerce', icon: <Zap className="mr-2 h-4 w-4" /> }
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
          
          {/* Search input */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects, technologies or industries..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>
          
          {/* Industry filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {industryFilters.map(filter => (
              <Button 
                key={filter.id}
                variant={activeFilter === filter.id ? "default" : "outline"} 
                className={`rounded-full ${activeFilter === filter.id ? 'bg-slate-blue text-white' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.icon}
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Skeleton className="h-8 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="text-center p-8 rounded-lg bg-destructive/10 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-2">Error loading portfolio</h2>
            <p className="text-muted-foreground mb-4">
              There was an error loading our portfolio items. Please try again later.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Retry
            </Button>
          </div>
        )}
        
        {/* Portfolio grid */}
        {!isLoading && !error && (
          <>
            {filteredItems.length === 0 ? (
              <div className="text-center p-8 max-w-md mx-auto">
                <h2 className="text-xl font-bold mb-2">No matching projects</h2>
                <p className="text-muted-foreground mb-4">
                  We couldn't find any projects matching your search criteria.
                </p>
                <Button 
                  onClick={() => {
                    setActiveFilter('all');
                    setSearchQuery('');
                  }} 
                  variant="outline"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                      <ProtectedImage 
                        src={item.thumbnailUrl} 
                        alt={`${item.title} - ${item.clientName}`}
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
                        {item.technologies?.map((tech, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-light-gray text-slate-blue text-xs font-medium rounded-full hover-electric-cyan cursor-pointer transition-all"
                          >
                            {tech}
                          </span>
                        ))}
                        <span className="px-2 py-1 bg-sunset-orange/20 text-sunset-orange text-xs font-medium rounded-full">
                          {item.industryType}
                        </span>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between border-t pt-4">
                      <Button variant="ghost" size="sm" className="hover-electric-cyan">
                        View Details
                      </Button>
                      {item.websiteUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover-sunset-orange"
                          onClick={() => window.open(item.websiteUrl || '', '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Visit Site
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
        
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
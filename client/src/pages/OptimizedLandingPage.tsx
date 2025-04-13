import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import withLandingPageOptimization from '@/components/withLandingPageOptimization';
import { ArrowRight, Check, ArrowDown } from 'lucide-react';

// Sample landing page that demonstrates optimization capabilities
function LandingPage({ optimizations }: { optimizations?: any }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  
  // Apply optimizations when they change
  useEffect(() => {
    if (optimizations && Object.keys(optimizations).length > 0) {
      console.log('Applied optimizations:', optimizations);
    }
  }, [optimizations]);
  
  // Example CTA click handler to track conversions
  const handleCtaClick = () => {
    setShowForm(true);
    
    // Track conversion event
    fetch('/api/analytics/website-conversions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourcePath: window.location.pathname,
        targetPath: '/signup',
        conversionType: 'lead_form',
        deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        timestamp: new Date().toISOString()
      })
    }).catch(err => {
      console.error('Error tracking conversion:', err);
    });
  };
  
  // Use optimized content or defaults based on received optimizations
  const headline = optimizations?.content?.headline || 'Transform Your Business with Intelligent Web Solutions';
  const valueProposition = optimizations?.content?.valueProposition || 'Create, launch, and optimize your web presence with AI-powered tools and expert guidance';
  const ctaText = optimizations?.content?.ctaText || 'Get Started Free';
  const keyMessages = optimizations?.content?.keyMessages || [
    'AI-powered designs tailored to your industry',
    'Launch your website faster with intelligent automation',
    'Optimize continuously based on real visitor data',
    'Affordable plans for businesses of all sizes'
  ];
  
  // Use optimized layout based on received optimizations
  const ctaPosition = optimizations?.layout?.ctaPosition || 'center';
  const heroImagePosition = optimizations?.layout?.heroImagePosition || 'right';
  
  // Use optimized styling based on received optimizations
  const colorAccents = optimizations?.styling?.colorAccents || ['#3B5B9D', '#00D1D1', '#FF7043'];
  const mobileAdjustments = optimizations?.styling?.mobileAdjustments || [];
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden">
        <div 
          className={`container px-4 md:px-6 flex flex-col ${
            heroImagePosition === 'left' 
              ? 'md:flex-row-reverse' 
              : 'md:flex-row'
          } items-center gap-8 md:gap-16`}
        >
          <div className="flex flex-col justify-center space-y-4 flex-1">
            <div className="inline-block px-3 py-1 mb-2 text-sm rounded-full bg-primary/10 text-primary">
              Elevion Web Solutions
            </div>
            
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              {headline}
            </h1>
            
            <p className="text-muted-foreground text-xl max-w-[600px]">
              {valueProposition}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button 
                size="lg" 
                onClick={handleCtaClick}
                className={`text-white gap-2 ${
                  ctaPosition === 'left' 
                    ? 'self-start' 
                    : ctaPosition === 'right' 
                    ? 'self-end' 
                    : 'self-center sm:self-start'
                }`}
                style={{
                  background: colorAccents[0],
                  borderColor: colorAccents[0],
                }}
              >
                {ctaText} <ArrowRight className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="lg">
                Watch Demo
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-[500px] aspect-square rounded-lg overflow-hidden shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                <div className="text-center p-8">
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: colorAccents[1] }}>
                      <ArrowDown className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <p className="text-lg font-medium">Placeholder for hero image</p>
                  <p className="text-sm text-muted-foreground">This would be replaced with a real image in production</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section className="w-full py-12 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Why Choose Elevion
            </h2>
            <p className="text-muted-foreground text-xl mt-4 max-w-[700px] mx-auto">
              Our intelligent platform combines AI power with human expertise
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyMessages.map((message, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: colorAccents[index % colorAccents.length] }}
                  >
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Key Benefit {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Contact form or CTA section */}
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          {showForm ? (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Get Started Today</CardTitle>
                <CardDescription>Fill out this form to begin your journey</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  toast({
                    title: "Thanks for your interest!",
                    description: "A team member will be in touch with you shortly.",
                  });
                  setShowForm(false);
                }}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Type</label>
                    <select className="w-full px-3 py-2 border rounded-md">
                      <option value="">Select your business type</option>
                      <option value="retail">Retail</option>
                      <option value="service">Professional Services</option>
                      <option value="hospitality">Hospitality</option>
                      <option value="tech">Technology</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full">Submit Request</Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Ready to Transform Your Web Presence?
              </h2>
              <p className="text-muted-foreground text-xl mt-4 mb-8">
                Join hundreds of businesses that have already elevated their digital experience
              </p>
              <Button 
                size="lg" 
                onClick={handleCtaClick}
                className="gap-2"
                style={{
                  background: colorAccents[0],
                  borderColor: colorAccents[0],
                }}
              >
                {ctaText} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full py-6 bg-muted">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Elevion</h3>
              <p className="text-sm text-muted-foreground">
                Modern web solutions for growing businesses
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Services</h3>
              <ul className="space-y-2 text-sm">
                <li>Web Design</li>
                <li>Development</li>
                <li>SEO Optimization</li>
                <li>Content Creation</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>Blog</li>
                <li>Case Studies</li>
                <li>Documentation</li>
                <li>Help Center</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li>contact@elevion.dev</li>
                <li>123-456-7890</li>
                <li>123 Web Street, Digital City</li>
              </ul>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Elevion. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Wrap the landing page with optimization capabilities
export default withLandingPageOptimization(LandingPage, '/optimized-landing');
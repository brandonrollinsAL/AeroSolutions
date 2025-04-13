import withLandingPageOptimization from '@/components/withLandingPageOptimization';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, ArrowRight, BarChart2, Zap, Layout, Code } from 'lucide-react';

// Create a basic landing page to showcase optimization capabilities
function LandingPage({ optimizations }: { optimizations?: any }) {
  const [email, setEmail] = useState('');
  
  // Default content for the landing page
  const defaults = {
    // Hero section content
    hero_title: 'Transform Your Web Presence with AI-Powered Optimization',
    hero_subtitle: 'Our intelligent platform learns from user behavior to continuously optimize your landing pages for maximum conversions',
    cta_button_text: 'Get Started Free',
    cta_button_color: 'bg-primary hover:bg-primary/90',
    
    // Features section
    features_title: 'Key Features',
    feature1_title: 'User Behavior Tracking',
    feature1_description: 'Track how users interact with your landing pages to gain valuable insights',
    feature2_title: 'AI-Powered Suggestions',
    feature2_description: 'Get intelligent suggestions to optimize your content, layout, and design',
    feature3_title: 'Real-time Optimization',
    feature3_description: 'Apply changes instantly and see the impact on your conversion rates',
    
    // Stats section
    stats_title: 'Proven Results',
    stat1_value: '37%',
    stat1_label: 'Average Conversion Increase',
    stat2_value: '25%',
    stat2_label: 'Bounce Rate Reduction',
    stat3_value: '45%',
    stat3_label: 'Engagement Improvement',
    
    // Form section
    form_title: 'Start Optimizing Today',
    form_description: 'Enter your email to get started with a free trial',
    submit_button_text: 'Start Free Trial',
  };
  
  // Get the content from optimizations or use defaults
  const content = {
    ...defaults,
    ...optimizations
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you for your interest! We'll contact you at ${email}`);
    setEmail('');
  };
  
  return (
    <div className="flex-1">
      {/* Hero section */}
      <section className="bg-background py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: optimizations?.color_hero_title || '#3B5B9D' }}
          >
            {content.hero_title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            {content.hero_subtitle}
          </p>
          <Button 
            size="lg"
            className={content.cta_button_color}
          >
            {content.cta_button_text} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
      
      <Separator />
      
      {/* Features section */}
      <section className="py-20 px-4 bg-secondary/10">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            {content.features_title}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <BarChart2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{content.feature1_title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {content.feature1_description}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{content.feature2_title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {content.feature2_description}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Layout className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{content.feature3_title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {content.feature3_description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <Separator />
      
      {/* Stats section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            {content.stats_title}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary mb-2">{content.stat1_value}</p>
              <p className="text-muted-foreground">{content.stat1_label}</p>
            </div>
            
            <div>
              <p className="text-4xl font-bold text-primary mb-2">{content.stat2_value}</p>
              <p className="text-muted-foreground">{content.stat2_label}</p>
            </div>
            
            <div>
              <p className="text-4xl font-bold text-primary mb-2">{content.stat3_value}</p>
              <p className="text-muted-foreground">{content.stat3_label}</p>
            </div>
          </div>
        </div>
      </section>
      
      <Separator />
      
      {/* Form section */}
      <section className="py-20 px-4 bg-secondary/5">
        <div className="container mx-auto max-w-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">{content.form_title}</h2>
            <p className="text-muted-foreground">{content.form_description}</p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                >
                  {content.submit_button_text}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Our Customers Say
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <p className="italic text-muted-foreground mb-4">
                  "The AI-powered optimization tools have transformed our landing pages. 
                  We've seen a significant increase in conversions since implementing the suggestions."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <span className="font-bold">JD</span>
                  </div>
                  <div>
                    <p className="font-medium">Jane Doe</p>
                    <p className="text-sm text-muted-foreground">Marketing Director, TechCorp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <p className="italic text-muted-foreground mb-4">
                  "The real-time analytics and optimization suggestions are game-changers.
                  Our team can now make data-driven decisions much faster."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <span className="font-bold">MS</span>
                  </div>
                  <div>
                    <p className="font-medium">Mike Smith</p>
                    <p className="text-sm text-muted-foreground">CEO, GrowthStart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Call to action */}
      <section className="py-20 px-4 bg-primary text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to optimize your landing pages?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that are using AI-powered optimization to increase their conversion rates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg">
              Schedule a Demo
            </Button>
            <Button variant="outline" className="bg-transparent border-white hover:bg-white/10" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// Wrap the landing page with the HOC to add optimization capabilities
export default withLandingPageOptimization(LandingPage);
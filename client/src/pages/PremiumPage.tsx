import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/layouts/MainLayout';
import { Helmet } from 'react-helmet';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Lock, Shield, Zap, LineChart, Users, Database, Clock } from 'lucide-react';
import { Link } from 'wouter';

const PremiumPage = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    // Add a slight delay to scroll animations for premium feel
    const featuresCards = document.querySelectorAll('.feature-card');
    featuresCards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('fade-in');
      }, 100 * index);
    });
  }, []);

  const premiumFeatures = [
    {
      title: t('premium_benefit_1'),
      description: "Gain insights into operations with detailed analytics dashboards and customizable reports.",
      icon: <LineChart className="w-10 h-10 text-blue-600" />,
    },
    {
      title: t('premium_benefit_2'),
      description: "Get direct access to our senior support team with guaranteed response within 2 hours.",
      icon: <Users className="w-10 h-10 text-blue-600" />,
    },
    {
      title: t('premium_benefit_3'),
      description: "Access proprietary industry research and aviation market trends analysis.",
      icon: <Database className="w-10 h-10 text-blue-600" />,
    },
    {
      title: t('premium_benefit_4'),
      description: "Be among the first to test and use our newest features before general release.",
      icon: <Zap className="w-10 h-10 text-blue-600" />,
    },
    {
      title: t('premium_benefit_5'),
      description: "Work with our team for custom integrations with your existing systems.",
      icon: <Shield className="w-10 h-10 text-blue-600" />,
    },
    {
      title: "Advanced Security Protocols",
      description: "Enhanced encryption, multi-factor authentication, and dedicated security audits.",
      icon: <Lock className="w-10 h-10 text-blue-600" />,
    },
  ];

  const exclusiveContent = [
    {
      title: "Aviation Leadership Summit 2025 - Full Access",
      type: "Video Series",
      duration: "8 hours",
      description: "Exclusive recordings from our annual summit featuring aviation industry leaders and technology innovators."
    },
    {
      title: "Future of Flight Operations: AI Integration",
      type: "White Paper",
      pages: 42,
      description: "Comprehensive research on artificial intelligence applications in modern flight operations."
    },
    {
      title: "Private Aviation Cost Optimization",
      type: "Case Study Collection",
      count: 12,
      description: "Real-world examples of how operators reduced costs by 30% using advanced technology solutions."
    },
    {
      title: "NextGen Avionics Systems",
      type: "Webinar Series",
      count: 6,
      description: "Expert presentations on the latest avionics advancements and integration strategies."
    }
  ];

  return (
    <MainLayout>
      <SEOHead
        title={`${t('premium_title')} | Aero Solutions`}
        description="Access exclusive aviation technology features, premium content, and priority support with our premium membership plan."
        keywords="aviation premium subscription, exclusive aviation content, priority support, advanced analytics, aviation software premium"
        ogType="product"
        ogImage="/images/premium-hero.webp"
      />
      
      {/* Premium Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <Badge variant="outline" className="mb-4 text-white border-white/50 px-3 py-1">
                <Star className="w-4 h-4 mr-1 inline" /> Premium Access
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('premium_title')}</h1>
              <p className="text-xl mb-8 text-blue-100">{t('premium_subtitle')}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-black">
                  <Link to="/subscriptions">{t('btn_upgrade')}</Link>
                </Button>
                <Button variant="outline" className="border-white/50 text-white hover:bg-white/10">
                  {t('btn_learn_more')}
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500 rounded-full opacity-20 blur-3xl"></div>
              <div className="relative rounded-lg overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/80 to-transparent z-10"></div>
                <img 
                  src="/images/aviation-cockpit.jpeg" 
                  alt="Premium Aviation Services" 
                  className="w-full object-cover h-96"
                  loading="eager"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="text-green-400 w-5 h-5" />
                    <span className="text-sm text-blue-100">Trusted by 200+ aviation companies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-400 w-5 h-5" />
                    <span className="text-sm text-blue-100">99.9% uptime guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Premium Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Premium Features & Benefits</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Unlock advanced capabilities and exclusive resources to transform your aviation operations.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {premiumFeatures.map((feature, index) => (
              <Card key={index} className="feature-card opacity-0 transition-all duration-500 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Exclusive Content */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Exclusive Premium Content</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Access specialized aviation resources available only to our premium members.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {exclusiveContent.map((content, index) => (
              <Card key={index} className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all">
                <div className="h-2 bg-gradient-to-r from-blue-700 to-blue-500"></div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{content.title}</CardTitle>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {content.type}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center mt-2">
                    {content.duration && (
                      <span className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-1" /> {content.duration}
                      </span>
                    )}
                    {content.pages && (
                      <span className="text-sm">{content.pages} pages</span>
                    )}
                    {content.count && (
                      <span className="text-sm">Series of {content.count}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{content.description}</p>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t pt-4">
                  <Button className="w-full">
                    Access Content <Lock className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-blue-800 hover:bg-blue-900">
              <Link to="/subscriptions">{t('premium_join')}</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-white border-white/50 px-3 py-1">
              Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Premium Members Say</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Hear from aviation professionals who have transformed their operations with our premium solutions.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-8 rounded-lg relative">
              <div className="text-amber-400 text-6xl absolute -top-4 left-4 opacity-30">"</div>
              <p className="mb-6 relative z-10">The advanced analytics have provided insights that allowed us to reduce our operational costs by 22% in just six months.</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img src="/images/avatar-placeholder.jpeg" alt="Customer Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-medium">Michael Reynolds</h4>
                  <p className="text-gray-400 text-sm">COO, Atlantic Airways</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-lg relative">
              <div className="text-amber-400 text-6xl absolute -top-4 left-4 opacity-30">"</div>
              <p className="mb-6 relative z-10">The priority support has been a game-changer. We had a critical issue resolved within 45 minutes during a high-stakes operation.</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img src="/images/avatar-placeholder.jpeg" alt="Customer Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-medium">Sarah Landon</h4>
                  <p className="text-gray-400 text-sm">Director, SkyWest Operations</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-lg relative">
              <div className="text-amber-400 text-6xl absolute -top-4 left-4 opacity-30">"</div>
              <p className="mb-6 relative z-10">The exclusive industry insights have helped us stay ahead of regulatory changes and market trends in a rapidly evolving landscape.</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img src="/images/avatar-placeholder.jpeg" alt="Customer Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-medium">James Chen</h4>
                  <p className="text-gray-400 text-sm">CEO, Asia Pacific Charters</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('premium_join')}</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">Transform your aviation operations with exclusive features, priority support, and industry-leading insights.</p>
          <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-black">
            <Link to="/subscriptions">{t('btn_upgrade')}</Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
};

export default PremiumPage;
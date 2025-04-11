import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { 
  Star, 
  Shield, 
  TrendingUp, 
  BarChart, 
  Gauge, 
  Wrench, 
  Clock, 
  Headphones 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

const PremiumPage: React.FC = () => {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: <BarChart className="h-10 w-10 text-primary" />,
      title: t('premium_feature1'),
      description: 'Gain deep insights into your fleet performance, fuel efficiency, and operational metrics with our customizable analytics dashboard.'
    },
    {
      icon: <Gauge className="h-10 w-10 text-primary" />,
      title: t('premium_feature2'),
      description: 'Monitor your entire fleet in real-time with precise location tracking, status updates, and critical alert notifications.'
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-primary" />,
      title: t('premium_feature3'),
      description: 'Leverage AI-powered analytics to predict maintenance needs before issues arise, reducing downtime and extending equipment life.'
    },
    {
      icon: <Wrench className="h-10 w-10 text-primary" />,
      title: t('premium_feature4'),
      description: 'Our expert team will custom-integrate our solutions with your existing infrastructure for a seamless workflow.'
    },
    {
      icon: <Headphones className="h-10 w-10 text-primary" />,
      title: t('premium_feature5'),
      description: 'Get immediate assistance from our dedicated support team, available around the clock for any urgent issues.'
    }
  ];
  
  const plans = [
    {
      name: 'Premium Essentials',
      price: '$999',
      period: '/month',
      description: 'Perfect for small to medium flight operations',
      features: [
        'Real-time fleet monitoring',
        'Basic analytics dashboard',
        'Email and chat support',
        'Up to 5 aircraft',
        'Data retention: 6 months'
      ],
      badge: 'Popular',
      buttonText: 'Subscribe Now'
    },
    {
      name: 'Premium Professional',
      price: '$2,499',
      period: '/month',
      description: 'Designed for growing flight departments',
      features: [
        'Advanced analytics dashboard',
        'Predictive maintenance',
        'Priority support 24/7',
        'Up to 15 aircraft',
        'Data retention: 12 months',
        'Custom reporting'
      ],
      badge: 'Best Value',
      buttonText: 'Subscribe Now'
    },
    {
      name: 'Premium Enterprise',
      price: '$4,999',
      period: '/month',
      description: 'Comprehensive solution for large operations',
      features: [
        'All Premium Professional features',
        'Custom integration services',
        'Dedicated account manager',
        'Unlimited aircraft',
        'Data retention: 24 months',
        'Custom API access',
        'White-labeled mobile app'
      ],
      badge: 'Full Access',
      buttonText: 'Contact Sales'
    }
  ];
  
  const faqs = [
    {
      question: 'How does the Premium subscription differ from the standard offering?',
      answer: 'Our Premium subscriptions include advanced features not available in the standard package, such as real-time monitoring, predictive maintenance, and priority 24/7 support. Premium subscribers also benefit from longer data retention periods and can monitor more aircraft.'
    },
    {
      question: 'Can I upgrade my subscription at any time?',
      answer: 'Yes, you can upgrade your subscription at any time. The price difference will be prorated for the remainder of your billing cycle. Contact our sales team for a seamless transition.'
    },
    {
      question: 'Do you offer custom solutions beyond the Premium Enterprise plan?',
      answer: 'Absolutely. For aviation operations with unique requirements, we offer fully customized solutions. Our engineering team will work closely with you to develop tailored features that address your specific needs.'
    },
    {
      question: 'Is there a minimum commitment period?',
      answer: 'Our Premium subscriptions are available with monthly or annual billing. Annual subscriptions come with a 15% discount compared to monthly billing. The minimum commitment for monthly billing is 3 months.'
    },
    {
      question: 'How secure is the platform?',
      answer: 'Security is our top priority. We employ industry-leading encryption standards, regular security audits, and comply with major aviation security frameworks. All data is stored in redundant, ISO 27001 certified data centers.'
    }
  ];

  return (
    <div className="bg-background py-12">
      <Helmet>
        <title>Premium Solutions | Aero Solutions Aviation Software</title>
        <meta name="description" content="Explore Aero Solutions' premium aviation software solutions with advanced features, real-time monitoring, and 24/7 priority support for optimal flight operations." />
        <meta name="keywords" content="aviation software, premium aviation solutions, flight monitoring, predictive maintenance, aviation analytics" />
        <link rel="canonical" href="https://aerosolutions.dev/premium" />
      </Helmet>

      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl flex items-center justify-center gap-3">
              <Star className="h-10 w-10 text-gold inline" />
              {t('premium_title')}
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {t('premium_subtitle')}
            </p>
            <p className="mt-6 text-base">
              {t('premium_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Advanced Features & Capabilities
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our premium solutions provide the tools you need to optimize your aviation operations.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="bg-background rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border">
                <div className="flex flex-col items-center">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-center mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground text-center">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Premium Subscription Plans
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that best fits your aviation operation needs.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <Card key={index} className="relative flex flex-col hover:shadow-lg transition-shadow duration-300">
                {plan.badge && (
                  <Badge className="absolute top-4 right-4" variant="default">
                    {plan.badge}
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline mt-2">
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="ml-1 text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-4">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Shield className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/subscriptions">
                      {plan.buttonText}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials & FAQs */}
      <div className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Tabs defaultValue="testimonials" className="w-full">
            <div className="mx-auto max-w-2xl text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-6">
                What Our Premium Clients Say
              </h2>
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
                <TabsTrigger value="faqs">FAQs</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="testimonials" className="mt-6">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-background">
                  <CardContent className="pt-6">
                    <div className="relative">
                      <div className="text-2xl font-bold text-primary">"</div>
                      <p className="text-muted-foreground mt-2">
                        The predictive maintenance feature has revolutionized our aircraft management. We've reduced unscheduled maintenance by 78% and significantly improved our operational efficiency.
                      </p>
                      <div className="mt-4">
                        <p className="font-semibold">Michael Rodriguez</p>
                        <p className="text-sm text-muted-foreground">Director of Operations, SkyWest Aviation</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-background">
                  <CardContent className="pt-6">
                    <div className="relative">
                      <div className="text-2xl font-bold text-primary">"</div>
                      <p className="text-muted-foreground mt-2">
                        The advanced analytics dashboard provides insights we never had before. Our fuel efficiency has improved by 12% since implementing Aero Solutions' premium package.
                      </p>
                      <div className="mt-4">
                        <p className="font-semibold">Sarah Chen</p>
                        <p className="text-sm text-muted-foreground">CEO, Pacific Air Charter</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-background md:col-span-2 lg:col-span-1">
                  <CardContent className="pt-6">
                    <div className="relative">
                      <div className="text-2xl font-bold text-primary">"</div>
                      <p className="text-muted-foreground mt-2">
                        Their 24/7 support team has been invaluable. During a critical operation, they helped us resolve an issue within minutes that would have otherwise caused significant delays.
                      </p>
                      <div className="mt-4">
                        <p className="font-semibold">James Anderson</p>
                        <p className="text-sm text-muted-foreground">Chief Pilot, Executive Jets Inc.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="faqs" className="mt-6">
              <div className="mx-auto max-w-3xl">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left font-medium">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl bg-primary rounded-2xl p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">
              Ready to elevate your aviation operations?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/90">
              Join the industry leaders who trust Aero Solutions for their premium aviation software needs.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button className="bg-background text-foreground hover:bg-background/90" size="lg" asChild>
                <Link href="/contact">
                  Schedule a Demo
                </Link>
              </Button>
              <Button variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" size="lg" asChild>
                <Link href="/subscriptions">
                  View All Plans
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/80">
              No commitment required. Our team will help you find the perfect solution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
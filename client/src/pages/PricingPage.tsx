import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Copilot from '@/components/Copilot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { Link } from 'wouter';

export default function PricingPage() {
  const { t } = useTranslation();
  const [monthlyBilling, setMonthlyBilling] = useState(true);

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  const plans = [
    {
      name: t('pricing_starter_title', 'Starter'),
      description: t('pricing_starter_desc', 'Essential tools for small businesses just getting started.'),
      price: monthlyBilling ? 49 : 39,
      features: [
        t('pricing_starter_f1', 'Custom website development'),
        t('pricing_starter_f2', '3 pages included'),
        t('pricing_starter_f3', 'Mobile responsive design'),
        t('pricing_starter_f4', 'Basic SEO setup'),
        t('pricing_starter_f5', 'Contact form integration'),
        t('pricing_starter_f6', '30 days of support'),
      ],
      cta: t('pricing_starter_cta', 'Get Started'),
      popular: false,
      link: '/subscriptions/checkout?plan=starter'
    },
    {
      name: t('pricing_business_title', 'Business'),
      description: t('pricing_business_desc', 'Complete solution for growing businesses with additional needs.'),
      price: monthlyBilling ? 99 : 79,
      features: [
        t('pricing_business_f1', 'Everything in Starter'),
        t('pricing_business_f2', 'Up to 10 pages'),
        t('pricing_business_f3', 'Blog or news section'),
        t('pricing_business_f4', 'Advanced SEO optimization'),
        t('pricing_business_f5', 'Social media integration'),
        t('pricing_business_f6', 'Google Analytics setup'),
        t('pricing_business_f7', '60 days of support'),
        t('pricing_business_f8', 'Content management system'),
      ],
      cta: t('pricing_business_cta', 'Get Started'),
      popular: true,
      link: '/subscriptions/checkout?plan=business'
    },
    {
      name: t('pricing_premium_title', 'Premium'),
      description: t('pricing_premium_desc', 'Advanced features and priority support for established businesses.'),
      price: monthlyBilling ? 199 : 159,
      features: [
        t('pricing_premium_f1', 'Everything in Business'),
        t('pricing_premium_f2', 'Unlimited pages'),
        t('pricing_premium_f3', 'E-commerce functionality'),
        t('pricing_premium_f4', 'Customer account area'),
        t('pricing_premium_f5', 'Premium design elements'),
        t('pricing_premium_f6', 'API integrations'),
        t('pricing_premium_f7', 'Priority support'),
        t('pricing_premium_f8', '90 days of support'),
        t('pricing_premium_f9', 'Monthly performance reports'),
      ],
      cta: t('pricing_premium_cta', 'Get Started'),
      popular: false,
      link: '/subscriptions/checkout?plan=premium'
    }
  ];

  return (
    <>
      <Helmet>
        <title>{t('pricing_title', 'Pricing & Plans')} | Elevion</title>
        <meta name="description" content={t('pricing_meta_desc', 'Explore Elevion\'s flexible pricing plans for web development. Transparent pricing, no hidden fees, and plans for every business size.')} />
        <meta name="keywords" content="web development pricing, website design packages, affordable web solutions, small business website costs" />
        <link rel="canonical" href="https://elevion.dev/pricing" />
      </Helmet>

      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-poppins font-bold text-slate-blue mb-4">
            {t('pricing_heading', 'Simple, Transparent Pricing')}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t('pricing_subheading', 'Choose the perfect plan for your business needs. No hidden fees, just honest pricing and exceptional value.')}
          </p>
          
          <div className="flex items-center justify-center mt-8 space-x-2">
            <span className={`text-sm font-medium ${monthlyBilling ? 'text-slate-blue' : 'text-slate-500'}`}>
              {t('pricing_monthly', 'Monthly')}
            </span>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                monthlyBilling ? 'bg-slate-200' : 'bg-electric-cyan'
              }`}
              role="switch"
              aria-checked={!monthlyBilling}
              onClick={() => setMonthlyBilling(!monthlyBilling)}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  monthlyBilling ? 'translate-x-0' : 'translate-x-5'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${!monthlyBilling ? 'text-slate-blue' : 'text-slate-500'}`}>
              {t('pricing_annual', 'Annual')}
            </span>
            <span className="ml-2 text-xs font-medium text-sunset-orange">
              {t('pricing_save', 'Save 20%')}
            </span>
          </div>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={`flex flex-col ${plan.popular ? 'border-electric-cyan ring-1 ring-electric-cyan shadow-lg' : 'border-slate-200'}`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                  <span className="bg-electric-cyan text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {t('pricing_popular', 'Most Popular')}
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl font-poppins">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-slate-blue">${plan.price}</span>
                  <span className="text-slate-500 ml-2">{monthlyBilling ? t('pricing_per_month', '/month') : t('pricing_per_year', '/year')}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-electric-cyan shrink-0 mt-0.5" />
                      <span className="ml-3 text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={plan.link} className="w-full">
                  <Button
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-electric-cyan hover:bg-slate-blue text-white' 
                        : 'bg-slate-blue hover:bg-electric-cyan text-white'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-20 bg-slate-50 rounded-lg p-8 border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-poppins font-bold text-slate-blue mb-4">
              {t('pricing_custom_heading', 'Need a Custom Solution?')}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {t('pricing_custom_desc', 'We understand that every business has unique requirements. Contact us for a personalized quote tailored to your specific needs.')}
            </p>
          </div>
          
          <div className="flex justify-center">
            <Link href="/contact">
              <Button variant="outline" className="border-slate-blue hover:bg-slate-blue hover:text-white mr-4">
                {t('pricing_contact_us', 'Contact Us')}
              </Button>
            </Link>
            <Link href="/#instant-quote">
              <Button className="bg-sunset-orange hover:bg-sunset-orange/90 text-white">
                {t('pricing_instant_quote', 'Get an Instant Quote')}
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-16">
          <h3 className="text-2xl font-poppins font-bold text-slate-blue mb-4">
            {t('pricing_faq_heading', 'Frequently Asked Questions')}
          </h3>
          
          <div className="mt-8 space-y-8">
            <div>
              <h4 className="text-lg font-medium text-slate-800 mb-2">
                {t('pricing_faq_q1', 'Do you offer custom web development services?')}
              </h4>
              <p className="text-slate-600">
                {t('pricing_faq_a1', 'Yes, we specialize in custom web development tailored to your specific business needs. Our team can create unique solutions that align with your brand and goals.')}
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-slate-800 mb-2">
                {t('pricing_faq_q2', 'How long does website development take?')}
              </h4>
              <p className="text-slate-600">
                {t('pricing_faq_a2', 'Development timelines vary based on project complexity. A basic website might take 2-3 weeks, while more complex projects with custom functionality can take 4-8 weeks or more.')}
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-slate-800 mb-2">
                {t('pricing_faq_q3', 'Can I upgrade my plan later?')}
              </h4>
              <p className="text-slate-600">
                {t('pricing_faq_a3', 'Absolutely! You can upgrade your plan at any time. We will prorate the difference and apply it to your new plan.')}
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-slate-800 mb-2">
                {t('pricing_faq_q4', 'Do you offer ongoing maintenance and support?')}
              </h4>
              <p className="text-slate-600">
                {t('pricing_faq_a4', 'Yes, all our plans include a support period. After that period, you can purchase additional support or maintenance packages to keep your website running smoothly.')}
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <Copilot />
    </>
  );
}
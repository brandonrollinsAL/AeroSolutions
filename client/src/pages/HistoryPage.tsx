import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import {
  CalendarClock,
  Award,
  Users,
  Plane,
  Building,
  Globe,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent 
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
import { Separator } from '@/components/ui/separator';

// Founder profile images
import founderImage1 from '@assets/D22397D6-2EF2-45C5-A107-D6BD5E7210F4.jpeg';
import founderImage2 from '@assets/IMG_0165.jpeg';
import founderImage3 from '@assets/a22i5967.jpeg';
import founderImage4 from '@assets/IMG_1431.jpeg';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
};

const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
  
  const timeline = [
    {
      year: '2005',
      title: 'Foundation of Aero Solutions',
      description: t('history_milestone1'),
      icon: <Building className="h-8 w-8 text-primary" />,
      achievements: [
        'Founded by four aviation technology experts',
        'Initial focus on flight scheduling software',
        'First office established in Atlanta, GA'
      ]
    },
    {
      year: '2008',
      title: 'First Major Product Launch',
      description: t('history_milestone2'),
      icon: <Plane className="h-8 w-8 text-primary" />,
      achievements: [
        'Launched AeroSync v1.0 for regional airlines',
        'Secured contracts with 10 regional carriers',
        'Expanded team to 25 employees'
      ]
    },
    {
      year: '2012',
      title: 'International Expansion',
      description: t('history_milestone3'),
      icon: <Globe className="h-8 w-8 text-primary" />,
      achievements: [
        'Opened offices in London, Singapore, Sydney, Dubai, and Toronto',
        'Released multi-language support for all platforms',
        'Achieved 300% growth in international clients'
      ]
    },
    {
      year: '2018',
      title: 'AI Technology Integration',
      description: t('history_milestone4'),
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      achievements: [
        'Introduced machine learning algorithms for flight optimization',
        'Reduced fuel consumption by 15% for client airlines',
        'Filed 12 patents for proprietary AI technologies'
      ]
    },
    {
      year: '2023',
      title: 'Industry Leadership',
      description: t('history_milestone5'),
      icon: <Trophy className="h-8 w-8 text-primary" />,
      achievements: [
        'Named "Aviation Technology Provider of the Year"',
        'Serving 65% of global commercial airlines',
        'Launched sustainable aviation initiatives'
      ]
    }
  ];

  const founders = [
    {
      name: 'Dr. Sarah Johnson',
      title: 'CEO & Co-Founder',
      bio: 'Former aerospace engineer with 15 years at Boeing. PhD in Computer Science from MIT. Pioneer in applying machine learning to aviation systems.',
      image: founderImage1
    },
    {
      name: 'Bernie Rollins',
      title: 'CTO & Co-Founder',
      bio: 'Former Chief Systems Architect at Lockheed Martin. Graduate of Embry-Riddle Aeronautical University. "Fuck Embry Riddle was expensive" is his famous quote.',
      image: founderImage2
    },
    {
      name: 'Captain Michael Chen',
      title: 'COO & Co-Founder',
      bio: 'Former commercial airline pilot with 12,000+ flight hours. MBA from Stanford. Bridges the gap between aviation operations and technology.',
      image: founderImage3
    },
    {
      name: 'Dr. Amelia Rodriguez',
      title: 'Chief Innovation Officer & Co-Founder',
      bio: 'PhD in Aviation Safety Systems. Previously led the FAA\'s NextGen implementation team. Passionate about making aviation safer through technology.',
      image: founderImage4
    }
  ];

  const awards = [
    {
      year: '2023',
      award: 'Aviation Technology Provider of the Year',
      organization: 'Global Aviation Awards'
    },
    {
      year: '2022',
      award: 'Best Aviation Software Suite',
      organization: 'Technology Excellence Awards'
    },
    {
      year: '2021',
      award: 'Innovation in Flight Operations',
      organization: 'International Air Transport Association'
    },
    {
      year: '2020',
      award: 'Best AI Implementation in Aviation',
      organization: 'Aviation Technology Summit'
    },
    {
      year: '2019',
      award: 'Safety Enhancement Through Technology',
      organization: 'Flight Safety Foundation'
    }
  ];

  return (
    <div className="bg-background">
      <Helmet>
        <title>Our History & Legacy | Aero Solutions Aviation Software</title>
        <meta 
          name="description" 
          content="Explore Aero Solutions' journey from its foundation to becoming a leader in aviation technology, with innovations that have transformed the industry." 
        />
        <meta 
          name="keywords" 
          content="aviation history, airline software history, aero solutions history, aviation technology evolution" 
        />
        <link rel="canonical" href="https://aerosolutions.dev/history" />
      </Helmet>

      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl flex items-center justify-center gap-3">
              <CalendarClock className="h-10 w-10 text-primary inline" />
              {t('history_title')}
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {t('history_subtitle')}
            </p>
            <p className="mt-6 text-base max-w-prose mx-auto">
              {t('history_intro')}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Our Journey Through the Years
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From our humble beginnings to industry leadership
            </p>
          </div>
          
          <div className="relative">
            {/* Vertical Line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-primary/30" />
            
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="space-y-12 md:space-y-24"
            >
              {timeline.map((milestone, index) => (
                <motion.div 
                  key={index} 
                  variants={item}
                  className={`relative flex flex-col md:flex-row gap-8 items-center ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Year Circle */}
                  <div className="absolute hidden md:flex left-1/2 transform -translate-x-1/2 items-center justify-center">
                    <div className="rounded-full bg-primary text-primary-foreground p-4 shadow-lg z-10">
                      {milestone.icon}
                    </div>
                  </div>
                  
                  {/* Content Card */}
                  <Card className={`w-full md:w-5/12 bg-background shadow-md hover:shadow-lg transition-shadow duration-300 ${
                    index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'
                  }`}>
                    <CardContent className="p-6">
                      <div className="md:hidden flex items-center gap-4 mb-4">
                        <div className="rounded-full bg-primary text-primary-foreground p-3">
                          {milestone.icon}
                        </div>
                        <h3 className="text-2xl font-bold">{milestone.year}</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">{milestone.title}</h3>
                          <span className="hidden md:block text-2xl font-extrabold text-primary">{milestone.year}</span>
                        </div>
                        <p className="text-muted-foreground">{milestone.description}</p>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2">Key Achievements:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {milestone.achievements.map((achievement, i) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Founding Team Section */}
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t('founding_team')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The visionaries who brought Aero Solutions to life
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {founders.map((founder, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4 overflow-hidden rounded-full w-40 h-40 border-4 border-primary">
                  <img 
                    src={founder.image} 
                    alt={founder.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold">{founder.name}</h3>
                <p className="text-primary font-medium mb-2">{founder.title}</p>
                <p className="text-sm text-muted-foreground">{founder.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Recognition & Legacy Section */}
      <div className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Tabs defaultValue="awards" className="w-full">
            <div className="mx-auto max-w-2xl text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-6">
                {t('our_legacy')}
              </h2>
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="awards">Awards & Recognition</TabsTrigger>
                <TabsTrigger value="impact">Industry Impact</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="awards" className="mt-6">
              <div className="mx-auto max-w-4xl">
                <div className="grid gap-4">
                  {awards.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center bg-background p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                    >
                      <div className="mr-4 flex-shrink-0">
                        <Award className="h-10 w-10 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{item.award}</h3>
                        <p className="text-muted-foreground text-sm">{item.organization} • {item.year}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="impact" className="mt-6">
              <div className="mx-auto max-w-3xl">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-left font-medium">
                      Safety Improvements
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>Our predictive maintenance algorithms have helped prevent over 215 potential in-flight incidents across client airlines in the past decade. By analyzing patterns that human operators might miss, our systems provide early detection of mechanical issues before they become critical.</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-left font-medium">
                      Environmental Impact
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>Through optimized flight paths and fuel management, our software has contributed to a reduction of approximately 3.2 million tons of carbon emissions annually across our client base. Our Green Flight Initiative continues to push the boundaries of efficiency in aviation.</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-left font-medium">
                      Operational Efficiency
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>Airlines using our complete platform suite report an average 23% improvement in operational efficiency, including reduced delays, optimized crew scheduling, and improved resource allocation. This translates to approximately $4.3 million in savings per year for a mid-sized airline.</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-left font-medium">
                      Technology Innovation
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>With 47 patents to our name, we've pioneered multiple innovations that have been adopted as industry standards. Our open API architecture has fostered a vibrant ecosystem of third-party developers creating specialized aviation solutions that integrate with our core platforms.</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-5">
                    <AccordionTrigger className="text-left font-medium">
                      Global Reach
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>Our solutions are currently used in 97 countries, managing operations for over 580 airlines and aviation service providers. From major international carriers to specialized charter operations, our scalable technology serves the entire spectrum of the aviation industry.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Quote Section */}
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-4xl text-primary font-serif">"</div>
            <p className="text-xl md:text-2xl italic font-light text-foreground/90 max-w-3xl mx-auto my-6">
              {t('legacy_text')}
            </p>
            <div className="text-4xl text-primary font-serif">"</div>
            <div className="mt-8 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary mr-2" />
              <span className="font-medium">The Aero Solutions Founding Team</span>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .gold {
            color: #D4AF37;
          }
        `}
      </style>
    </div>
  );
};

export default HistoryPage;
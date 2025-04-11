import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/layouts/MainLayout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TimerIcon, Award, Globe, Users, Zap, LineChart } from 'lucide-react';

const HistoryPage = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    // Add intersection observer for timeline animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('timeline-visible');
        }
      });
    }, { threshold: 0.2 });
    
    document.querySelectorAll('.timeline-item').forEach(item => {
      observer.observe(item);
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  const timelineEvents = [
    {
      year: "2018",
      title: t('legacy_founding'),
      description: "Aero Solutions was founded by a team of aviation software engineers and pilots with a mission to transform flight operations technology.",
      image: "/images/aviation-tech.jpeg",
      achievements: ["Initial team of 5 software engineers", "1.2M in seed funding", "First office in San Francisco"]
    },
    {
      year: "2019",
      title: t('legacy_first_product'),
      description: "Launch of our first product, AeroSync - a revolutionary flight operations management platform that quickly gained industry recognition.",
      image: "/images/aviation-controls.webp",
      achievements: ["15 initial clients", "Featured in Aviation Weekly", "Aviation Technology Innovation Award"]
    },
    {
      year: "2020",
      title: t('legacy_expansion'),
      description: "Despite global challenges, we expanded our product suite with AeroOps and established our presence in the European market.",
      image: "/images/aviation-tech.jpeg",
      achievements: ["European office opened in Amsterdam", "Team expanded to 25 engineers", "Client base doubled to 30+ airlines"]
    },
    {
      year: "2021",
      title: t('legacy_innovation'),
      description: "Introduced groundbreaking AI capabilities to our platforms, setting new industry standards for aviation software intelligence.",
      image: "/images/aviation-cockpit.jpeg",
      achievements: ["AI-powered flight optimization", "Predictive maintenance features", "Reduced operational costs by 18%"]
    },
    {
      year: "2022",
      title: t('legacy_recognition'),
      description: "Our platforms received industry-wide recognition, with major airlines and private aviation companies adopting our solutions.",
      image: "/images/aviation-tech.jpeg",
      achievements: ["Top Aviation Software Provider Award", "100+ global clients", "Series B funding of $30M"]
    },
    {
      year: "2023",
      title: t('legacy_global'),
      description: "Expanded our global footprint with offices in Singapore and Dubai, serving clients across 6 continents.",
      image: "/images/aviation-controls.webp",
      achievements: ["Offices in 4 countries", "200+ aviation clients", "Integration with major aviation systems"]
    },
    {
      year: "2024",
      title: t('legacy_future'),
      description: "Launched advanced premium features and multilingual support, positioned as the leading global aviation technology provider.",
      image: "/images/aviation-tech.jpeg",
      achievements: ["Industry-leading uptime of 99.99%", "Premium subscription model", "Strategic partnerships with aircraft manufacturers"]
    }
  ];
  
  // Stats for achievements section
  const stats = [
    { value: "200+", label: "Aviation Clients", icon: <Users className="w-6 h-6 text-blue-600" /> },
    { value: "4", label: "Global Offices", icon: <Globe className="w-6 h-6 text-blue-600" /> },
    { value: "18%", label: "Avg. Cost Reduction", icon: <LineChart className="w-6 h-6 text-blue-600" /> },
    { value: "99.99%", label: "Platform Uptime", icon: <Zap className="w-6 h-6 text-blue-600" /> },
  ];

  return (
    <MainLayout>
      <SEOHead
        title={`${t('legacy_title')} | Aero Solutions`}
        description="Explore Aero Solutions' journey of innovation and growth since 2018, becoming a leading provider of aviation technology solutions worldwide."
        keywords="aviation software history, aero solutions legacy, aviation technology innovation, aviation software company history"
        ogType="article"
        ogImage="/images/legacy-hero.webp"
      />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <Badge variant="outline" className="mb-4 text-white border-white/50 px-3 py-1">
                <TimerIcon className="w-4 h-4 mr-1 inline" /> Our Journey
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('legacy_title')}</h1>
              <p className="text-xl mb-8 text-blue-100">{t('legacy_subtitle')}</p>
            </div>
            <div className="md:w-2/5">
              <div className="relative rounded-lg overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/80 to-transparent z-10"></div>
                <img 
                  src="/images/aviation-tech.jpeg" 
                  alt="Aero Solutions History" 
                  className="w-full object-cover h-80"
                  loading="eager"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <div className="flex gap-2 items-center">
                    <Award className="text-amber-400 w-6 h-6" />
                    <span className="font-semibold text-white">Excellence in Aviation Technology</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Mission Statement */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Our Mission</h2>
          <p className="text-xl leading-relaxed mb-8">
            From day one, our mission has been to transform the aviation industry through innovative software solutions that enhance safety, efficiency, and profitability.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-700" />
              </div>
              <h3 className="font-bold text-lg mb-2">People-Focused</h3>
              <p className="text-gray-600">Built by aviation professionals for aviation professionals</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-blue-700" />
              </div>
              <h3 className="font-bold text-lg mb-2">Innovation-Driven</h3>
              <p className="text-gray-600">Constantly pushing the boundaries of what's possible</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-blue-700" />
              </div>
              <h3 className="font-bold text-lg mb-2">Globally Focused</h3>
              <p className="text-gray-600">Serving aviation needs around the world</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Timeline Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Journey Through the Years</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">From a small startup to an industry leader, explore the key milestones that shaped our success.</p>
          </div>
          
          <div className="relative">
            {/* Timeline vertical line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-blue-200"></div>
            
            {/* Timeline items */}
            {timelineEvents.map((event, index) => (
              <div 
                key={index} 
                className={`timeline-item mb-16 opacity-0 transition-all duration-1000 translate-y-8 ${
                  index % 2 === 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 p-4 flex flex-col md:items-end">
                    <div className={`md:text-${index % 2 === 0 ? 'left' : 'right'} md:pr-8 md:pl-0 mb-4 md:mb-0`}>
                      <Badge className="mb-2 bg-blue-700">{event.year}</Badge>
                      <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                      <p className="text-gray-600">{event.description}</p>
                      
                      <div className="mt-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Key Achievements:</h4>
                        <ul className="list-disc list-inside text-gray-700">
                          {event.achievements.map((achievement, i) => (
                            <li key={i}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-blue-600 border-4 border-white z-10"></div>
                  
                  <div className="md:w-1/2 p-4">
                    <Card className="overflow-hidden shadow-lg">
                      <div className="h-56 overflow-hidden">
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Stats */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Our Impact in Numbers</h2>
            <p className="mt-4 text-blue-200">Measurable results that demonstrate our commitment to excellence</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-blue-800 border-blue-700 text-white">
                <CardHeader className="pb-2">
                  <div className="mx-auto">{stat.icon}</div>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-4xl font-bold mb-2">{stat.value}</p>
                  <p className="text-blue-200">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Future Vision */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-8 md:p-12 shadow-lg">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2">
                <h2 className="text-3xl font-bold mb-6">Looking to the Future</h2>
                <p className="text-lg mb-6">
                  Our journey doesn't stop here. As we look ahead to 2025 and beyond, we're focused on:
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      <Zap className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Next-Gen AI Integration</h3>
                      <p className="text-gray-600">Developing advanced predictive algorithms to further optimize flight operations and maintenance.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      <Globe className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Global Expansion</h3>
                      <p className="text-gray-600">Establishing new offices in emerging aviation markets to better serve our growing client base.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Strategic Partnerships</h3>
                      <p className="text-gray-600">Collaborating with major aircraft manufacturers and airlines to create integrated technology ecosystems.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="md:w-1/2 flex justify-center items-center">
                <div className="relative rounded-lg overflow-hidden shadow-xl w-full max-w-md">
                  <img 
                    src="/images/aviation-cockpit.jpeg" 
                    alt="Future Vision" 
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent flex items-end">
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2">Join Us on Our Journey</h3>
                      <Button className="bg-white text-blue-900 hover:bg-blue-50">
                        Contact Us
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <style jsx>{`
        .timeline-item {
          transition: all 1s ease-out;
        }
        .timeline-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </MainLayout>
  );
};

export default HistoryPage;
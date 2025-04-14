import { useState } from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/layouts/MainLayout';
import ServiceRecommendations from '@/components/ServiceRecommendations';
import ElevateBot from '@/components/ElevateBot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Rocket, 
  BrainCircuit, 
  ArrowRight, 
  MessageSquare, 
  ListChecks, 
  Sparkles, 
  BarChart3, 
  FileCode, 
  Search 
} from 'lucide-react';

export default function AIServices() {
  const [isBotOpen, setIsBotOpen] = useState(false);

  const openBot = () => {
    setIsBotOpen(true);
  };

  const closeBot = () => {
    setIsBotOpen(false);
  };

  return (
    <MainLayout>
      <Helmet>
        <title>AI-Powered Services | Elevion</title>
        <meta
          name="description"
          content="Experience Elevion's AI-powered tools including personalized service recommendations, intelligent content analysis, and our ElevateBot assistant."
        />
      </Helmet>

      <div className="container py-12 space-y-12">
        {/* Hero section */}
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-[#00D1D1] text-[#EDEFF2]">
              <BrainCircuit className="mr-1 h-3 w-3" /> Powered by Elevion AI
            </div>
            <h1 className="text-4xl font-bold font-poppins text-[#3B5B9D]">
              Intelligent Web Solutions
            </h1>
            <p className="text-lg font-lato text-gray-700">
              Our AI-powered tools help your business make smarter decisions, create better web experiences, and achieve your digital goals faster.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={openBot} className="bg-[#3B5B9D] hover:bg-[#2A4A8C]">
                <MessageSquare className="mr-2 h-4 w-4" /> Try ElevateBot
              </Button>
              <Button variant="outline" className="border-[#3B5B9D] text-[#3B5B9D]">
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -top-6 -left-6 w-40 h-40 bg-[#FF7043] rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-[#00D1D1] rounded-full opacity-20 blur-2xl"></div>
              <div className="relative z-10 bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                <div className="w-16 h-16 bg-[#EDEFF2] rounded-full flex items-center justify-center mb-4">
                  <BrainCircuit className="w-8 h-8 text-[#3B5B9D]" />
                </div>
                <h3 className="text-xl font-semibold font-poppins mb-2">Elevion AI Integration</h3>
                <p className="text-gray-600 font-lato mb-4">
                  Elevion leverages cutting-edge AI technology to deliver unparalleled web solutions for your business.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <MessageSquare className="w-4 h-4" />, text: "ElevateBot" },
                    { icon: <ListChecks className="w-4 h-4" />, text: "Recommendations" },
                    { icon: <FileCode className="w-4 h-4" />, text: "Code Analysis" },
                    { icon: <Search className="w-4 h-4" />, text: "Smart Search" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-2 text-sm text-gray-600">
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Features Section */}
        <div className="py-6">
          <Tabs defaultValue="recommendations" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList>
                <TabsTrigger value="recommendations" className="text-base px-5">
                  <ListChecks className="mr-2 h-4 w-4" /> Recommendations
                </TabsTrigger>
                <TabsTrigger value="elevatebot" className="text-base px-5">
                  <MessageSquare className="mr-2 h-4 w-4" /> ElevateBot
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-base px-5">
                  <BarChart3 className="mr-2 h-4 w-4" /> AI Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="recommendations" className="mt-0">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold font-poppins text-[#3B5B9D]">
                    <Sparkles className="inline mr-2 text-[#FF7043]" /> 
                    Personalized Service Recommendations
                  </h2>
                  <p className="text-gray-700 font-lato">
                    Our advanced AI analyzes your business needs and preferences to suggest the most effective web solutions. Get personalized recommendations that align with your goals and budget.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Tailored service suggestions based on your business type",
                      "Feature recommendations specific to your industry",
                      "Technology stack suggestions optimized for your needs",
                      "Budget-conscious options with the best ROI"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <div className="rounded-full bg-[#EDEFF2] p-1 mr-2 mt-0.5">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 8L7 11L12 5" stroke="#3B5B9D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 font-lato">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <ServiceRecommendations />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="elevatebot" className="mt-0">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold font-poppins text-[#3B5B9D]">
                    <MessageSquare className="inline mr-2 text-[#00D1D1]" /> 
                    ElevateBot AI Assistant
                  </h2>
                  <p className="text-gray-700 font-lato">
                    Meet ElevateBot, your intelligent business assistant powered by Elevion AI. Get instant answers to your web development questions, technical support, and business guidance.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "24/7 access to web development expertise",
                      "Instant answers to technical questions",
                      "Business-focused guidance for digital solutions",
                      "Secure and private conversation history"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <div className="rounded-full bg-[#EDEFF2] p-1 mr-2 mt-0.5">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 8L7 11L12 5" stroke="#3B5B9D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 font-lato">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={openBot} className="bg-[#3B5B9D] hover:bg-[#2A4A8C]">
                    <MessageSquare className="mr-2 h-4 w-4" /> Open ElevateBot
                  </Button>
                </div>
                <div className="bg-[#EDEFF2] rounded-xl p-6 border border-gray-200">
                  <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-[#3B5B9D] flex items-center justify-center mr-2">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-medium font-poppins">ElevateBot</h3>
                    </div>
                    <p className="text-gray-700 font-lato text-sm mb-2">
                      Hi there! I'm your Elevion Tech Assistant, powered by Elevion AI. How can I help you with your web development needs today?
                    </p>
                  </div>
                  <div className="bg-[#00D1D1] rounded-lg p-4 shadow-sm text-white mb-4 ml-auto max-w-[80%]">
                    <p className="font-lato text-sm">
                      How can AI improve my website's user experience?
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-[#3B5B9D] flex items-center justify-center mr-2">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-medium font-poppins">ElevateBot</h3>
                    </div>
                    <p className="text-gray-700 font-lato text-sm">
                      AI can significantly enhance your website's user experience through personalization, intelligent search, predictive analytics, and automated support. These features can help visitors find what they need faster, engage more deeply with your content, and receive immediate assistance.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold font-poppins text-[#3B5B9D]">
                    <BarChart3 className="inline mr-2 text-[#FF7043]" /> 
                    AI-Powered Analytics
                  </h2>
                  <p className="text-gray-700 font-lato">
                    Gain deeper insights into your website performance, user behavior, and content effectiveness with our AI analytics. Make data-driven decisions to optimize your digital presence.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Intelligent user behavior analysis and patterns",
                      "Predictive analytics for future trends",
                      "Content performance optimization",
                      "Conversion opportunity identification"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <div className="rounded-full bg-[#EDEFF2] p-1 mr-2 mt-0.5">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 8L7 11L12 5" stroke="#3B5B9D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 font-lato">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Intelligent Analytics Dashboard</CardTitle>
                    <CardDescription>Gain insights powered by AI and machine learning</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#EDEFF2] p-4 rounded-md">
                          <div className="text-xs text-gray-500 mb-1">User Engagement</div>
                          <div className="text-2xl font-semibold text-[#3B5B9D]">87.3%</div>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="bg-[#3B5B9D] h-full rounded-full" style={{ width: '87.3%' }}></div>
                          </div>
                        </div>
                        <div className="bg-[#EDEFF2] p-4 rounded-md">
                          <div className="text-xs text-gray-500 mb-1">Content Relevance</div>
                          <div className="text-2xl font-semibold text-[#00D1D1]">92.1%</div>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="bg-[#00D1D1] h-full rounded-full" style={{ width: '92.1%' }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="h-40 bg-[#EDEFF2] rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="h-6 w-6 mx-auto text-[#3B5B9D] mb-2" />
                          <p className="text-sm text-gray-600">AI-powered analytics visualization</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['SEO', 'Conversion', 'Performance', 'Accessibility', 'Mobile', 'Security'].map((metric, i) => (
                          <div key={i} className="bg-[#EDEFF2] p-2 rounded-md text-center">
                            <div className="text-xs text-gray-500">{metric}</div>
                            <div className="text-sm font-semibold text-[#3B5B9D]">
                              {Math.floor(80 + Math.random() * 20)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-[#3B5B9D] to-[#2A4A8C] rounded-xl p-8 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-poppins mb-4">Ready to elevate your web presence?</h2>
            <p className="font-lato mb-6">
              Get started with our AI-powered solutions today and transform your digital experience.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={openBot} className="bg-[#00D1D1] hover:bg-[#00AFAF] text-white">
                <MessageSquare className="mr-2 h-4 w-4" /> Chat with ElevateBot
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#3B5B9D]">
                Schedule a Consultation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ElevateBot Component */}
      <ElevateBot isOpen={isBotOpen} hideFloatingButton={true} />
    </MainLayout>
  );
}
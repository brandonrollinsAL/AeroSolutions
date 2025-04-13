import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FaBuilding, FaCheck, FaCogs, FaSyncAlt, FaPercentage, FaRocket } from "react-icons/fa";

// List of business types and features
const businessTypes = [
  { id: "retail", name: "Retail Store" },
  { id: "restaurant", name: "Restaurant/Cafe" },
  { id: "service", name: "Service Business" },
  { id: "professional", name: "Professional Practice" },
  { id: "healthcare", name: "Healthcare Provider" },
  { id: "fitness", name: "Fitness/Wellness" },
  { id: "education", name: "Education/Training" },
  { id: "nonprofit", name: "Non-Profit Organization" },
  { id: "ecommerce", name: "E-commerce" },
  { id: "tech", name: "Technology/SaaS" },
  { id: "manufacturing", name: "Manufacturing" },
  { id: "realestate", name: "Real Estate" },
  { id: "other", name: "Other" }
];

const featuresData = [
  { id: "responsive", name: "Responsive Design", description: "Website adapts to all device sizes", price: 400 },
  { id: "cms", name: "Content Management System", description: "Easy content editing and updating", price: 800 },
  { id: "ecommerce", name: "E-commerce Functionality", description: "Sell products or services online", price: 1200 },
  { id: "booking", name: "Booking/Appointment System", description: "Allow customers to schedule appointments", price: 900 },
  { id: "seo", name: "SEO Optimization", description: "Improve search engine visibility", price: 600 },
  { id: "analytics", name: "Analytics Integration", description: "Track user behavior and performance", price: 500 },
  { id: "social", name: "Social Media Integration", description: "Connect with your social platforms", price: 300 },
  { id: "chat", name: "Live Chat Integration", description: "Chat with visitors in real-time", price: 700 },
  { id: "blog", name: "Blog/News Section", description: "Share updates and content", price: 500 },
  { id: "multilingual", name: "Multilingual Support", description: "Content in multiple languages", price: 800 },
  { id: "membership", name: "User Registration/Login", description: "Member areas and accounts", price: 900 },
  { id: "payments", name: "Payment Gateway Integration", description: "Accept online payments", price: 800 }
];

interface QuoteData {
  basePrice: number;
  marketPrice: number;
  discountedPrice: number;
  breakdown: {
    feature: string;
    marketPrice: number;
    ourPrice: number;
  }[];
  businessInsights: string;
  timeEstimate: string;
}

export default function QuoteGenerator() {
  const [businessType, setBusinessType] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  const [businessDescription, setBusinessDescription] = useState<string>("");
  const [currentWebsite, setCurrentWebsite] = useState<string>("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const generateQuote = async () => {
    if (!businessType || selectedFeatures.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select a business type and at least one feature",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setQuote(null);

    try {
      // Prepare data for AI analysis
      const quoteRequest = {
        businessType,
        businessName: businessName || "Unnamed Business",
        businessDescription,
        currentWebsite,
        selectedFeatures: selectedFeatures.map(id => {
          const feature = featuresData.find(f => f.id === id);
          return { 
            id, 
            name: feature?.name || id, 
            basePrice: feature?.price || 0 
          };
        })
      };
      
      // Send to our AI quote generator API
      const response = await apiRequest("POST", "/api/generate-quote", quoteRequest);
      
      if (!response.ok) {
        throw new Error("Failed to generate quote");
      }
      
      const data = await response.json();
      
      setQuote(data);
    } catch (error) {
      console.error("Error generating quote:", error);
      toast({
        title: "Quote Generation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      
      // Fallback to basic calculation if AI fails
      const basePrice = selectedFeatures.reduce((total, id) => {
        const feature = featuresData.find(f => f.id === id);
        return total + (feature?.price || 0);
      }, 1000); // Base price for any website
      
      setQuote({
        basePrice,
        marketPrice: Math.round(basePrice * 1.3), // Estimated market price
        discountedPrice: Math.round(basePrice * 0.6), // Our price: 60% of standard
        breakdown: selectedFeatures.map(id => {
          const feature = featuresData.find(f => f.id === id);
          const price = feature?.price || 0;
          return {
            feature: feature?.name || id,
            marketPrice: Math.round(price * 1.3),
            ourPrice: Math.round(price * 0.6)
          };
        }),
        businessInsights: "Based on standard industry pricing for your selected features.",
        timeEstimate: `${Math.ceil(selectedFeatures.length * 1.5)} weeks`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-poppins text-[#3B5B9D] flex items-center gap-2">
                <FaRocket className="text-[#00D1D1]" /> Instant Quote Generator
              </CardTitle>
              <CardDescription>
                Tell us about your business and what features you need, and we'll generate a competitive quote instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger id="businessType">
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name (Optional)</Label>
                <Input 
                  id="businessName" 
                  value={businessName} 
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription">Brief Business Description (Optional)</Label>
                <Input 
                  id="businessDescription" 
                  value={businessDescription} 
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="What does your business do?" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentWebsite">Current Website URL (Optional)</Label>
                <Input 
                  id="currentWebsite" 
                  value={currentWebsite} 
                  onChange={(e) => setCurrentWebsite(e.target.value)}
                  placeholder="https://example.com" 
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Select Website Features</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {featuresData.map((feature) => (
                    <div key={feature.id} className="flex items-start space-x-2 rounded-md border p-3 hover:bg-slate-50">
                      <Checkbox 
                        id={`feature-${feature.id}`} 
                        checked={selectedFeatures.includes(feature.id)}
                        onCheckedChange={() => handleFeatureToggle(feature.id)}
                      />
                      <div className="space-y-1 leading-none">
                        <label
                          htmlFor={`feature-${feature.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {feature.name}
                        </label>
                        <p className="text-xs text-slate-500">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-[#3B5B9D] hover:bg-[#2A4A8C] text-white" 
                onClick={generateQuote}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSyncAlt className="mr-2 animate-spin" /> Generating Quote...
                  </>
                ) : (
                  <>
                    <FaBuilding className="mr-2" /> Generate Free Quote
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Quote Results Section */}
        <div>
          {quote ? (
            <Card>
              <CardHeader className="bg-gradient-to-r from-[#3B5B9D] to-[#00D1D1] text-white">
                <CardTitle className="text-2xl font-poppins flex items-center gap-2">
                  <FaPercentage /> Your Custom Quote
                </CardTitle>
                <CardDescription className="text-white/80">
                  We offer premium services at competitive prices
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Market Average</p>
                    <p className="text-2xl font-semibold line-through text-slate-400">${quote.marketPrice}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm text-[#00D1D1] font-medium">Elevion Price (40% Off)</p>
                    <p className="text-3xl font-bold text-[#3B5B9D]">${quote.discountedPrice}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-700">Selected Features:</h4>
                  <ul className="space-y-2">
                    {quote.breakdown.map((item, index) => (
                      <li key={index} className="flex justify-between items-center text-sm">
                        <span className="flex items-center">
                          <FaCheck className="text-[#00D1D1] mr-2" />
                          {item.feature}
                        </span>
                        <span className="font-medium">${item.ourPrice}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-700">Business Insights:</h4>
                  <p className="text-sm text-slate-600">{quote.businessInsights}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-700">Estimated Timeline:</h4>
                  <p className="text-sm text-slate-600">{quote.timeEstimate}</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button className="w-full bg-[#00D1D1] hover:bg-[#00AEAE] text-white">
                  <FaCogs className="mr-2" /> Request Detailed Proposal
                </Button>
                <p className="text-xs text-center text-slate-500">
                  This is an estimate based on your selected features. Contact us for a customized proposal.
                </p>
              </CardFooter>
            </Card>
          ) : (
            <Card className="h-full flex flex-col justify-center items-center p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <FaRocket className="text-4xl text-[#00D1D1]" />
              </div>
              <CardTitle className="text-xl font-poppins text-[#3B5B9D] mb-2">
                Your Quote Will Appear Here
              </CardTitle>
              <CardDescription className="max-w-sm">
                Fill out the form and select your desired features to receive an instant quote for your website project.
              </CardDescription>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
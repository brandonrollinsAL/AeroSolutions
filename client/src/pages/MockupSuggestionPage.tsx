import { useState } from "react";
import MockupSuggestionForm from "@/components/MockupSuggestionForm";
import SEOHead from "@/components/SEOHead";
import MainLayout from "@/layouts/MainLayout";
import { AlertCircle, Download, Share2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function MockupSuggestionPage() {
  const { toast } = useToast();
  const [generatedSuggestions, setGeneratedSuggestions] = useState<string | null>(null);

  const handleSuggestionGenerated = (suggestions: string) => {
    setGeneratedSuggestions(suggestions);
  };

  const handleDownload = () => {
    if (!generatedSuggestions) return;

    const blob = new Blob([generatedSuggestions], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "website-design-suggestions.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded successfully",
      description: "Your design suggestions have been downloaded.",
    });
  };

  const handleShare = async () => {
    if (!generatedSuggestions) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Website Design Suggestions",
          text: "Check out these website design suggestions from Elevion!",
          url: window.location.href,
        });
        toast({
          title: "Shared successfully",
          description: "Your design suggestions have been shared.",
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied to clipboard",
        description: "You can now share this link with others.",
      });
    }
  };

  return (
    <MainLayout>
      <SEOHead
        title="Free Website Design Suggestions | Elevion"
        description="Get free AI-powered website design suggestions tailored to your business type. Receive color schemes, typography, layouts, and key features instantly."
        canonicalUrl="/mockup-suggestions"
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 text-center">
            Free Website Design Suggestions
          </h1>
          
          <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
            Get instant AI-powered design suggestions for your website based on your business type. 
            Receive recommendations for color schemes, typography, layouts, and key features.
          </p>

          <div className="mb-8">
            <Alert className="bg-blue-50 border-blue-200 mb-8">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-700">Pro Tip</AlertTitle>
              <AlertDescription className="text-blue-600">
                Be specific about your business type for more tailored suggestions. For example, instead of "restaurant," 
                try "Italian fine dining restaurant" or "casual breakfast cafe."
              </AlertDescription>
            </Alert>

            <MockupSuggestionForm onComplete={handleSuggestionGenerated} />
          </div>

          {generatedSuggestions && (
            <div className="flex justify-center gap-4 mt-6">
              <Button 
                variant="outline" 
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Suggestions
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          )}

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">
              Ready to bring your design to life?
            </h2>
            <p className="text-slate-600 mb-6">
              Our team can transform these suggestions into a professional, custom-designed website 
              that perfectly represents your brand.
            </p>
            <div className="flex justify-center">
              <Button 
                className="bg-cyan-600 hover:bg-cyan-700"
                asChild
              >
                <a href="/contact">Get a free quote</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
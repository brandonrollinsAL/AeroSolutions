import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WebsiteColorSuggestions from '@/components/WebsiteColorSuggestions';
import { Separator } from '@/components/ui/separator';

/**
 * DesignTools Page
 *
 * A collection of AI-powered tools for website design and branding
 * Currently includes website color suggestions with more tools to be added
 */
export default function DesignTools() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Helmet>
        <title>AI-Powered Design Tools | Elevion</title>
        <meta 
          name="description" 
          content="Access Elevion's suite of AI-powered design tools for website color schemes, branding suggestions, and more." 
        />
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">AI Design Tools</h1>
          <p className="text-muted-foreground max-w-2xl">
            Leverage AI to get professional design recommendations tailored to your business
          </p>
        </div>
      </div>

      <Separator className="my-6" />

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 max-w-[600px]">
          <TabsTrigger value="colors">Color Schemes</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="layouts">Layouts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="colors" className="space-y-6">
          <WebsiteColorSuggestions />
        </TabsContent>
        
        <TabsContent value="typography" className="space-y-6">
          <div className="flex items-center justify-center p-12 border rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Typography Suggestions</h3>
              <p className="text-muted-foreground">Coming soon</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="branding" className="space-y-6">
          <div className="flex items-center justify-center p-12 border rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Branding Suggestions</h3>
              <p className="text-muted-foreground">Coming soon</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="layouts" className="space-y-6">
          <div className="flex items-center justify-center p-12 border rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Layout Recommendations</h3>
              <p className="text-muted-foreground">Coming soon</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="my-6" />

      <div className="bg-muted/50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">How Our AI Design Tools Work</h2>
        <p className="mb-4">
          Our AI-powered design tools analyze thousands of successful websites across different industries to provide 
          recommendations tailored specifically to your business type. These suggestions are based on:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Industry best practices for web design</li>
          <li>Color psychology and user experience research</li>
          <li>Current design trends and timeless principles</li>
          <li>Conversion optimization patterns</li>
          <li>Accessibility standards</li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          While our AI tools provide expert suggestions, we recommend working with a professional designer 
          for comprehensive brand identity creation and implementation.
        </p>
      </div>
    </div>
  );
}
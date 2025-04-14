import { useState } from "react";
import ElevateBot from "@/components/ElevateBot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestElevateBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialOption, setInitialOption] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#3B5B9D]">ElevateBot Testing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Open ElevateBot</CardTitle>
            <CardDescription>Test basic open/close functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                setInitialOption(null);
                setIsOpen(true);
              }}
              className="bg-[#3B5B9D] hover:bg-[#2A4A8C]"
            >
              Open ElevateBot
            </Button>
            <Button 
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="ml-2"
            >
              Close ElevateBot
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test with Initial Options</CardTitle>
            <CardDescription>Open with a specific predefined option</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => {
                  setInitialOption("website-design");
                  setIsOpen(true);
                }}
                className="bg-[#FF7043] hover:bg-[#E5603B]"
              >
                Website Design
              </Button>
              <Button 
                onClick={() => {
                  setInitialOption("web-development");
                  setIsOpen(true);
                }}
                className="bg-[#3B5B9D] hover:bg-[#2A4A8C]"
              >
                Web Development
              </Button>
              <Button 
                onClick={() => {
                  setInitialOption("mobile-optimization");
                  setIsOpen(true);
                }}
                className="bg-[#00D1D1] hover:bg-[#00AEAE]"
              >
                Mobile Optimization
              </Button>
              <Button 
                onClick={() => {
                  setInitialOption("branding-design");
                  setIsOpen(true);
                }}
                className="bg-[#3B5B9D] hover:bg-[#2A4A8C]"
              >
                Branding & Identity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Instructions Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal ml-4 space-y-2">
            <li>Click "Open ElevateBot" to test the basic chat interface</li>
            <li>Try selecting different topics from the chat options</li>
            <li>Test sending custom messages and check the responses</li>
            <li>Use the buttons above to test opening the bot with specific preset topics</li>
            <li>Verify that the chat history is maintained between interactions</li>
          </ol>
        </CardContent>
      </Card>

      {/* Embed the ElevateBot component */}
      <ElevateBot isOpen={isOpen} initialOption={initialOption} hideFloatingButton={false} />
    </div>
  );
}
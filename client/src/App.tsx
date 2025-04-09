import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route, useLocation } from "wouter";
import HomePage from "@/pages/HomePage";
import NotFound from "@/pages/not-found";
import ClientLandingPage from "@/components/ClientLandingPage";

export default function App() {
  const [, setLocation] = useLocation();
  const [accessCode, setAccessCode] = useState<string | null>(null);

  // Listen for messages from the ClientPreviewModal
  useEffect(() => {
    const handleClientAccess = (event: CustomEvent) => {
      if (event.detail && event.detail.accessCode) {
        setAccessCode(event.detail.accessCode);
        setLocation(`/client-preview/${event.detail.accessCode}`);
      }
    };

    // @ts-ignore - Custom event
    window.addEventListener('client-access-granted', handleClientAccess);
    
    return () => {
      // @ts-ignore - Custom event
      window.removeEventListener('client-access-granted', handleClientAccess);
    };
  }, [setLocation]);

  return (
    <>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/client-preview/:code">
          {(params) => <ClientLandingPage accessCode={params.code || accessCode || ""} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

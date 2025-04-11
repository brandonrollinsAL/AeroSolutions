import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PrivacyConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function PrivacyConsentBanner({ onAccept, onDecline }: PrivacyConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('privacy-consent');
    
    if (!hasConsented) {
      // Show banner if no consent has been given yet
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    // Store consent in localStorage
    localStorage.setItem('privacy-consent', 'accepted');
    localStorage.setItem('consent-timestamp', new Date().toISOString());
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    // Store decline in localStorage
    localStorage.setItem('privacy-consent', 'declined');
    localStorage.setItem('consent-timestamp', new Date().toISOString());
    setIsVisible(false);
    onDecline();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-blue-950 text-white shadow-lg border-t border-blue-800">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex-1 pr-4 mb-4 md:mb-0">
            <h3 className="text-lg font-semibold mb-2">Privacy & Cookies Notice</h3>
            <p className="text-sm text-blue-100 mb-2">
              Aero Solutions uses cookies and similar technologies to enhance your experience, analyze traffic, and personalize content.
              By continuing to use our website, you consent to our use of cookies in accordance with our Privacy Policy.
            </p>
            <p className="text-xs text-blue-200">
              We process personal data for necessary site operations and to offer you a better experience.
              Your data is secured with industry-standard encryption and never shared with third parties without explicit consent.
              You have the right to access, correct, or delete your personal data at any time by contacting us.
            </p>
          </div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            <Button 
              variant="outline" 
              className="bg-transparent border-white text-white hover:bg-white hover:text-blue-900 transition-colors"
              onClick={handleDecline}
            >
              Decline
            </Button>
            <Button 
              className="bg-white text-blue-900 hover:bg-blue-100 transition-colors"
              onClick={handleAccept}
            >
              Accept All Cookies
            </Button>
          </div>
          <button 
            onClick={() => setIsVisible(false)} 
            className="absolute top-3 right-3 text-white hover:text-blue-200 transition-colors"
            aria-label="Close privacy notice"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
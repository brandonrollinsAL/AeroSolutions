import { useState, useEffect } from "react";
import { FaTimes, FaLock } from "react-icons/fa";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface ClientPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientPreviewModal({ isOpen, onClose }: ClientPreviewModalProps) {
  const [accessCode, setAccessCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  // Use effect to dispatch custom event when code is validated
  useEffect(() => {
    if (isValidated && accessCode) {
      // Create and dispatch custom event with accessCode
      const event = new CustomEvent('client-access-granted', { 
        detail: { accessCode }
      });
      window.dispatchEvent(event);
      
      // Close the modal after dispatching the event
      onClose();
    }
  }, [isValidated, accessCode, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an access code",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // For demo purposes, directly validate specific access codes
      if (accessCode.toLowerCase() === "momanddad" || accessCode.toLowerCase() === "countofmontecristobitch") {
        toast({
          title: "Success",
          description: "Access code validated. Redirecting to platform preview...",
        });
        
        setIsValidated(true);
      } else {
        // Make API request for other codes
        try {
          await apiRequest("POST", "/api/preview/validate", { code: accessCode });
          toast({
            title: "Success",
            description: "Access code validated. Redirecting to platform preview...",
          });
          setIsValidated(true);
        } catch (error) {
          throw new Error("Invalid code");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid access code. Please check and try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePreview = () => {
    setIsValidated(false);
    setAccessCode("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && !isValidated && (
        <motion.div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="text-xl" />
            </button>
            
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-luxury/10 flex items-center justify-center text-luxury">
                <FaLock className="text-2xl" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold font-montserrat text-primary mb-4 text-center">Client Preview Access</h3>
            <p className="text-gray-600 mb-6 text-center">Enter your unique access code to view your project preview.</p>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="access-code" className="block text-sm font-medium text-gray-700 mb-2">Access Code</label>
                <input 
                  type="text" 
                  id="access-code" 
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                  placeholder="Enter your code"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-2">
                  <span className="font-semibold">Hint:</span> Try entering a special code you've been provided
                </p>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-luxury hover:bg-luxury/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-70"
              >
                {isSubmitting ? "Validating..." : "Access Preview"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

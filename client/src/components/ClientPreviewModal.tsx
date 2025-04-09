import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ClientPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientPreviewModal({ isOpen, onClose }: ClientPreviewModalProps) {
  const [accessCode, setAccessCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await apiRequest("POST", "/api/preview/validate", { code: accessCode });
      
      toast({
        title: "Success",
        description: "Access code validated successfully. Redirecting to preview...",
      });
      
      // In a real app, this would redirect to the preview page or load it in an iframe
      setTimeout(() => {
        onClose();
        setAccessCode("");
      }, 1500);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <FaTimes className="text-xl" />
        </button>
        
        <h3 className="text-2xl font-bold font-montserrat text-primary mb-4">Client Preview Access</h3>
        <p className="text-gray-600 mb-6">Enter your unique access code to view your project preview.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="access-code" className="block text-sm font-medium text-gray-700 mb-2">Access Code</label>
            <input 
              type="text" 
              id="access-code" 
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
              placeholder="Enter your code"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-70"
          >
            {isSubmitting ? "Validating..." : "Access Preview"}
          </button>
        </form>
      </div>
    </div>
  );
}

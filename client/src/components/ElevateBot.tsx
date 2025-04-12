import { useState, useEffect } from "react";
import { FaRocket, FaTimes, FaSmile, FaCode, FaDesktop, FaPalette, FaMobileAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface ElevateBotProps {
  isOpen?: boolean;
  initialOption?: string | null;
}

export default function ElevateBot({ isOpen: externalIsOpen, initialOption }: ElevateBotProps = {}) {
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);
  const [activeOption, setActiveOption] = useState<string | null>(initialOption || null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);

  // Handle external props changes
  useEffect(() => {
    console.log("ElevateBot props changed:", { externalIsOpen, initialOption });
    
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
      
      if (externalIsOpen) {
        // When opening from external source
        console.log("Opening chatbot from external source");
        setIsTyping(true);
        setTypingComplete(false);
        
        // If initialOption is provided, skip showing options and go straight to response
        if (initialOption) {
          console.log("Setting active option:", initialOption);
          setActiveOption(initialOption);
        }
        
        // Simulate typing and then show content
        setTimeout(() => {
          setIsTyping(false);
          setTypingComplete(true);
        }, 1500);
      }
    }
  }, [externalIsOpen, initialOption]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reset states when opening
      setActiveOption(null);
      setIsTyping(true);
      setTypingComplete(false);
      
      // Simulate typing
      setTimeout(() => {
        setIsTyping(false);
        setTypingComplete(true);
      }, 2500);
    }
  };

  const handleOptionClick = (option: string) => {
    setActiveOption(option);
  };

  const getResponseText = () => {
    switch (activeOption) {
      case "website-design":
        return "Great choice! Our web design services combine beautiful aesthetics with user-friendly functionality. We'll create a custom design that perfectly represents your brand and engages your visitors. Would you like to see some samples of our recent work?";
      case "web-development":
        return "Excellent! Our development team specializes in creating robust, scalable websites using the latest technologies. From simple landing pages to complex web applications, we can build exactly what your business needs.";
      case "mobile-optimization":
        return "Smart decision! With over 60% of web traffic coming from mobile devices, having a responsive website is essential. We'll ensure your site looks and functions perfectly on all devices - smartphones, tablets, and desktops.";
      case "branding-design":
        return "Perfect! A cohesive brand identity is crucial for business success. Our design team will create a comprehensive visual system including logo, color palette, typography, and design elements that make your business memorable.";
      default:
        return "";
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChatbot}
        className="fixed bottom-6 right-6 bg-[#3B5B9D] hover:bg-[#2A4A8C] text-white p-4 rounded-full shadow-lg z-30 flex items-center justify-center"
        aria-label="Chat with ElevateBot"
      >
        {isOpen ? (
          <FaTimes className="text-xl" />
        ) : (
          <div className="relative">
            <FaRocket className="text-xl text-[#00D1D1]" />
            <span className="absolute -top-2 -right-2 bg-[#FF7043] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              1
            </span>
          </div>
        )}
      </button>

      {/* Chatbot Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-20 right-6 w-80 sm:w-96 bg-white rounded-xl shadow-xl overflow-hidden z-30 flex flex-col"
            style={{ maxHeight: "500px" }}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="bg-[#3B5B9D] text-white p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#EDEFF2] text-[#3B5B9D] flex items-center justify-center mr-3">
                  <FaRocket className="text-[#00D1D1]" />
                </div>
                <div>
                  <h3 className="font-bold font-poppins">ElevateBot</h3>
                  <span className="text-xs text-[#00D1D1] font-inter">Online</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white">
                <FaTimes />
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-grow overflow-y-auto p-4 bg-[#EDEFF2]">
              {/* Intro Message */}
              <div className="flex mb-4">
                <div className="w-8 h-8 rounded-full bg-[#3B5B9D] text-white flex items-center justify-center mr-2 flex-shrink-0">
                  <FaRocket className="text-[#00D1D1]" />
                </div>
                <div className="bg-white p-3 rounded-lg rounded-tl-none max-w-[80%] shadow-sm">
                  {isTyping ? (
                    <div className="flex space-x-2 items-center py-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  ) : typingComplete ? (
                    <p className="text-gray-800 font-lato">
                      Hello! I'm ElevateBot, your web development assistant. How can I help your business succeed online today?
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Options */}
              {typingComplete && !activeOption && (
                <div className="flex flex-col space-y-2 pl-10">
                  <button
                    onClick={() => handleOptionClick("website-design")}
                    className="bg-white p-3 rounded-lg text-left hover:bg-gray-50 border border-gray-200 transition-colors flex items-center"
                  >
                    <FaPalette className="text-[#FF7043] mr-2" />
                    <span className="font-inter">Website Design</span>
                  </button>
                  <button
                    onClick={() => handleOptionClick("web-development")}
                    className="bg-white p-3 rounded-lg text-left hover:bg-gray-50 border border-gray-200 transition-colors flex items-center"
                  >
                    <FaCode className="text-[#3B5B9D] mr-2" />
                    <span className="font-inter">Web Development</span>
                  </button>
                  <button
                    onClick={() => handleOptionClick("mobile-optimization")}
                    className="bg-white p-3 rounded-lg text-left hover:bg-gray-50 border border-gray-200 transition-colors flex items-center"
                  >
                    <FaMobileAlt className="text-[#00D1D1] mr-2" />
                    <span className="font-inter">Mobile Optimization</span>
                  </button>
                  <button
                    onClick={() => handleOptionClick("branding-design")}
                    className="bg-white p-3 rounded-lg text-left hover:bg-gray-50 border border-gray-200 transition-colors flex items-center"
                  >
                    <FaDesktop className="text-[#3B5B9D] mr-2" />
                    <span className="font-inter">Branding & Identity</span>
                  </button>
                </div>
              )}

              {/* User Selection */}
              {activeOption && (
                <div className="flex justify-end mb-4">
                  <div className="bg-[#3B5B9D] text-white p-3 rounded-lg rounded-tr-none max-w-[80%]">
                    <p className="font-inter">
                      {activeOption === "website-design" && "I'd like to learn more about website design"}
                      {activeOption === "web-development" && "Tell me about your web development services"}
                      {activeOption === "mobile-optimization" && "How can you help with mobile optimization?"}
                      {activeOption === "branding-design" && "I need help with branding and identity"}
                    </p>
                  </div>
                </div>
              )}

              {/* Response */}
              {activeOption && (
                <div className="flex mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#3B5B9D] text-white flex items-center justify-center mr-2 flex-shrink-0">
                    <FaRocket className="text-[#00D1D1]" />
                  </div>
                  <div className="bg-white p-3 rounded-lg rounded-tl-none max-w-[80%] shadow-sm">
                    <p className="text-gray-800 font-lato">{getResponseText()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder={activeOption ? "Type your response..." : "Select an option above..."}
                  disabled
                  className="flex-grow border border-gray-300 rounded-full py-2 px-4 mr-2 focus:outline-none focus:border-[#3B5B9D] font-inter"
                />
                <button className="bg-[#00D1D1] text-white rounded-full p-2 hover:bg-[#00AEAE] disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  <FaSmile />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
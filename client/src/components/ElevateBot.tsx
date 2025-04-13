import { useState, useEffect, useRef } from "react";
import { 
  FaRocket, FaTimes, FaPaperPlane, FaCode, FaDesktop, 
  FaPalette, FaMobileAlt, FaUser, FaLaptopCode, FaHeadset 
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface ElevateBotProps {
  isOpen?: boolean;
  initialOption?: string | null;
  hideFloatingButton?: boolean;
  className?: string;
}

interface ChatMessage {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  isProcessing?: boolean;
}

export default function ElevateBot({ 
  isOpen: externalIsOpen, 
  initialOption, 
  hideFloatingButton = false,
  className = ""
}: ElevateBotProps = {}) {
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);
  const [activeOption, setActiveOption] = useState<string | null>(initialOption || null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Handle external props changes
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
      
      if (externalIsOpen) {
        // When opening from external source
        setIsTyping(true);
        setTypingComplete(false);
        
        // If initialOption is provided, skip showing options and go straight to response
        if (initialOption) {
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
  
  // Listen for custom event to open tech assistant
  useEffect(() => {
    const handleOpenTechAssistant = () => {
      console.log("Custom event received: openTechAssistant");
      setIsOpen(true);
      setIsTyping(true);
      setTypingComplete(false);
      setActiveOption(null);
      
      // Simulate typing and then show content
      setTimeout(() => {
        setIsTyping(false);
        setTypingComplete(true);
      }, 1500);
    };
    
    window.addEventListener('openTechAssistant', handleOpenTechAssistant);
    
    return () => {
      window.removeEventListener('openTechAssistant', handleOpenTechAssistant);
    };
  }, []);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reset states when opening
      if (messages.length === 0) {
        setActiveOption(null);
        setIsTyping(true);
        setTypingComplete(false);
        
        // Simulate typing
        setTimeout(() => {
          setIsTyping(false);
          setTypingComplete(true);
        }, 1500);
      }
    }
  };

  const handleOptionClick = async (option: string) => {
    setActiveOption(option);
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      text: getOptionText(option),
      sender: 'user' as const
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Prepare bot response
    const botMessage: ChatMessage = {
      id: Date.now() + 1,
      text: '',
      sender: 'bot',
      isProcessing: true
    };
    
    setMessages(prev => [...prev, botMessage]);
    
    try {
      // Send request to dedicated ElevateBot endpoint powered by xAI
      const response = await apiRequest("POST", "/api/elevate-bot", { 
        message: `User selected option: ${option}. ${getOptionText(option)}` 
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response from ElevateBot");
      }
      
      const data = await response.json();
      
      // Update the message with AI response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessage.id 
            ? { ...msg, text: data.response, isProcessing: false } 
            : msg
        )
      );
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Update with error message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessage.id 
            ? { 
                ...msg, 
                text: "Sorry, I'm having trouble connecting right now. Please try again later or contact our team directly.", 
                isProcessing: false 
              } 
            : msg
        )
      );
      
      toast({
        title: "Error",
        description: "Failed to get response from ElevateBot",
        variant: "destructive"
      });
    }
  };

  const getOptionText = (option: string): string => {
    switch (option) {
      case "website-design":
        return "I'd like to learn more about website design";
      case "web-development":
        return "Tell me about your web development services";
      case "mobile-optimization":
        return "How can you help with mobile optimization?";
      case "branding-design":
        return "I need help with branding and identity";
      default:
        return "Tell me more about Elevion's services";
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const userInput = message.trim();
    setMessage("");
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      text: userInput,
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Add bot processing message
    const botMessage: ChatMessage = {
      id: Date.now() + 1,
      text: '',
      sender: 'bot',
      isProcessing: true
    };
    
    setMessages(prev => [...prev, botMessage]);
    
    try {
      // Send request to dedicated ElevateBot endpoint powered by xAI
      const response = await apiRequest("POST", "/api/elevate-bot", { message: userInput });
      
      if (!response.ok) {
        throw new Error("Failed to get response from ElevateBot");
      }
      
      const data = await response.json();
      
      // Update the message with AI response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessage.id 
            ? { ...msg, text: data.response, isProcessing: false } 
            : msg
        )
      );
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Update with error message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessage.id 
            ? { 
                ...msg, 
                text: "Sorry, I'm having trouble connecting right now. Please try again later or contact our team directly.", 
                isProcessing: false 
              } 
            : msg
        )
      );
      
      toast({
        title: "Error",
        description: "Failed to get response from ElevateBot",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={className}>
      {/* Floating Chat Button - Only show if not hidden */}
      {!hideFloatingButton && (
        <button
          onClick={toggleChatbot}
          className="fixed bottom-6 right-6 bg-[#3B5B9D] hover:bg-[#2A4A8C] text-white p-4 rounded-full shadow-lg z-30 flex items-center justify-center"
          aria-label="Chat with ElevateBot"
        >
          {isOpen ? (
            <FaTimes className="text-xl" />
          ) : (
            <div className="relative">
              <FaLaptopCode className="text-xl text-[#00D1D1]" />
              <span className="absolute -top-2 -right-2 bg-[#FF7043] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                1
              </span>
            </div>
          )}
        </button>
      )}

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
                  <FaLaptopCode className="text-[#00D1D1]" />
                </div>
                <div>
                  <h3 className="font-bold font-poppins">Tech Assistant</h3>
                  <span className="text-xs text-[#00D1D1] font-inter">Powered by xAI Grok</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white">
                <FaTimes />
              </button>
            </div>

            {/* Chat Content */}
            <div 
              className="flex-grow overflow-y-auto p-4 bg-[#EDEFF2]"
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(59, 91, 157, 0.03) 0%, rgba(0, 209, 209, 0.03) 100%),
                                  url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20h15v15H20zm60 0h15v15H80zM20 80h15v15H20zm60 0h15v15H80zm-30-30h15v15H50z' fill='%2300D1D1' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E"),
                                  url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h10v10H0zm30 0h10v10H30zM0 30h10v10H0zm30 30h10v10H30zm30-30h10v10H30z' fill='%233B5B9D' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: "120px 120px, 60px 60px, 60px 60px",
                backgroundPosition: "center, center, center"
              }}
            >
              {/* Welcome Message - Only shown if no messages yet */}
              {messages.length === 0 && (
                <div className="flex mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#3B5B9D] text-white flex items-center justify-center mr-2 flex-shrink-0">
                    <FaLaptopCode className="text-[#00D1D1]" />
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
                        Hi there! I'm your Elevion Tech Assistant, powered by xAI Grok. How can I help you with your web development needs today?
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Options - only shown initially if no messages */}
              {messages.length === 0 && typingComplete && !activeOption && (
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

              {/* Chat Messages */}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-[#3B5B9D] text-white flex items-center justify-center mr-2 flex-shrink-0">
                      <FaLaptopCode className="text-[#00D1D1]" />
                    </div>
                  )}
                  
                  <div 
                    className={`${
                      msg.sender === 'bot' 
                        ? 'bg-white rounded-lg rounded-tl-none shadow-sm' 
                        : 'bg-[#00D1D1] text-white rounded-lg rounded-tr-none'
                    } p-3 max-w-[80%]`}
                  >
                    {msg.isProcessing ? (
                      <div className="flex space-x-2 items-center py-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    ) : (
                      <p className={`${msg.sender === 'bot' ? 'text-gray-800 font-lato' : 'text-white font-inter'}`}>
                        {msg.text}
                      </p>
                    )}
                  </div>
                  
                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[#3B5B9D] text-white flex items-center justify-center ml-2 flex-shrink-0">
                      <FaUser />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Reference element for auto-scrolling */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <form onSubmit={handleSubmit} className="flex items-center">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-grow border border-gray-300 rounded-full py-2 px-4 mr-2 focus:outline-none focus:border-[#3B5B9D] font-inter"
                />
                <button 
                  type="submit"
                  className="bg-[#00D1D1] text-white rounded-full p-2 hover:bg-[#00AEAE] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!message.trim()}
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
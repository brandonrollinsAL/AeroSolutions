import { useState, useEffect, useRef } from "react";
import { FaCommentDots, FaTimes, FaPaperPlane, FaRobot, FaUser } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
}

export default function Copilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "👋 Hello! I'm your Aero Solutions Copilot, powered by AI. I can answer questions about our services, provide insights about aviation software development, or discuss how we can help with your specific project needs. Try me out to see what Aero Solutions can build for you!",
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userInput = input.trim();
    const newUserMessage: Message = {
      id: Date.now(),
      text: userInput,
      sender: 'user'
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/copilot", { message: userInput });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to get a response from the AI");
      }
      
      const data = await response.json();
      
      if (!data.success || !data.response) {
        throw new Error("Invalid response format from server");
      }
      
      setTimeout(() => {
        const newBotMessage: Message = {
          id: Date.now(),
          text: data.response,
          sender: 'bot'
        };
        
        setMessages(prev => [...prev, newBotMessage]);
        setIsLoading(false);
      }, 500); // Small delay for natural conversation feel
    } catch (error) {
      console.error("Copilot API error:", error);
      
      // Add fallback error message to the chat
      const errorMessage: Message = {
        id: Date.now(),
        text: "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.",
        sender: 'bot'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get a response. Please try again.",
        variant: "destructive"
      });
      
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={toggleChat} 
            className="bg-luxury hover:bg-luxury/90 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <FaCommentDots className="text-2xl" />
          </motion.button>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-xl shadow-2xl absolute bottom-0 right-0 w-96 max-w-full overflow-hidden border border-gray-200"
          >
            <div className="bg-primary text-white p-4 flex justify-between items-center">
              <div className="flex items-center">
                <FaRobot className="mr-3 text-xl" />
                <h3 className="font-bold font-montserrat">Aero Solutions Copilot</h3>
              </div>
              <button 
                onClick={toggleChat} 
                className="text-white/80 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="h-80 overflow-y-auto p-4 space-y-4" id="chat-messages">
              {messages.map((message) => (
                <div key={message.id} className={`flex items-start ${message.sender === 'user' ? 'justify-end' : ''}`}>
                  {message.sender === 'bot' && (
                    <div className="bg-primary text-white p-3 rounded-lg mr-2 flex-shrink-0">
                      <FaRobot />
                    </div>
                  )}
                  
                  <div className={`${message.sender === 'bot' ? 'bg-gray-100' : 'bg-luxury text-white'} rounded-lg p-3 max-w-[75%]`}>
                    <p>{message.text}</p>
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="bg-black text-white p-3 rounded-lg ml-2 flex-shrink-0">
                      <FaUser />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start">
                  <div className="bg-primary text-white p-3 rounded-lg mr-2 flex-shrink-0">
                    <FaRobot />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="flex space-x-1">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                    </p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            <div className="border-t border-gray-200 p-4">
              <div className="mb-2 text-xs text-gray-500 text-center">
                <p>Try asking: "What services do you offer?" or "Can you build a flight planning app?"</p>
              </div>
              <form onSubmit={handleSubmit} className="flex items-center">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                  placeholder="Type your message..."
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  className="ml-2 bg-luxury text-white p-2 rounded-lg disabled:opacity-70"
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

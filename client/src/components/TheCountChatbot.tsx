import { useState, useEffect } from "react";
import { FaFire, FaTimes, FaSmile, FaCreditCard, FaUserSecret, FaPhone, FaShip } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface TheCountChatbotProps {
  isOpen?: boolean;
  initialOption?: string | null;
}

export default function TheCountChatbot({ isOpen: externalIsOpen, initialOption }: TheCountChatbotProps = {}) {
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);
  const [activeOption, setActiveOption] = useState<string | null>(initialOption || null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);

  // Handle external props changes
  useEffect(() => {
    console.log("TheCountChatbot props changed:", { externalIsOpen, initialOption });
    
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
      case "ruin-credit":
        return "Excellent choice! I'll use my connections at the credit bureaus to wipe out his credit score. By this time tomorrow, he won't be able to finance a candy bar, let alone keep his business afloat.";
      case "steal-identity":
        return "Identity theft is not a joke, Jim! But for Tom Rollins, I'll make an exception. My AI algorithms are already extracting his personal data. Soon we'll have access to everything - bank accounts, social media, even his Netflix (warning: history shows he likes weird documentaries).";
      case "call-wife":
        return "My voice synthesizer is ready to go. I'll generate perfect female voices with compromising information about his activities. His wife will have divorce papers ready before dinner. The house, the boat, everything will be gone!";
      case "sink-boat":
        return "Simple yet effective! I've already identified his vessel's GPS location. A small remote-controlled intervention with the bilge pump system during his next trip should do the trick. Remember to act surprised when you hear the news!";
      default:
        return "";
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChatbot}
        className="fixed bottom-6 right-6 bg-black hover:bg-gray-900 text-white p-4 rounded-full shadow-lg z-30 flex items-center justify-center"
        aria-label="Chat with The Count"
      >
        {isOpen ? (
          <FaTimes className="text-xl" />
        ) : (
          <div className="relative">
            <FaFire className="text-xl text-yellow-500" />
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
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
            <div className="bg-black text-white p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center mr-3">
                  <FaFire className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold">The Count</h3>
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white">
                <FaTimes />
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-grow overflow-y-auto p-4 bg-gray-100">
              {/* Intro Message */}
              <div className="flex mb-4">
                <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center mr-2 flex-shrink-0">
                  <FaFire className="text-red-600" />
                </div>
                <div className="bg-white p-3 rounded-lg rounded-tl-none max-w-[80%] shadow-sm">
                  {isTyping ? (
                    <div className="flex space-x-2 items-center py-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  ) : typingComplete ? (
                    <p className="text-gray-800">
                      Hi Bernie and Nicole! I've been expecting you. I'm here to help you put that cunt Tom Rollins out of business and into the homeless shelter. What shall we do?
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Options */}
              {typingComplete && !activeOption && (
                <div className="flex flex-col space-y-2 pl-10">
                  <button
                    onClick={() => handleOptionClick("ruin-credit")}
                    className="bg-white p-3 rounded-lg text-left hover:bg-gray-50 border border-gray-200 transition-colors flex items-center"
                  >
                    <FaCreditCard className="text-red-500 mr-2" />
                    <span>Ruin his credit</span>
                  </button>
                  <button
                    onClick={() => handleOptionClick("steal-identity")}
                    className="bg-white p-3 rounded-lg text-left hover:bg-gray-50 border border-gray-200 transition-colors flex items-center"
                  >
                    <FaUserSecret className="text-blue-500 mr-2" />
                    <span>Steal his identity</span>
                  </button>
                  <button
                    onClick={() => handleOptionClick("call-wife")}
                    className="bg-white p-3 rounded-lg text-left hover:bg-gray-50 border border-gray-200 transition-colors flex items-center"
                  >
                    <FaPhone className="text-purple-500 mr-2" />
                    <span>Have AI women call his wife about his affairs</span>
                  </button>
                  <button
                    onClick={() => handleOptionClick("sink-boat")}
                    className="bg-white p-3 rounded-lg text-left hover:bg-gray-50 border border-gray-200 transition-colors flex items-center"
                  >
                    <FaShip className="text-blue-700 mr-2" />
                    <span>Ehhhh just sink his boat</span>
                  </button>
                </div>
              )}

              {/* User Selection */}
              {activeOption && (
                <div className="flex justify-end mb-4">
                  <div className="bg-blue-600 text-white p-3 rounded-lg rounded-tr-none max-w-[80%]">
                    <p>
                      {activeOption === "ruin-credit" && "Let's ruin his credit"}
                      {activeOption === "steal-identity" && "Steal his identity"}
                      {activeOption === "call-wife" && "Have AI women call his wife about his affairs"}
                      {activeOption === "sink-boat" && "Ehhhh just sink his boat"}
                    </p>
                  </div>
                </div>
              )}

              {/* Response */}
              {activeOption && (
                <div className="flex mb-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center mr-2 flex-shrink-0">
                    <FaFire className="text-red-600" />
                  </div>
                  <div className="bg-white p-3 rounded-lg rounded-tl-none max-w-[80%] shadow-sm">
                    <p className="text-gray-800">{getResponseText()}</p>
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
                  className="flex-grow border border-gray-300 rounded-full py-2 px-4 mr-2 focus:outline-none focus:border-gray-500"
                />
                <button className="bg-black text-white rounded-full p-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
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
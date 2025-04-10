import { useState } from "react";
import { FaTimes, FaCode, FaExternalLinkAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface PlatformPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  platform: {
    name: string;
    description: string;
    features: string[];
    techStack: string[];
    screenshots: { image: string; caption: string }[];
    useCases: string[] | { title: string; description: string }[];
    apiEndpoints?: { method: string; endpoint: string; description: string }[];
  };
}

export default function PlatformPreview({ isOpen, onClose, platform }: PlatformPreviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'tech' | 'api' | 'demo'>('overview');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  if (!isOpen) return null;
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === platform.screenshots.length - 1 ? 0 : prev + 1
    );
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? platform.screenshots.length - 1 : prev - 1
    );
  };
  
  return (
    <motion.div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto" 
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" 
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="bg-primary text-white p-5 flex justify-between items-center">
          <h2 className="text-2xl font-bold font-montserrat">{platform.name} Platform</h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="bg-gray-100 p-2 flex overflow-x-auto">
          <button 
            className={`px-4 py-2 rounded-lg font-medium mr-2 whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`px-4 py-2 rounded-lg font-medium mr-2 whitespace-nowrap ${activeTab === 'features' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}
            onClick={() => setActiveTab('features')}
          >
            Features
          </button>
          <button 
            className={`px-4 py-2 rounded-lg font-medium mr-2 whitespace-nowrap ${activeTab === 'tech' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}
            onClick={() => setActiveTab('tech')}
          >
            Tech Stack
          </button>
          {platform.apiEndpoints && (
            <button 
              className={`px-4 py-2 rounded-lg font-medium mr-2 whitespace-nowrap ${activeTab === 'api' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}
              onClick={() => setActiveTab('api')}
            >
              API Documentation
            </button>
          )}
          <button 
            className={`px-4 py-2 rounded-lg font-medium mr-2 whitespace-nowrap ${activeTab === 'demo' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}
            onClick={() => setActiveTab('demo')}
          >
            Live Demo
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-primary mb-4">Platform Overview</h3>
                <p className="text-gray-700 mb-6">{platform.description}</p>
                
                <div className="relative rounded-xl overflow-hidden h-80 mb-8 bg-gray-100">
                  {platform.screenshots.length > 0 ? (
                    <>
                      <img 
                        src={platform.screenshots[currentImageIndex].image} 
                        alt={platform.screenshots[currentImageIndex].caption} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/aviation-tech.jpeg"; // Fallback image
                        }}
                      />
                      
                      {platform.screenshots.length > 1 && (
                        <>
                          <button 
                            onClick={prevImage} 
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                          >
                            <FaChevronLeft />
                          </button>
                          <button 
                            onClick={nextImage} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                          >
                            <FaChevronRight />
                          </button>
                        </>
                      )}
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3 text-center">
                        {platform.screenshots[currentImageIndex].caption}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No screenshots available</p>
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-primary mb-4">Use Cases</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {Array.isArray(platform.useCases) && platform.useCases.length > 0 && 
                    platform.useCases.map((useCase, index) => (
                      <li key={index}>
                        {typeof useCase === 'string' 
                          ? useCase 
                          : `${useCase.title}: ${useCase.description}`
                        }
                      </li>
                    ))
                  }
                </ul>
              </motion.div>
            )}
            
            {activeTab === 'features' && (
              <motion.div
                key="features"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-primary mb-4">Key Features</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {platform.features.map((feature, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-700">{feature}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {activeTab === 'tech' && (
              <motion.div
                key="tech"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-primary mb-4">Technology Stack</h3>
                <div className="bg-black rounded-lg p-6 font-mono text-sm">
                  <div className="flex items-center mb-4">
                    <div className="flex space-x-2 mr-4">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-gray-400">Technology Stack</p>
                  </div>
                  
                  <div className="text-white">
                    {platform.techStack.map((tech, index) => (
                      <div key={index} className="mb-2">
                        <span className="text-green-400">{'>'}</span> <span className="text-blue-400">{tech}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'api' && platform.apiEndpoints && (
              <motion.div
                key="api"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-primary mb-4">API Documentation</h3>
                <div className="space-y-6">
                  {platform.apiEndpoints.map((endpoint, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className={`px-4 py-3 flex items-center ${
                        endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' : 
                        endpoint.method === 'POST' ? 'bg-green-100 text-green-700' : 
                        endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' : 
                        endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                      }`}>
                        <span className="font-mono font-bold mr-3">{endpoint.method}</span>
                        <span className="font-mono">{endpoint.endpoint}</span>
                      </div>
                      <div className="p-4 bg-white">
                        <p className="text-gray-700">{endpoint.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {activeTab === 'demo' && (
              <motion.div
                key="demo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-primary">Live Demo</h3>
                  <div className="flex space-x-2">
                    <button className="bg-primary text-white px-3 py-1 rounded-lg text-sm flex items-center">
                      <FaExternalLinkAlt className="mr-2" />
                      Open in New Tab
                    </button>
                    <button className="bg-black text-white px-3 py-1 rounded-lg text-sm flex items-center">
                      <FaCode className="mr-2" />
                      View API
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 text-center">
                  <p className="text-gray-500 py-32">Interactive demo would be embedded here.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-500">Previewing confidential platform. Do not share this content.</p>
          <button 
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
          >
            Close Preview
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
import { useState } from "react";
import { FaTimes, FaPlaneDeparture, FaServer, FaUserTie, FaPlane } from "react-icons/fa";
import { motion } from "framer-motion";
import PlatformPreview from "./PlatformPreview";
import wolfOfWallStreetImage from "../assets/wolf-of-wall-street.jpg";

interface ClientPlatformsViewProps {
  isOpen: boolean;
  onClose: () => void;
  accessCode: string;
}

interface ClientPlatform {
  id: string;
  name: string;
  shortDescription: string;
  icon: JSX.Element;
  description: string;
  features: string[];
  techStack: string[];
  technicalSpecs?: string[];
  integrations?: string[];
  useCases: string[] | { title: string; description: string }[];
  screenshots: { image: string; caption: string }[];
  testimonial?: { quote: string; author: string; company: string };
  apiEndpoints?: { method: string; endpoint: string; description: string }[];
}

// Platform data
const platforms: ClientPlatform[] = [
  {
    id: "aerosync",
    name: "AeroSync",
    shortDescription: "Comprehensive aviation data synchronization platform",
    icon: <FaPlaneDeparture className="text-3xl" />,
    description: "AeroSync is an advanced aviation data synchronization platform designed to streamline operations across multiple systems. It integrates flight data, maintenance records, crew scheduling, and other critical information into a unified ecosystem, ensuring real-time updates and data consistency across all departments.",
    features: [
      "Real-time data synchronization across all connected systems",
      "Automated conflict resolution for simultaneous updates",
      "Role-based access control with detailed permission settings",
      "Comprehensive audit trail and change tracking",
      "Integration with major aviation software systems",
      "Custom workflow automation tools",
      "Advanced reporting and analytics dashboard",
      "Mobile access with offline capabilities"
    ],
    techStack: [
      "Frontend: React with TypeScript",
      "Backend: Node.js with NestJS",
      "Database: PostgreSQL with TimescaleDB extension",
      "Caching: Redis",
      "Messaging: Apache Kafka",
      "APIs: GraphQL and REST",
      "Authentication: OAuth 2.0 with JWT",
      "Containerization: Docker with Kubernetes"
    ],
    screenshots: [
      { 
        image: "https://images.unsplash.com/photo-1551373884-8a0750f6c71f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "AeroSync Dashboard showing real-time synchronization status" 
      },
      { 
        image: "https://images.unsplash.com/photo-1577400808258-62d255afacea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80", 
        caption: "Integration configuration panel with multiple aviation systems" 
      },
      { 
        image: "https://images.unsplash.com/photo-1605292356963-b8a9595a1c84?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "Conflict resolution interface with data comparison view" 
      }
    ],
    useCases: [
      "Airlines synchronizing flight data across scheduling, maintenance, and crew management systems",
      "MRO facilities integrating inventory management with maintenance tracking",
      "Aviation training centers synchronizing student records with simulator usage",
      "Aircraft leasing companies managing fleet data across multiple operators",
      "Airport operations coordinating ground services with flight information"
    ],
    apiEndpoints: [
      {
        method: "GET",
        endpoint: "/api/v1/sync/status",
        description: "Retrieve the current synchronization status for all systems"
      },
      {
        method: "POST",
        endpoint: "/api/v1/sync/manual",
        description: "Trigger a manual synchronization between specified systems"
      },
      {
        method: "GET",
        endpoint: "/api/v1/conflicts",
        description: "Retrieve a list of current data conflicts requiring resolution"
      },
      {
        method: "PUT",
        endpoint: "/api/v1/conflicts/:id/resolve",
        description: "Resolve a specific conflict with provided resolution data"
      }
    ]
  },
  {
    id: "aeroops",
    name: "AeroOps",
    shortDescription: "End-to-end aviation operations management platform",
    icon: <FaServer className="text-3xl" />,
    description: "AeroOps is a comprehensive platform designed to help airlines and aviation companies manage their operations efficiently. It offers powerful tools for flight scheduling, crew management, regulatory compliance, and operational analytics. The platform streamlines complex operational processes, making it a critical solution for aviation professionals seeking to optimize their operations and reduce costs.",
    features: [
      "Intelligent flight scheduling with conflict detection",
      "Crew management with qualification tracking and fatigue risk monitoring",
      "Regulatory compliance monitoring and automatic updates",
      "Maintenance tracking and integration with AeroSync",
      "Fuel optimization algorithms and consumption tracking",
      "Disruption management with automated recovery scenarios",
      "Performance analytics with customizable KPIs",
      "Real-time operational control dashboards"
    ],
    techStack: [
      "Frontend: Vue.js with Typescript",
      "Backend: Java with Spring Boot",
      "Database: Oracle with geographic extensions",
      "Caching: Hazelcast",
      "Machine Learning: TensorFlow for optimization algorithms",
      "APIs: REST with OpenAPI specification",
      "Authentication: SAML 2.0",
      "Containerization: Docker with ECS"
    ],
    screenshots: [
      { 
        image: "https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80", 
        caption: "AeroOps control center with real-time flight tracking" 
      },
      { 
        image: "https://images.unsplash.com/photo-1540339832862-474599807836?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "Crew scheduling interface with qualification overlays" 
      },
      { 
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80", 
        caption: "Flight optimization panel showing fuel efficiency metrics" 
      }
    ],
    useCases: [
      "Regional airlines optimizing crew utilization across multiple bases",
      "Charter operators managing on-demand flight scheduling",
      "Flight departments ensuring regulatory compliance across jurisdictions",
      "Low-cost carriers maximizing aircraft utilization with tight turnarounds",
      "Helicopter operators managing complex mission-based operations"
    ],
    apiEndpoints: [
      {
        method: "GET",
        endpoint: "/api/v1/flights",
        description: "Retrieve scheduled flights with filtering options"
      },
      {
        method: "POST",
        endpoint: "/api/v1/flights/optimize",
        description: "Run optimization algorithms on flight schedules with specified parameters"
      },
      {
        method: "GET",
        endpoint: "/api/v1/crew/availability",
        description: "Check crew availability with qualification filters"
      },
      {
        method: "POST",
        endpoint: "/api/v1/disruptions/recover",
        description: "Generate recovery plans for operational disruptions"
      }
    ]
  },
  {
    id: "execsync",
    name: "ExecSync",
    shortDescription: "Executive productivity and communication platform",
    icon: <FaUserTie className="text-3xl" />,
    description: "ExecSync is a powerful platform designed specifically for executives to manage their schedules, tasks, and communications efficiently. It integrates seamlessly with calendar systems, email clients, and collaboration tools to provide a unified productivity environment. The platform offers intelligent prioritization, automated follow-ups, and comprehensive analytics to help executives maximize their productivity and effectiveness.",
    features: [
      "AI-powered email prioritization and summarization",
      "Intelligent scheduling with conflict resolution",
      "Automated meeting preparation with briefing generation",
      "Task delegation with automated follow-up",
      "Voice-to-text transcription for meetings and notes",
      "Secure document sharing with granular access control",
      "Executive dashboard with key metrics and priorities",
      "Mobile-first design with offline capabilities"
    ],
    techStack: [
      "Frontend: React Native (mobile) and React (web)",
      "Backend: Python with Django",
      "Database: MongoDB with document versioning",
      "AI Services: Custom NLP models using PyTorch",
      "APIs: GraphQL",
      "Authentication: Multi-factor with biometric options",
      "Storage: AWS S3 with client-side encryption",
      "Search: Elasticsearch"
    ],
    screenshots: [
      { 
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "ExecSync dashboard showing prioritized tasks and communications" 
      },
      { 
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "Meeting scheduler with AI-suggested time slots" 
      },
      { 
        image: "https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "Secure document sharing interface with tracking capabilities" 
      }
    ],
    useCases: [
      "Aviation industry executives managing global teams and operations",
      "Corporate flight department directors coordinating executive travel",
      "Airline C-suite executives balancing operational and strategic priorities",
      "Airport authority leaders managing stakeholder communications",
      "Aviation consultancy principals managing multiple client engagements"
    ],
    apiEndpoints: [
      {
        method: "GET",
        endpoint: "/api/v1/priorities",
        description: "Retrieve prioritized list of tasks, emails, and meetings"
      },
      {
        method: "POST",
        endpoint: "/api/v1/meetings/schedule",
        description: "Schedule a meeting with automated time slot suggestions"
      },
      {
        method: "POST",
        endpoint: "/api/v1/emails/summarize",
        description: "Generate summaries of email threads or conversations"
      },
      {
        method: "GET",
        endpoint: "/api/v1/analytics/productivity",
        description: "Retrieve productivity analytics and insights"
      }
    ]
  },
  {
    id: "aeroflight",
    name: "AeroFlight",
    shortDescription: "Advanced flight simulation and training platform",
    icon: <FaPlane className="text-3xl" />,
    description: "AeroFlight is a sophisticated flight simulation platform designed for pilot training and proficiency. It provides high-fidelity aircraft models, realistic weather simulation, and comprehensive performance analysis tools. The platform supports both desktop and full-motion simulator configurations, making it versatile for various training needs from individual pilots to large flight schools and airlines.",
    features: [
      "High-fidelity aircraft models with accurate flight dynamics",
      "Real-time weather integration with global meteorological data",
      "Customizable training scenarios with instructor controls",
      "Performance tracking and detailed analytics",
      "Procedure and checklist validation",
      "ATC simulation with voice recognition",
      "VR support for immersive training experiences",
      "Learning management system integration for training programs"
    ],
    techStack: [
      "Simulation Engine: Custom C++ with CUDA acceleration",
      "Frontend: Unity for visualization",
      "Backend: C# with .NET Core",
      "Database: SQL Server for user data and PostgreSQL for telemetry",
      "Physics: Custom aerodynamics engine",
      "Voice Processing: CMU Sphinx with aviation lexicon",
      "APIs: REST with SignalR for real-time data",
      "Infrastructure: Azure with GPU compute instances"
    ],
    screenshots: [
      { 
        image: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "AeroFlight simulator cockpit view with weather system" 
      },
      { 
        image: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "Instructor station showing student performance metrics" 
      },
      { 
        image: "https://images.unsplash.com/photo-1495063438029-7f6764d3844a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80", 
        caption: "VR training scenario with emergency procedure practice" 
      }
    ],
    useCases: [
      "Flight schools providing standardized training across multiple aircraft types",
      "Airlines conducting recurrent training and emergency procedure practice",
      "Individual pilots maintaining proficiency and preparing for checkrides",
      "Aviation universities integrating simulation into their curriculum",
      "Corporate flight departments conducting scenario-based training"
    ],
    apiEndpoints: [
      {
        method: "GET",
        endpoint: "/api/v1/aircraft",
        description: "Retrieve available aircraft models with specifications"
      },
      {
        method: "POST",
        endpoint: "/api/v1/scenarios/create",
        description: "Create custom training scenarios with specific parameters"
      },
      {
        method: "GET",
        endpoint: "/api/v1/performance/:sessionId",
        description: "Retrieve detailed performance metrics from a training session"
      },
      {
        method: "POST",
        endpoint: "/api/v1/weather/load",
        description: "Load real or custom weather conditions into the simulation"
      }
    ]
  }
];

export default function ClientPlatformsView({ isOpen, onClose, accessCode }: ClientPlatformsViewProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<typeof platforms[0] | null>(null);
  const [showInvestorPopup, setShowInvestorPopup] = useState(false);
  
  if (!isOpen) return null;
  
  const isSpecialCode = accessCode.toLowerCase() === "countofmontecristobitch";
  
  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={`${isSpecialCode ? 'bg-gradient-to-r from-blue-900 to-blue-700' : 'bg-luxury'} text-white p-5 flex justify-between items-center`}>
            <div>
              <h2 className="text-2xl font-bold font-montserrat">
                {isSpecialCode ? 'Family Preview - Aero Solutions Platforms' : 'Client Platform Preview'}
              </h2>
              <p className="text-sm text-white/80">
                {isSpecialCode ? 'Special Access: Monte Cristo Family' : `Access Code: ${accessCode}`}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-grow overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {isSpecialCode ? (
                <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white rounded-lg overflow-hidden mb-8 shadow-xl">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Surprise! Welcome to Brandon's Aviation Software Platforms</h3>
                        <p className="text-sm text-white/80">Something special I've been working on...</p>
                      </div>
                    </div>
                    
                    <p className="mb-4 text-lg">
                      Hello Mom and Dad! I wanted to show you what I've been building - a suite of advanced aviation software platforms. Each one solves critical problems in the aviation industry and represents thousands of hours of development. I'm so excited to show you my work!
                    </p>
                    
                    <div className="bg-white/10 rounded-lg p-4 mb-4 border border-white/30">
                      <div className="flex items-center text-yellow-300 mb-2">
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">About These Platforms</span>
                      </div>
                      <p className="text-white/90 mb-3">
                        I've created these sophisticated software platforms specifically for the aviation industry. They handle everything from real-time data synchronization to flight management, executive services, and operations.
                      </p>
                      <ul className="space-y-1 ml-7 text-sm text-white/90 list-disc">
                        <li>All platforms are designed with modern technology stacks</li>
                        <li>They solve real problems for aviation businesses</li>
                        <li>Each has been carefully crafted with attention to detail</li>
                        <li>Together they form a comprehensive aviation technology ecosystem</li>
                      </ul>
                    </div>
                    
                    <p className="text-white/90 italic">
                      "After years of coding and development, I've built something I'm really proud of. Take your time exploring each platform - click on their cards below to see detailed information about what they do!"
                    </p>
                  </div>
                  
                  <div className="bg-black/30 p-4 flex flex-wrap md:flex-nowrap items-center justify-between">
                    <div className="flex items-center mb-3 md:mb-0">
                      <svg className="w-5 h-5 text-yellow-300 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span className="text-sm">Special Family Access Granted</span>
                    </div>
                    <div className="flex space-x-2">
                      <a href="#platforms" className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-full transition-colors">
                        Explore Platforms
                      </a>
                      <a href="#founder" className="text-xs bg-white/20 hover:bg-white/30 text-white py-1 px-3 rounded-full transition-colors">
                        About the Founder
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-luxury text-white rounded-lg overflow-hidden mb-8">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold">Welcome to Your Secure Platform Preview</h3>
                    </div>
                    
                    <p className="mb-4">
                      Hello, <span className="font-semibold">Special Client</span>! This private environment gives you exclusive access to explore our aviation software platforms. Each platform is fully interactive and showcases the powerful features we've built specifically for aviation industry needs.
                    </p>
                    
                    <div className="bg-white/10 rounded-lg p-4 mb-4">
                      <div className="flex items-center text-highlight mb-2">
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">Your Access Details</span>
                      </div>
                      <ul className="space-y-1 ml-7 text-sm text-white/90">
                        <li>• Access Code: <span className="font-mono bg-white/20 px-2 py-0.5 rounded">{accessCode}</span></li>
                        <li>• Session Started: <span className="font-mono">{new Date().toLocaleString()}</span></li>
                        <li>• Authorized Platforms: AeroSync, AeroFlight, ExecSync, AeroOps</li>
                      </ul>
                    </div>
                    
                    <p className="text-sm text-white/80">
                      This preview is confidential and provided exclusively for your evaluation. Please do not share access or content with unauthorized parties.
                    </p>
                  </div>
                  
                  <div className="bg-black/20 p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-highlight mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm">Secure session active</span>
                    </div>
                    <a href="#contact" onClick={onClose} className="text-sm text-highlight hover:underline">Request Pricing Info</a>
                  </div>
                </div>
              )}
              
              <h3 className="text-xl font-bold text-primary mb-6">Available Platforms</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {platforms.map((platform) => (
                  <motion.div
                    key={platform.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedPlatform(platform)}
                  >
                    <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        {platform.icon}
                      </div>
                      <h4 className="text-lg font-bold text-primary">{platform.name}</h4>
                    </div>
                    <div className="p-5">
                      <p className="text-gray-700 mb-4">{platform.shortDescription}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {platform.id === "aerosync" && (
                          <>
                            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">Real-time Sync</span>
                            <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Data Integration</span>
                          </>
                        )}
                        {platform.id === "aeroflight" && (
                          <>
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">Flight Planning</span>
                            <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">Performance Analytics</span>
                          </>
                        )}
                        {platform.id === "execsync" && (
                          <>
                            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">Executive Aviation</span>
                            <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">Premium Services</span>
                          </>
                        )}
                        {platform.id === "aeroops" && (
                          <>
                            <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full">Operations</span>
                            <span className="bg-cyan-100 text-cyan-700 text-xs font-semibold px-3 py-1 rounded-full">Compliance</span>
                          </>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <button 
                          className="text-sm text-luxury font-medium hover:underline flex items-center group-hover:text-primary transition-colors"
                          onClick={() => setSelectedPlatform(platform)}
                        >
                          View Platform Details
                          <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                        <div className="text-xs text-gray-500">Client ID: {accessCode.substring(0, 3)}*****</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Family Profiles for Special Code */}
          {isSpecialCode && (
            <div className="border-t border-gray-200 p-6 bg-gray-50" id="founder">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold text-primary mb-6">The Team Behind Aero Solutions</h3>
                
                {/* Founder Section */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                  <div className="md:flex">
                    <div className="md:flex-shrink-0 md:w-64 bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center p-6">
                      <div className="rounded-full bg-white/10 p-3">
                        <svg className="w-32 h-32 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 15.5C14.21 15.5 16 13.71 16 11.5V6H15V2H9V6H8V11.5C8 13.71 9.79 15.5 12 15.5ZM10 4H14V6H10V4Z" fill="currentColor" />
                          <path d="M18 14L13.89 15.56C13.34 15.78 12.68 15.78 12.13 15.56L8 14C6.77 14 5.63 14.52 4.85 15.38C4.04 16.27 3.61 17.45 3.61 18.69L3.62 20H20.38L20.39 18.69C20.39 17.45 19.96 16.27 19.15 15.38C18.37 14.52 17.23 14 16 14H18Z" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-8 md:p-6 md:flex-1">
                      <div className="uppercase tracking-wide text-sm text-blue-700 font-semibold">Founder & Lead Developer</div>
                      <h4 className="mt-1 text-xl font-semibold text-gray-900">Brandon Rollins</h4>
                      <p className="mt-2 text-gray-600">
                        As a self-taught software engineer and professional pilot, Brandon combines real-world aviation experience with technical expertise to create innovative solutions for the aviation industry. His unique perspective allows him to identify critical pain points and build software that addresses actual needs faced by aviation professionals daily.
                      </p>
                      <p className="mt-3 text-gray-600">
                        Brandon has dedicated thousands of hours to developing the Aero Solutions platform suite, creating a comprehensive ecosystem of aviation software solutions from the ground up using modern technologies and best practices in software development.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Family Investors */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Bernie Rollins */}
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-4">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Bernie Rollins</h4>
                          <p className="text-sm text-gray-500">Advisor & Investor (The Count)</p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">
                        A successful entrepreneur from Wilmington, NC, Bernie founded Gulfstream Steel and Supply, demonstrating remarkable business acumen and leadership. His experience and guidance have been invaluable in shaping the strategic direction of Aero Solutions.
                      </p>
                      <p className="text-sm text-gray-500 italic">
                        "I've watched Brandon develop these platforms with dedication and vision. The technical sophistication is impressive."
                      </p>
                    </div>
                  </div>
                  
                  {/* Nicole Rollins */}
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 mr-4">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Nicole Rollins</h4>
                          <p className="text-sm text-gray-500">Visionary Investor (The Duchess)</p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">
                        A mother of three, Nicole is the reason Brandon didn't get a "doo bah" degree, instead pursuing his passion for technology and aviation. Her unwavering support and encouragement have been essential to Brandon's journey in building Aero Solutions.
                      </p>
                      <p className="text-sm text-gray-500 italic">
                        "Seeing how Brandon has combined his love for aviation and technology into these sophisticated platforms makes me incredibly proud."
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* The Special NC DOT Button */}
                <div className="text-center mt-10 mb-6">
                  <button 
                    onClick={() => setShowInvestorPopup(true)} 
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    Click Here If You Hate The NC DOT
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-sm text-gray-500 mb-4 sm:mb-0">
                © {new Date().getFullYear()} Aero Solutions. All platform previews are provided under NDA.
              </p>
              <button 
                onClick={onClose}
                className="bg-black hover:bg-black/90 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
              >
                Close Preview
              </button>
            </div>
          </div>
          
          {/* NC DOT Investor Popup */}
          {showInvestorPopup && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowInvestorPopup(false)}>
              <div className="bg-white rounded-xl overflow-hidden max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-blue-900" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 85%)' }}></div>
                    
                    {/* Wolf of Wall Street Image */}
                    <div className="absolute bottom-0 w-full flex justify-center">
                      <img 
                        src={wolfOfWallStreetImage} 
                        alt="Business Success"
                        className="w-full h-full object-cover opacity-85"
                        style={{ objectPosition: 'center 35%' }}
                      />
                    </div>
                    
                    {/* Falling Money Animation - More money! */}
                    {Array.from({ length: 40 }).map((_, index) => (
                      <div 
                        key={index} 
                        className="absolute text-3xl animate-fall"
                        style={{
                          left: `${(index % 20) * 5}%`,
                          animationDuration: `${2 + (index % 5)}s`,
                          animationDelay: `${(index * 0.1) % 3}s`,
                          top: `-${index * 3}%`,
                          zIndex: 30
                        }}
                      >
                        {index % 2 === 0 ? '💵' : '💰'}
                      </div>
                    ))}
                  </div>
                  
                  <div className="relative p-10 pt-32 text-center">
                    <h3 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Congratulations!</h3>
                    <p className="text-2xl text-white mb-20 drop-shadow-lg">The Money Keeps Coming!</p>
                    
                    <div className="mt-56"></div> {/* Spacer to position content below the image */}
                    
                    <button 
                      onClick={() => setShowInvestorPopup(false)}
                      className="bg-white text-blue-800 font-bold py-2 px-8 rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {selectedPlatform && (
        <PlatformPreview 
          isOpen={!!selectedPlatform} 
          onClose={() => setSelectedPlatform(null)} 
          platform={selectedPlatform} 
        />
      )}
    </>
  );
}
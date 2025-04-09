import { useState } from "react";
import { FaTimes, FaPlaneDeparture, FaServer, FaUserTie, FaPlane } from "react-icons/fa";
import { motion } from "framer-motion";
import PlatformPreview from "./PlatformPreview";

interface ClientPlatformsViewProps {
  isOpen: boolean;
  onClose: () => void;
  accessCode: string;
}

// Platform data
const platforms = [
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
  
  if (!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-luxury text-white p-5 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold font-montserrat">Client Platform Preview</h2>
              <p className="text-sm text-white/80">Access Code: {accessCode}</p>
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
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-bold text-primary mb-2">Welcome to Your Platform Preview</h3>
                <p className="text-gray-700 mb-4">
                  This secure preview environment allows you to explore the capabilities of our aviation software platforms. 
                  Select any platform below to view detailed information, features, and interactive demonstrations.
                </p>
                <p className="text-sm text-gray-500">
                  This preview is confidential and provided exclusively for your evaluation. Please do not share access or content.
                </p>
              </div>
              
              <h3 className="text-xl font-bold text-primary mb-6">Available Platforms</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {platforms.map((platform) => (
                  <motion.div
                    key={platform.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedPlatform(platform)}
                  >
                    <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                        {platform.icon}
                      </div>
                      <h4 className="text-lg font-bold text-primary">{platform.name}</h4>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-700 mb-4">{platform.shortDescription}</p>
                      <button 
                        className="text-sm text-primary font-medium hover:underline"
                        onClick={() => setSelectedPlatform(platform)}
                      >
                        View Platform Details →
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-sm text-gray-500 mb-4 sm:mb-0">
                © 2023 Aero Solutions. All platform previews are provided under NDA.
              </p>
              <button 
                onClick={onClose}
                className="bg-black hover:bg-black/90 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
              >
                Close Preview
              </button>
            </div>
          </div>
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
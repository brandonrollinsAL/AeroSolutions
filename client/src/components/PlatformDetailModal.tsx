import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaPlane, FaDatabase, FaCode, FaUsers, FaChartLine, FaLock, FaMobileAlt, FaCheckCircle } from "react-icons/fa";
import { Platform } from "@/lib/types";

// Enhanced platform data with more detailed information
const enhancedPlatformDetails: Record<string, {
  longDescription: string;
  benefits: { icon: JSX.Element; title: string; description: string }[];
  features: string[];
  technicalSpecs: string[];
  integrations: string[];
  useCases: { title: string; description: string }[];
  screenshots: { image: string; caption: string }[];
  testimonial?: { quote: string; author: string; company: string };
}> = {
  "AeroSync": {
    longDescription: "AeroSync is a comprehensive aviation data synchronization platform designed to streamline operations across multiple systems. It integrates flight data, maintenance records, crew scheduling, and other critical information into a unified ecosystem, ensuring real-time updates and data consistency across all departments.",
    benefits: [
      {
        icon: <FaDatabase className="text-2xl text-primary" />,
        title: "Centralized Data Management",
        description: "Consolidate all your aviation data in one secure, accessible location with automated synchronization across systems."
      },
      {
        icon: <FaChartLine className="text-2xl text-primary" />,
        title: "Enhanced Operational Efficiency",
        description: "Reduce manual data entry by up to 85% and eliminate inconsistencies between departments."
      },
      {
        icon: <FaLock className="text-2xl text-primary" />,
        title: "Advanced Security",
        description: "Enterprise-grade encryption and role-based access control ensuring your data remains secure."
      },
      {
        icon: <FaMobileAlt className="text-2xl text-primary" />,
        title: "Mobile Accessibility",
        description: "Access critical information from anywhere with our responsive web and mobile applications."
      }
    ],
    features: [
      "Real-time data synchronization across all connected systems",
      "Automated conflict resolution for simultaneous updates",
      "Role-based access control with detailed permission settings",
      "Comprehensive audit trail and change tracking",
      "Integration with major aviation software systems",
      "Custom workflow automation tools",
      "Advanced reporting and analytics dashboard",
      "Mobile access with offline capabilities",
      "Automated data validation and error checking",
      "Scalable architecture supporting operations of any size"
    ],
    technicalSpecs: [
      "Cloud-native architecture with containerized microservices",
      "Real-time synchronization using WebSockets and message queues",
      "RESTful and GraphQL APIs for seamless integration",
      "High-availability configuration with automatic failover",
      "Enterprise-grade security with encryption at rest and in transit",
      "Horizontal scaling capability for handling peak loads"
    ],
    integrations: [
      "Flight scheduling systems",
      "Maintenance tracking software",
      "Crew management platforms",
      "Inventory management systems",
      "Financial and ERP systems",
      "Weather data services",
      "Aircraft performance databases"
    ],
    useCases: [
      {
        title: "Regional Airline Operations",
        description: "A regional airline with 50+ aircraft using AeroSync to coordinate maintenance scheduling, crew assignments, and flight operations across multiple bases."
      },
      {
        title: "MRO Facility Management",
        description: "Aircraft maintenance facilities utilizing AeroSync to coordinate parts inventory, maintenance schedules, and technician assignments."
      },
      {
        title: "Flight School Administration",
        description: "Flight training operations using AeroSync to manage student records, aircraft availability, and instructor scheduling."
      }
    ],
    screenshots: [
      { 
        image: "https://images.unsplash.com/photo-1493037821234-0c274eda13d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
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
    testimonial: {
      quote: "AeroSync has transformed how we manage our operational data. What used to take hours of manual coordination now happens automatically in real-time. The ROI has been tremendous.",
      author: "Michael Reynolds",
      company: "SkyHigh Regional Airlines"
    }
  },
  "AeroFlight": {
    longDescription: "AeroFlight is a sophisticated flight management system designed for both commercial airlines and private aviation operations. It offers comprehensive tools for flight planning, aircraft tracking, crew management, and performance analysis. With its intuitive interface and powerful features, AeroFlight helps aviation businesses optimize their operations, improve safety, and enhance overall efficiency.",
    benefits: [
      {
        icon: <FaPlane className="text-2xl text-primary" />,
        title: "Comprehensive Flight Planning",
        description: "Plan routes with real-time weather integration, airspace restrictions, and fuel optimization algorithms."
      },
      {
        icon: <FaUsers className="text-2xl text-primary" />,
        title: "Advanced Crew Management",
        description: "Track certifications, duty times, and rest requirements with automated alerts and scheduling assistance."
      },
      {
        icon: <FaChartLine className="text-2xl text-primary" />,
        title: "Performance Analytics",
        description: "Gain insights into operational efficiency, fuel consumption, and on-time performance with detailed reporting."
      },
      {
        icon: <FaMobileAlt className="text-2xl text-primary" />,
        title: "Mobile Operations",
        description: "Access flight details, updates, and documentation from anywhere with cross-platform mobile applications."
      }
    ],
    features: [
      "Intelligent flight planning with weather integration",
      "Aircraft tracking with real-time position updates",
      "Electronic flight logging and documentation",
      "Crew scheduling and qualification tracking",
      "Fuel consumption monitoring and optimization",
      "Maintenance tracking and alerting",
      "Performance reporting and analytics",
      "Passenger manifest management",
      "Weight and balance calculations",
      "Regulatory compliance monitoring"
    ],
    technicalSpecs: [
      "Cloud-based SaaS platform with global availability",
      "Native iOS and Android mobile applications",
      "Real-time data synchronization",
      "Offline functionality for remote operations",
      "ADS-B integration for live aircraft tracking",
      "ARINC 424 navigation database compatibility"
    ],
    integrations: [
      "Air traffic management systems",
      "Weather data services",
      "Aircraft maintenance software",
      "Crew management platforms",
      "Reservation and booking systems",
      "Airport information services",
      "Navigation database providers"
    ],
    useCases: [
      {
        title: "Commercial Airline Operations",
        description: "Major airlines using AeroFlight to manage thousands of daily flights, optimizing routes, tracking aircraft, and managing crew assignments."
      },
      {
        title: "Business Aviation Management",
        description: "Corporate flight departments utilizing AeroFlight to coordinate executive travel, optimize aircraft utilization, and ensure compliance with regulations."
      },
      {
        title: "Air Ambulance Services",
        description: "Medical transport operations leveraging AeroFlight's rapid planning capabilities to respond to emergency situations while maintaining safety standards."
      }
    ],
    screenshots: [
      { 
        image: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "AeroFlight's main dashboard showing active flights and status" 
      },
      { 
        image: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "Flight planning interface with weather overlay" 
      },
      { 
        image: "https://images.unsplash.com/photo-1495063438029-7f6764d3844a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80", 
        caption: "Crew management and scheduling calendar" 
      }
    ],
    testimonial: {
      quote: "AeroFlight has been a game-changer for our operation. The intuitive interface and powerful planning tools have increased our efficiency by over 30% while improving our dispatch reliability.",
      author: "Jennifer Sanchez",
      company: "TransGlobal Airlines"
    }
  },
  "ExecSync": {
    longDescription: "ExecSync is a premium platform designed specifically for executive aviation management. It caters to the unique needs of private jet operators, charter services, and corporate flight departments. With ExecSync, you can manage client preferences, streamline bookings, optimize aircraft utilization, and ensure VIP service delivery across your entire operation. The platform emphasizes security, discretion, and exceptional service delivery.",
    benefits: [
      {
        icon: <FaUsers className="text-2xl text-primary" />,
        title: "Client Relationship Management",
        description: "Track client preferences, communication history, and service requirements in a secure, centralized system."
      },
      {
        icon: <FaPlane className="text-2xl text-primary" />,
        title: "Fleet Optimization",
        description: "Maximize aircraft utilization while minimizing empty legs through intelligent scheduling and forecasting."
      },
      {
        icon: <FaLock className="text-2xl text-primary" />,
        title: "VIP Security & Privacy",
        description: "Ensure complete confidentiality with enterprise-grade security and granular access controls."
      },
      {
        icon: <FaChartLine className="text-2xl text-primary" />,
        title: "Financial Performance",
        description: "Track revenue, expenses, and profitability by client, aircraft, and route with detailed analytics."
      }
    ],
    features: [
      "Client profile management with preference tracking",
      "Charter request and quote generation",
      "Contract and agreement management",
      "Flight scheduling and optimization",
      "Crew assignment with qualification matching",
      "Catering and ground service coordination",
      "Expense tracking and billing automation",
      "Empty leg marketing tools",
      "Aircraft owner reporting portal",
      "Mobile applications for clients and crew"
    ],
    technicalSpecs: [
      "Cloud-based platform with dedicated instance options",
      "End-to-end encryption for sensitive client data",
      "White-label capabilities for branded client experience",
      "API-first architecture for custom integrations",
      "Multi-tenant data isolation",
      "Real-time availability and scheduling updates"
    ],
    integrations: [
      "Flight planning systems",
      "Payment processing platforms",
      "Accounting and ERP systems",
      "CRM platforms",
      "Aircraft tracking services",
      "Third-party charter marketplaces",
      "Maintenance management software"
    ],
    useCases: [
      {
        title: "Luxury Charter Operations",
        description: "Private jet charter companies using ExecSync to manage their entire client lifecycle, from booking to post-flight follow-up."
      },
      {
        title: "Corporate Flight Departments",
        description: "Companies with private aircraft fleets using ExecSync to manage executive travel, scheduling, and aircraft utilization."
      },
      {
        title: "Aircraft Management Companies",
        description: "Businesses managing aircraft for multiple owners, using ExecSync to coordinate charter revenue, owner usage, and financial reporting."
      }
    ],
    screenshots: [
      { 
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "ExecSync client management dashboard" 
      },
      { 
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "Charter quoting and booking interface" 
      },
      { 
        image: "https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "Aircraft availability and scheduling calendar" 
      }
    ],
    testimonial: {
      quote: "ExecSync has elevated our client service to new heights. The platform's attention to detail and comprehensive management tools allow us to deliver a truly premium experience to our discerning clientele.",
      author: "Robert Kincaid",
      company: "Elite Jet Charter"
    }
  },
  "AeroOps": {
    longDescription: "AeroOps is a comprehensive operations management platform designed for airlines, flight departments, and aviation service providers. It orchestrates the complex interplay between flight operations, maintenance, crew management, and regulatory compliance. By providing real-time visibility across all operational aspects, AeroOps enables better decision-making, improves resource utilization, and enhances overall safety and efficiency.",
    benefits: [
      {
        icon: <FaCheckCircle className="text-2xl text-primary" />,
        title: "Operational Control",
        description: "Gain complete visibility and control over all aspects of your aviation operation from a single, unified platform."
      },
      {
        icon: <FaChartLine className="text-2xl text-primary" />,
        title: "Resource Optimization",
        description: "Maximize the utilization of aircraft, crew, and support resources through intelligent scheduling and planning."
      },
      {
        icon: <FaLock className="text-2xl text-primary" />,
        title: "Regulatory Compliance",
        description: "Ensure adherence to FAA, EASA, and other regulatory requirements with automated monitoring and reporting."
      },
      {
        icon: <FaCode className="text-2xl text-primary" />,
        title: "Process Automation",
        description: "Streamline workflows and eliminate manual steps with configurable automation rules and triggers."
      }
    ],
    features: [
      "Flight operations control center with real-time monitoring",
      "Maintenance tracking and scheduling with parts inventory",
      "Crew management with qualification and duty time tracking",
      "Integrated flight planning and dispatch",
      "Disruption management and recovery planning",
      "Regulatory compliance monitoring and reporting",
      "Digital document management and distribution",
      "Fuel management and optimization",
      "Quality assurance and safety management tools",
      "Comprehensive reporting and analytics"
    ],
    technicalSpecs: [
      "Modular architecture allowing phased implementation",
      "High-availability configuration for critical operations",
      "Role-based access control with custom permission sets",
      "API-driven integration capabilities",
      "On-premises or cloud deployment options",
      "Support for multiple operating certificates and business units"
    ],
    integrations: [
      "Flight planning systems",
      "Aircraft maintenance software",
      "Crew scheduling platforms",
      "Weather information services",
      "ATC and airspace management systems",
      "ERP and financial systems",
      "Reservation and passenger management"
    ],
    useCases: [
      {
        title: "Commercial Airline Operations",
        description: "Airlines using AeroOps to coordinate daily operations, manage operational disruptions, and ensure regulatory compliance across their network."
      },
      {
        title: "Helicopter Operations",
        description: "Helicopter operators managing complex mission profiles, maintenance requirements, and pilot scheduling for emergency services, offshore operations, and more."
      },
      {
        title: "Government & Military Aviation",
        description: "Government agencies utilizing AeroOps to coordinate special mission flights, manage aircraft readiness, and track crew qualifications."
      }
    ],
    screenshots: [
      { 
        image: "https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80", 
        caption: "AeroOps operations control center dashboard" 
      },
      { 
        image: "https://images.unsplash.com/photo-1540339832862-474599807836?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "Maintenance planning and tracking interface" 
      },
      { 
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80", 
        caption: "Crew scheduling and management panel" 
      }
    ],
    testimonial: {
      quote: "AeroOps has fundamentally transformed how we run our airline. By integrating all operational functions into one system, we've reduced delays, improved aircraft utilization, and significantly enhanced our decision-making capability.",
      author: "Carlos Menendez",
      company: "Pacific Coast Airways"
    }
  },
  "SkyForge Legend": {
    longDescription: "SkyForge Legend is an advanced aviation training and simulation platform designed for flight schools, airlines, and training centers. It combines high-fidelity aircraft simulations with a comprehensive learning management system, enabling effective pilot training from initial certification through to type ratings and recurrent training. The platform supports both classroom and distance learning, with integrated progress tracking and performance analytics.",
    benefits: [
      {
        icon: <FaUsers className="text-2xl text-primary" />,
        title: "Standardized Training",
        description: "Ensure consistent training delivery across instructors, locations, and training devices."
      },
      {
        icon: <FaChartLine className="text-2xl text-primary" />,
        title: "Performance Analytics",
        description: "Track student progress with detailed metrics and identify areas needing additional focus."
      },
      {
        icon: <FaMobileAlt className="text-2xl text-primary" />,
        title: "Flexible Learning",
        description: "Enable students to access training materials, procedures, and simulations from anywhere."
      },
      {
        icon: <FaDatabase className="text-2xl text-primary" />,
        title: "Training Records Management",
        description: "Maintain comprehensive digital records of all training activities, certifications, and evaluations."
      }
    ],
    features: [
      "High-fidelity aircraft simulations for multiple types",
      "Scenario-based training modules with progressive difficulty",
      "Instructor tools for demonstration and evaluation",
      "Integrated learning management system",
      "Virtual classroom capabilities",
      "Digital training materials and procedures",
      "Progress tracking and performance assessment",
      "Certification and recurrent training management",
      "VR/AR support for immersive training",
      "Mobile companion applications"
    ],
    technicalSpecs: [
      "PC, Mac, and mobile platform support",
      "Cloud-synchronized progress and settings",
      "Graphics engine optimized for realistic visuals",
      "Physics-based flight models with real aircraft data",
      "Instructor station for monitoring and intervention",
      "Integration with hardware simulation devices"
    ],
    integrations: [
      "Learning management systems",
      "Flight training devices and simulators",
      "Student information systems",
      "Regulatory tracking systems",
      "VR headsets and hardware",
      "Aircraft systems databases",
      "Weather simulation services"
    ],
    useCases: [
      {
        title: "Airline Ab Initio Programs",
        description: "Airlines running cadet programs using SkyForge Legend to provide standardized training from zero hours to first officer qualification."
      },
      {
        title: "Type Rating Training",
        description: "Training centers utilizing SkyForge Legend to prepare pilots for specific aircraft type ratings with realistic systems simulations."
      },
      {
        title: "University Aviation Programs",
        description: "Aviation colleges integrating SkyForge Legend into their curriculum to provide students with advanced simulation capabilities and comprehensive progress tracking."
      }
    ],
    screenshots: [
      { 
        image: "https://images.unsplash.com/photo-1496873678051-04b15c4f00cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80", 
        caption: "SkyForge Legend cockpit simulation view" 
      },
      { 
        image: "https://images.unsplash.com/photo-1626285869675-cb4fb4db542a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "Instructor station for monitoring student performance" 
      },
      { 
        image: "https://images.unsplash.com/photo-1575629393405-a3207954de82?ixlib=rb-4.0.3&auto=format&fit=crop&w=2076&q=80", 
        caption: "Learning management interface with progress tracking" 
      }
    ],
    testimonial: {
      quote: "SkyForge Legend has revolutionized our flight training program. The integration of simulator sessions with the learning management system has improved student outcomes and reduced time-to-proficiency by nearly 20%.",
      author: "Dr. Sarah Williams",
      company: "International Aviation Academy"
    }
  },
  "Stitchlet": {
    longDescription: "Stitchlet is an AI-powered data integration platform specifically designed for the aviation industry. It connects disparate systems, databases, and applications, enabling seamless data flow across your entire technical ecosystem. Using machine learning and intelligent mapping, Stitchlet can automatically reconcile data formats, identify relationships, and maintain integrity across connected systems, dramatically reducing the time and complexity typically associated with aviation data integration projects.",
    benefits: [
      {
        icon: <FaDatabase className="text-2xl text-primary" />,
        title: "Universal Connectivity",
        description: "Connect any aviation system, database, or application regardless of age, format, or vendor."
      },
      {
        icon: <FaCode className="text-2xl text-primary" />,
        title: "Intelligent Mapping",
        description: "AI-powered data mapping that automatically recognizes fields and suggests connections between systems."
      },
      {
        icon: <FaChartLine className="text-2xl text-primary" />,
        title: "Data Quality Assurance",
        description: "Continuous monitoring and validation of data integrity with automated error detection and correction."
      },
      {
        icon: <FaUsers className="text-2xl text-primary" />,
        title: "Non-Technical Accessibility",
        description: "Visual interface for creating and managing integrations without programming knowledge."
      }
    ],
    features: [
      "Pre-built connectors for major aviation systems",
      "AI-assisted data mapping and transformation",
      "Real-time and batch integration options",
      "Data quality monitoring and validation",
      "Visual integration designer",
      "Automated error handling and recovery",
      "Change management and version control",
      "Comprehensive logging and auditing",
      "Scalable architecture supporting millions of records",
      "Security and compliance controls"
    ],
    technicalSpecs: [
      "Containerized microservices architecture",
      "Support for REST, SOAP, GraphQL, and legacy protocols",
      "EDI and ARINC message format support",
      "On-premises, cloud, or hybrid deployment options",
      "Role-based access control with detailed permissions",
      "High-throughput message processing capability"
    ],
    integrations: [
      "Reservation systems",
      "Flight operations platforms",
      "Maintenance management software",
      "Crew scheduling systems",
      "ERP and financial applications",
      "Customer management platforms",
      "Legacy mainframe systems"
    ],
    useCases: [
      {
        title: "Airline System Modernization",
        description: "Major airlines using Stitchlet to integrate legacy systems with modern cloud applications during digital transformation initiatives."
      },
      {
        title: "Aviation Data Warehouse",
        description: "Organizations creating centralized data warehouses for analytics, pulling information from multiple operational systems through Stitchlet."
      },
      {
        title: "MRO Integration",
        description: "Maintenance facilities connecting their shop floor systems with customer portals, parts inventory, and financial systems for end-to-end process automation."
      }
    ],
    screenshots: [
      { 
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "Stitchlet integration designer interface" 
      },
      { 
        image: "https://images.unsplash.com/photo-1589149098258-3e9102a73142?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80", 
        caption: "Data flow monitoring dashboard" 
      },
      { 
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
        caption: "AI-assisted mapping suggestion interface" 
      }
    ],
    testimonial: {
      quote: "Stitchlet accomplished in weeks what our previous integration projects took years to complete. The AI-powered mapping capabilities dramatically reduced the time our team spent on data reconciliation and transformation.",
      author: "Tom Iverson",
      company: "Global Airways IT Division"
    }
  }
};

interface PlatformDetailModalProps {
  platform: Platform | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlatformDetailModal({ platform, isOpen, onClose }: PlatformDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'technical' | 'case-studies'>('overview');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  if (!platform || !isOpen) return null;
  
  // Get enhanced details for the platform
  const details = enhancedPlatformDetails[platform.name] || null;
  
  if (!details) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-2xl font-bold text-primary mb-4">{platform.name}</h3>
          <p className="text-gray-600 mb-6">{platform.description}</p>
          <p className="text-gray-500 italic">Detailed information for this platform is currently being updated.</p>
          <div className="mt-8 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-lg">Close</button>
          </div>
        </div>
      </div>
    );
  }
  
  const nextImage = () => {
    if (!details.screenshots.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % details.screenshots.length);
  };
  
  const prevImage = () => {
    if (!details.screenshots.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + details.screenshots.length) % details.screenshots.length);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-xl overflow-hidden max-w-6xl w-full max-h-[90vh] my-8" 
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="bg-primary text-white p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold font-montserrat">{platform.name}</h2>
                <button 
                  onClick={onClose}
                  className="text-white/80 hover:text-white"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <p className="text-white/90 mt-2 max-w-3xl">{platform.description}</p>
            </div>
            
            {/* Tabs */}
            <div className="bg-gray-100 p-4 flex flex-wrap gap-2">
              <button 
                className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'overview' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'features' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('features')}
              >
                Features & Benefits
              </button>
              <button 
                className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'technical' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('technical')}
              >
                Technical Specs
              </button>
              <button 
                className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'case-studies' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('case-studies')}
              >
                Case Studies
              </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-4">Platform Overview</h3>
                      <p className="text-gray-700 leading-relaxed">{details.longDescription}</p>
                    </div>
                    
                    {details.screenshots.length > 0 && (
                      <div className="relative h-96 rounded-xl overflow-hidden border border-gray-200">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img 
                            src={details.screenshots[currentImageIndex].image} 
                            alt={details.screenshots[currentImageIndex].caption} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {details.screenshots.length > 1 && (
                          <>
                            <button 
                              onClick={prevImage}
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 focus:outline-none"
                              aria-label="Previous image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button 
                              onClick={nextImage}
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 focus:outline-none"
                              aria-label="Next image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </>
                        )}
                        
                        <div className="absolute left-0 right-0 bottom-0 bg-black/70 text-white p-4">
                          <p className="text-center">{details.screenshots[currentImageIndex].caption}</p>
                        </div>
                      </div>
                    )}
                    
                    {details.testimonial && (
                      <div className="bg-gray-50 border-l-4 border-primary p-6 rounded-r-xl">
                        <p className="text-gray-700 italic mb-4">"{details.testimonial.quote}"</p>
                        <div>
                          <p className="font-semibold">{details.testimonial.author}</p>
                          <p className="text-sm text-gray-500">{details.testimonial.company}</p>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-xl font-bold text-primary mb-4">Key Benefits</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {details.benefits.map((benefit, index) => (
                          <div key={index} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex">
                            <div className="mr-4">
                              {benefit.icon}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 mb-2">{benefit.title}</h4>
                              <p className="text-gray-600">{benefit.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {activeTab === 'features' && (
                  <motion.div
                    key="features"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-4">Features</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {details.features.map((feature, index) => (
                          <div key={index} className="flex items-start bg-white rounded-lg p-4 border border-gray-200">
                            <div className="text-primary mr-3 mt-1">
                              <FaCheckCircle />
                            </div>
                            <p className="text-gray-700">{feature}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-4">Integrations</h3>
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <p className="text-gray-700 mb-4">{platform.name} seamlessly integrates with a wide range of aviation systems and services:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {details.integrations.map((integration, index) => (
                            <div key={index} className="bg-white px-4 py-3 rounded-lg border border-gray-200">
                              {integration}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {activeTab === 'technical' && (
                  <motion.div
                    key="technical"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-4">Technical Specifications</h3>
                      <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm">
                        <div className="flex items-center mb-6">
                          <div className="flex space-x-2 mr-4">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <p className="text-gray-400">{platform.name} Technical Specs</p>
                        </div>
                        
                        <div className="text-white">
                          {details.technicalSpecs.map((spec, index) => (
                            <div key={index} className="mb-3 pl-4 border-l-2 border-blue-500">
                              <span className="text-blue-400">{'>'}</span> {spec}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-4">System Requirements</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-5 border border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-3">Server Requirements</h4>
                          <ul className="space-y-2 text-gray-700">
                            <li>• Modern server hardware or cloud infrastructure</li>
                            <li>• 8+ CPU cores recommended for production</li>
                            <li>• 16GB+ RAM for optimal performance</li>
                            <li>• SSD storage with appropriate redundancy</li>
                            <li>• Linux, Windows Server, or Docker environments</li>
                          </ul>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-3">Client Requirements</h4>
                          <ul className="space-y-2 text-gray-700">
                            <li>• Modern web browser (Chrome, Firefox, Edge, Safari)</li>
                            <li>• Internet connection (5Mbps+ recommended)</li>
                            <li>• 1080p display resolution or higher</li>
                            <li>• Mobile apps available for iOS 13+ and Android 9+</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {activeTab === 'case-studies' && (
                  <motion.div
                    key="case-studies"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-4">Use Cases</h3>
                      <div className="space-y-6">
                        {details.useCases.map((useCase, index) => (
                          <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h4 className="text-xl font-bold text-primary mb-3">{useCase.title}</h4>
                            <p className="text-gray-700">{useCase.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                      <h3 className="text-xl font-bold text-primary mb-4">Success Metrics</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-5 text-center border border-gray-200">
                          <div className="text-3xl font-bold text-primary mb-2">30%</div>
                          <p className="text-gray-700">Average efficiency improvement</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 text-center border border-gray-200">
                          <div className="text-3xl font-bold text-primary mb-2">85%</div>
                          <p className="text-gray-700">Data accuracy increase</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 text-center border border-gray-200">
                          <div className="text-3xl font-bold text-primary mb-2">6 mo</div>
                          <p className="text-gray-700">Average ROI timeframe</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-wrap justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex">
                  {platform.tags.map((tag, idx) => (
                    <span key={idx} className="bg-gray-200 text-primary text-xs font-semibold px-3 py-1 rounded-full mr-2">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 mt-3 sm:mt-0">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  Close
                </button>
                <a 
                  href="#contact" 
                  onClick={onClose}
                  className="px-4 py-2 bg-luxury hover:bg-luxury/90 text-white rounded-lg transition-colors"
                >
                  Request Demo
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
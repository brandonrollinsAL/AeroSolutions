import { useState } from "react";
import { FaLink, FaArrowLeft, FaTimes, FaCode, FaServer, FaShieldAlt, FaGlobe, FaChartLine } from "react-icons/fa";
import { motion } from "framer-motion";

interface AeroLinkPlatformViewProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLanding: () => void;
}

export default function AeroLinkPlatformView({ isOpen, onClose, onBackToLanding }: AeroLinkPlatformViewProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");

  if (!isOpen) return null;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "features", label: "Features" },
    { id: "technical", label: "Technical Details" },
    { id: "api", label: "API Reference" },
    { id: "use-cases", label: "Use Cases" },
  ];

  const features = [
    {
      icon: <FaGlobe className="text-blue-600" />,
      title: "Global Integration Network",
      description: "Connect any aviation system worldwide with our proprietary middleware that bridges legacy and modern platforms."
    },
    {
      icon: <FaShieldAlt className="text-blue-600" />,
      title: "Military-Grade Security",
      description: "End-to-end encryption with FIPS 140-2 compliance and zero-trust architecture protects sensitive aviation data."
    },
    {
      icon: <FaServer className="text-blue-600" />,
      title: "Edge-Enabled Processing",
      description: "Process critical data at the source with our distributed edge computing network for millisecond response times."
    },
    {
      icon: <FaCode className="text-blue-600" />,
      title: "Custom Integration Framework",
      description: "Our no-code integration builder allows aviation professionals to create custom data flows without developer resources."
    },
    {
      icon: <FaChartLine className="text-blue-600" />,
      title: "Predictive Operations",
      description: "AI-driven predictive analytics identify potential issues before they occur, minimizing downtime and operational disruptions."
    }
  ];

  const techStack = [
    { category: "Frontend", technologies: ["Next.js", "React", "TypeScript", "WebAssembly"] },
    { category: "Backend", technologies: ["Go", "Rust", "gRPC", "GraphQL", "RESTful APIs"] },
    { category: "Data Storage", technologies: ["CockroachDB", "TimescaleDB", "Redis", "Elasticsearch"] },
    { category: "Messaging", technologies: ["Apache Pulsar", "MQTT", "NATS"] },
    { category: "Infrastructure", technologies: ["Kubernetes", "Istio", "Envoy", "Linkerd"] },
    { category: "Machine Learning", technologies: ["TensorFlow", "PyTorch", "ONNX", "MLflow"] },
    { category: "Security", technologies: ["Vault", "OPA", "Keycloak", "mTLS", "HSM integration"] },
    { category: "Monitoring", technologies: ["Prometheus", "Grafana", "OpenTelemetry", "Jaeger"] }
  ];

  const apiEndpoints = [
    {
      method: "GET",
      endpoint: "/api/v1/systems",
      description: "Retrieve all connected aviation systems",
      parameters: "?status=[active|inactive|all]",
      sampleResponse: {
        systems: [
          {
            id: "sys-123",
            name: "Flight Management System",
            status: "active",
            lastSyncTime: "2024-04-09T12:23:45Z"
          }
        ]
      }
    },
    {
      method: "POST",
      endpoint: "/api/v1/connections",
      description: "Create a new connection between systems",
      parameters: "",
      requestBody: {
        sourceSystemId: "sys-123",
        targetSystemId: "sys-456",
        mappingRules: [
          {
            sourceField: "flight.id",
            targetField: "flightId",
            transformation: "direct"
          }
        ]
      }
    },
    {
      method: "GET",
      endpoint: "/api/v1/metrics/{systemId}",
      description: "Retrieve performance metrics for a specific system",
      parameters: "?timeframe=[day|week|month]&resolution=[minute|hour|day]",
      sampleResponse: {
        metrics: {
          dataVolume: "1.24GB",
          requestsPerSecond: 342,
          averageLatency: "4ms",
          errorRate: "0.01%"
        }
      }
    },
    {
      method: "PUT",
      endpoint: "/api/v1/mappings/{mappingId}",
      description: "Update mapping rules for an existing connection",
      parameters: "",
      requestBody: {
        mappingRules: [
          {
            sourceField: "aircraft.registration",
            targetField: "tailNumber",
            transformation: "uppercase"
          }
        ]
      }
    }
  ];

  const useCases = [
    {
      title: "Global Airline Operations Integration",
      description: "A major international airline unified 27 disparate systems including crew scheduling, maintenance tracking, and flight operations using AeroLink. This reduced cross-system latency by 94% and eliminated an estimated 120,000 hours of manual data reconciliation annually.",
      results: ["94% reduction in cross-system latency", "120,000 hours saved in manual reconciliation", "99.998% data accuracy achieved"]
    },
    {
      title: "Airport Ground Operations Management",
      description: "A hub airport deployed AeroLink to connect airline arrival data, gate management systems, ground handling operations, and baggage systems. The integrated solution reduced aircraft turnaround times by 18 minutes on average and improved on-time departure performance by 23%.",
      results: ["18 minute reduction in aircraft turnaround", "23% improvement in on-time departures", "32% reduction in mishandled baggage"]
    },
    {
      title: "Military Fleet Integration",
      description: "A defense department implemented AeroLink to create a secure, unified view of maintenance, supply chain, and mission data across their fleet. The platform enabled real-time operational visibility while maintaining strict security protocols and air-gapped environments where required.",
      results: ["97% improvement in maintenance forecasting accuracy", "68% reduction in parts inventory costs", "Zero security incidents recorded"]
    },
    {
      title: "MRO Efficiency Transformation",
      description: "A large MRO provider integrated customer systems, parts inventory, technician scheduling, and compliance reporting through AeroLink. This reduced aircraft maintenance turnaround time by 31% while improving regulatory compliance documentation.",
      results: ["31% reduction in maintenance turnaround", "100% regulatory compliance documentation", "43% improved parts utilization"]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mr-4">
              <FaLink className="text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-montserrat">AeroLink</h2>
              <p className="text-sm text-white/80">Ultimate connectivity solution for aviation systems</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBackToLanding}
              className="flex items-center bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Back to Platform List
            </button>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-8">
                  <h3 className="text-2xl font-bold text-blue-900 mb-4">AeroLink: The Aviation Integration Platform</h3>
                  <p className="text-blue-800 mb-4">
                    AeroLink is the aviation industry's premier connectivity solution, designed to solve the complex challenge of system fragmentation that has plagued the industry for decades. Our platform creates a unified digital ecosystem that enhances operational efficiency, data accuracy, and decision-making capabilities.
                  </p>
                  <p className="text-blue-800">
                    Built from the ground up for aviation's unique requirements, AeroLink seamlessly connects maintenance systems, flight operations, crew management, airport systems, and regulatory reporting into a cohesive, secure environment that empowers aviation professionals at every level.
                  </p>
                </div>
                
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Platform Highlights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <FaLink className="text-blue-600" />
                        </div>
                        <h5 className="font-bold">Universal Connectivity</h5>
                      </div>
                      <p className="text-gray-600">Connect to any aviation system, regardless of age or technology, with our 200+ pre-built connectors and custom adapter framework.</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <FaShieldAlt className="text-blue-600" />
                        </div>
                        <h5 className="font-bold">Aviation-Grade Security</h5>
                      </div>
                      <p className="text-gray-600">Purpose-built security meeting aviation's strict requirements, with end-to-end encryption, role-based access control, and comprehensive audit trails.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Key Capabilities</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="text-blue-500 mt-1 mr-3">•</div>
                      <p><span className="font-semibold">Real-time Data Synchronization:</span> Ensure consistent information across all connected systems with millisecond-level updates.</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-blue-500 mt-1 mr-3">•</div>
                      <p><span className="font-semibold">Intelligent Data Transformation:</span> Automatically map, transform, and validate data between different system formats and schemas.</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-blue-500 mt-1 mr-3">•</div>
                      <p><span className="font-semibold">Comprehensive API Framework:</span> Expose unified APIs that abstract the complexity of underlying systems for simplified integration.</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-blue-500 mt-1 mr-3">•</div>
                      <p><span className="font-semibold">Predictive Analytics:</span> Leverage machine learning to identify patterns and predict maintenance needs or operational disruptions.</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-blue-500 mt-1 mr-3">•</div>
                      <p><span className="font-semibold">Regulatory Compliance:</span> Automated reporting and documentation ensures adherence to FAA, EASA, and other global aviation authorities.</p>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Implementation & Support</h4>
                  <p className="text-gray-700 mb-4">
                    Our team of aviation technology specialists provides comprehensive implementation services, from initial assessment through deployment and continuous optimization. Typical enterprise implementations are completed in 8-12 weeks, with phased approaches available for complex environments.
                  </p>
                  <p className="text-gray-700">
                    AeroLink customers receive 24/7/365 support from our team of aviation experts, with guaranteed response times and regular system health checks to ensure optimal performance.
                  </p>
                </div>
              </div>
            )}
            
            {/* Features Tab */}
            {activeTab === "features" && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Core Features</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {features.map((feature, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          {feature.icon}
                        </div>
                        <h4 className="font-bold text-lg">{feature.title}</h4>
                      </div>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-50 rounded-lg p-6 mb-8">
                  <h4 className="text-xl font-bold text-blue-900 mb-3">Integration Capabilities</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h5 className="font-bold mb-2">Pre-built Connectors</h5>
                      <p className="text-sm text-gray-600">Over 200 ready-to-use connectors for aviation-specific systems and general enterprise applications.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h5 className="font-bold mb-2">Custom Adapter Framework</h5>
                      <p className="text-sm text-gray-600">Build custom adapters for any proprietary system using our SDK and visual development tools.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h5 className="font-bold mb-2">Data Transformation</h5>
                      <p className="text-sm text-gray-600">Powerful mapping and transformation capabilities with support for complex business rules.</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h5 className="font-bold mb-2">Protocol Support</h5>
                      <p className="text-sm text-gray-600">Support for all major integration protocols including REST, SOAP, GraphQL, gRPC, MQTT, and proprietary aviation protocols.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Security & Compliance</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-bold mb-1">End-to-End Encryption</h5>
                      <p className="text-gray-600 text-sm">All data is encrypted both in transit and at rest using industry-standard encryption algorithms.</p>
                    </div>
                    <div>
                      <h5 className="font-bold mb-1">Role-Based Access Control</h5>
                      <p className="text-gray-600 text-sm">Granular access controls ensure users can only access data relevant to their responsibilities.</p>
                    </div>
                    <div>
                      <h5 className="font-bold mb-1">Compliance Certifications</h5>
                      <p className="text-gray-600 text-sm">Meets or exceeds requirements for FAA, EASA, SOC 2, ISO 27001, GDPR, and other relevant regulations.</p>
                    </div>
                    <div>
                      <h5 className="font-bold mb-1">Audit Trails</h5>
                      <p className="text-gray-600 text-sm">Comprehensive logging of all system activities, with tamper-proof records for regulatory compliance.</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Advanced Analytics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h5 className="font-bold mb-2">Operational Intelligence</h5>
                      <p className="text-sm text-gray-600">Real-time dashboards with customizable KPIs and metrics to monitor system performance and operational status.</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h5 className="font-bold mb-2">Predictive Maintenance</h5>
                      <p className="text-sm text-gray-600">AI-powered algorithms that identify potential maintenance issues before they cause operational disruptions.</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h5 className="font-bold mb-2">Business Insights</h5>
                      <p className="text-sm text-gray-600">Cross-system reporting and analytics that reveal opportunities for operational improvements and cost savings.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Technical Details Tab */}
            {activeTab === "technical" && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Technical Architecture</h3>
                
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">System Architecture</h4>
                  <p className="text-gray-700 mb-4">
                    AeroLink is built on a microservices architecture with a distributed edge computing model. This design enables processing at the edge while maintaining a unified data model and control plane.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-bold mb-2 text-blue-900">Edge Layer</h5>
                      <p className="text-sm text-blue-800">Deployed on-premises or in private cloud environments to interface directly with aviation systems, providing local data processing and caching capabilities.</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-bold mb-2 text-blue-900">Core Platform</h5>
                      <p className="text-sm text-blue-800">Centralized cloud or on-premises deployment that handles orchestration, transformation, and business rules processing across the entire network.</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-bold mb-2 text-blue-900">Analytics Layer</h5>
                      <p className="text-sm text-blue-800">Specialized processing environment for real-time and historical analytics, with machine learning capabilities for predictive insights.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Technology Stack</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {techStack.map((stack, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="font-bold mb-2 text-blue-700">{stack.category}</h5>
                        <div className="flex flex-wrap gap-2">
                          {stack.technologies.map((tech, i) => (
                            <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Deployment Options</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-bold mb-1">SaaS Deployment</h5>
                      <p className="text-gray-600 text-sm">Fully managed cloud deployment with dedicated edge components for local system integration.</p>
                    </div>
                    <div>
                      <h5 className="font-bold mb-1">Private Cloud</h5>
                      <p className="text-gray-600 text-sm">Deployment within customer-managed cloud environments (AWS, Azure, GCP) with our management plane.</p>
                    </div>
                    <div>
                      <h5 className="font-bold mb-1">On-Premises</h5>
                      <p className="text-gray-600 text-sm">Complete on-premises deployment for organizations with strict data sovereignty or air-gap requirements.</p>
                    </div>
                    <div>
                      <h5 className="font-bold mb-1">Hybrid</h5>
                      <p className="text-gray-600 text-sm">Combined deployment model with edge components on-premises and core platform in cloud environments.</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Performance & Scalability</h4>
                  <div className="bg-blue-50 rounded-lg p-5">
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="text-blue-500 mt-1 mr-3">•</div>
                        <p><span className="font-semibold">Throughput:</span> Capable of processing up to 50,000 transactions per second per node.</p>
                      </li>
                      <li className="flex items-start">
                        <div className="text-blue-500 mt-1 mr-3">•</div>
                        <p><span className="font-semibold">Latency:</span> Average end-to-end latency of 4ms for standard operations.</p>
                      </li>
                      <li className="flex items-start">
                        <div className="text-blue-500 mt-1 mr-3">•</div>
                        <p><span className="font-semibold">Availability:</span> 99.998% uptime guarantee with automatic failover and disaster recovery.</p>
                      </li>
                      <li className="flex items-start">
                        <div className="text-blue-500 mt-1 mr-3">•</div>
                        <p><span className="font-semibold">Data Volume:</span> Proven implementations handling petabytes of operational data for major airlines.</p>
                      </li>
                      <li className="flex items-start">
                        <div className="text-blue-500 mt-1 mr-3">•</div>
                        <p><span className="font-semibold">Horizontal Scaling:</span> Linear scaling capabilities with additional nodes for increased demand.</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* API Reference Tab */}
            {activeTab === "api" && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">API Reference</h3>
                
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">API Overview</h4>
                  <p className="text-gray-700 mb-4">
                    AeroLink provides comprehensive REST and GraphQL APIs for integration with external systems and custom applications. All APIs are versioned, documented with OpenAPI specifications, and include sandbox environments for testing.
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg mb-4">
                    <h5 className="font-bold mb-2">Authentication</h5>
                    <p className="text-sm text-gray-700">
                      All API requests are authenticated using JWT tokens with OAuth 2.0 and OpenID Connect support. API keys with fine-grained permissions are also available for system-to-system integration.
                    </p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h5 className="font-bold mb-2">Rate Limiting</h5>
                    <p className="text-sm text-gray-700">
                      Standard API plans include 10,000 requests per minute, with the ability to increase limits for high-volume operations. Detailed rate limit headers provide current usage metrics.
                    </p>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Key Endpoints</h4>
                  <div className="space-y-6">
                    {apiEndpoints.map((endpoint, index) => (
                      <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="flex items-center p-4 bg-gray-50 border-b border-gray-200">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md mr-2 ${endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' : endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {endpoint.method}
                          </span>
                          <code className="font-mono text-gray-800">{endpoint.endpoint}</code>
                        </div>
                        <div className="p-4">
                          <p className="text-gray-700 mb-2">{endpoint.description}</p>
                          {endpoint.parameters && (
                            <div className="mb-3">
                              <h6 className="text-sm font-bold mb-1">Parameters</h6>
                              <code className="text-xs bg-gray-100 p-1 rounded">{endpoint.parameters}</code>
                            </div>
                          )}
                          {endpoint.requestBody && (
                            <div className="mb-3">
                              <h6 className="text-sm font-bold mb-1">Request Body</h6>
                              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(endpoint.requestBody, null, 2)}
                              </pre>
                            </div>
                          )}
                          {endpoint.sampleResponse && (
                            <div>
                              <h6 className="text-sm font-bold mb-1">Sample Response</h6>
                              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(endpoint.sampleResponse, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">SDK & Client Libraries</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h5 className="font-bold mb-2">JavaScript/TypeScript</h5>
                      <p className="text-sm text-gray-600 mb-2">Full-featured client with TypeScript definitions and React hooks.</p>
                      <code className="text-xs bg-gray-100 p-1 rounded block">npm install @aerolink/client</code>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h5 className="font-bold mb-2">Python</h5>
                      <p className="text-sm text-gray-600 mb-2">Python client with async support and pandas integration.</p>
                      <code className="text-xs bg-gray-100 p-1 rounded block">pip install aerolink-python</code>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h5 className="font-bold mb-2">Java</h5>
                      <p className="text-sm text-gray-600 mb-2">Java client with Spring Boot integration.</p>
                      <code className="text-xs bg-gray-100 p-1 rounded block">maven: com.aerolink:client:1.0.5</code>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Use Cases Tab */}
            {activeTab === "use-cases" && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Success Stories</h3>
                
                <div className="space-y-8">
                  {useCases.map((useCase, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-6">
                        <h4 className="text-xl font-bold text-blue-800 mb-3">{useCase.title}</h4>
                        <p className="text-gray-700 mb-4">{useCase.description}</p>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="font-semibold text-blue-800 mb-2">Key Results</h5>
                          <ul className="space-y-1">
                            {useCase.results.map((result, i) => (
                              <li key={i} className="flex items-start">
                                <span className="text-blue-500 mr-2">✓</span>
                                <span className="text-blue-800">{result}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mt-8">
                  <h4 className="text-xl font-bold text-blue-900 mb-4">Ready to Transform Your Aviation Operations?</h4>
                  <p className="text-blue-800 mb-4">
                    Join the leading aviation organizations worldwide that have revolutionized their operational efficiency with AeroLink. Our team of aviation technology experts is ready to discuss your specific needs and demonstrate how AeroLink can transform your operations.
                  </p>
                  <div className="flex items-center justify-center mt-4">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors">
                      Schedule a Consultation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Aero Solutions. All rights reserved.</p>
            <div className="flex space-x-2">
              <button 
                onClick={onBackToLanding}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Back to Platform List
              </button>
              <span className="text-gray-300">|</span>
              <button 
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
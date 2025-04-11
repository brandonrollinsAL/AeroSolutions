import { Separator } from "@/components/ui/separator";
import { Shield, Lock, AlertTriangle, Database, Users, Key, FileCheck, Zap } from "lucide-react";

const SecurityFeature = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 transition-all hover:shadow-md">
    <div className="flex items-start">
      <div className="bg-blue-100 p-3 rounded-lg text-blue-700 mr-4">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-blue-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  </div>
);

export default function SecurityPolicy() {
  const securityFeatures = [
    {
      icon: <Lock size={24} />,
      title: "Data Encryption",
      description: "All sensitive data is encrypted both in transit and at rest using industry-standard AES-256 encryption protocols."
    },
    {
      icon: <Shield size={24} />,
      title: "JWT Authentication",
      description: "Secure JSON Web Token (JWT) authentication with role-based access control to protect user sessions and API endpoints."
    },
    {
      icon: <AlertTriangle size={24} />,
      title: "Input Validation",
      description: "Comprehensive input validation and sanitization to prevent injection attacks, XSS, and CSRF vulnerabilities."
    },
    {
      icon: <Database size={24} />,
      title: "Database Security",
      description: "Parameterized queries, least privilege access, and regular security audits to protect against database attacks."
    },
    {
      icon: <Users size={24} />,
      title: "GDPR Compliance",
      description: "Full compliance with GDPR regulations including data subject rights, consent management, and privacy by design."
    },
    {
      icon: <Key size={24} />,
      title: "API Security",
      description: "Rate limiting, request throttling, and secure API keys management to prevent abuse and unauthorized access."
    }
  ];

  return (
    <div className="container mx-auto max-w-5xl py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-blue-900 mb-4">Security Policy</h1>
      <p className="text-xl text-gray-600 mb-10">
        At Aero Solutions, we prioritize the security of your data and systems with industry-leading protection measures.
      </p>
      
      <Separator className="my-8" />
      
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-blue-800 mb-8">Our Security Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {securityFeatures.map((feature, index) => (
            <SecurityFeature 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>
      
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4">Security Certifications & Compliance</h2>
        <p className="text-gray-600 mb-6">
          Our security practices are aligned with the following standards and frameworks:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li><strong>SOC 2 Type II:</strong> Compliance with Service Organization Control standards for security, availability, and confidentiality</li>
          <li><strong>ISO 27001:</strong> Implementation of a robust information security management system</li>
          <li><strong>GDPR:</strong> Full compliance with the EU General Data Protection Regulation</li>
          <li><strong>CCPA:</strong> Compliance with the California Consumer Privacy Act</li>
          <li><strong>HIPAA:</strong> Security measures aligned with Health Insurance Portability and Accountability Act requirements</li>
        </ul>
      </section>
      
      <Separator className="my-8" />
      
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4">Our Security Commitments</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center mb-4">
              <FileCheck className="text-blue-700 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-blue-900">Regular Security Audits</h3>
            </div>
            <p className="text-gray-600">
              We conduct regular internal and external security audits and penetration testing to identify and address potential vulnerabilities before they can be exploited.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center mb-4">
              <Zap className="text-blue-700 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-blue-900">Incident Response</h3>
            </div>
            <p className="text-gray-600">
              Our incident response team is available 24/7 to detect, respond to, and mitigate security incidents. We maintain a detailed incident response plan with clear communication protocols.
            </p>
          </div>
        </div>
        
        <p className="text-gray-600">
          We're committed to maintaining the highest standards of security for our clients' data. Our security practices include:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-600">
          <li>Regular security training for all employees</li>
          <li>Background checks for all personnel with access to sensitive systems</li>
          <li>Secure development practices including code reviews and security testing</li>
          <li>Physical security measures for our office locations and data centers</li>
          <li>Business continuity and disaster recovery planning</li>
          <li>Third-party vendor security assessment</li>
        </ul>
      </section>
      
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4">Reporting Security Concerns</h2>
        <p className="text-gray-600 mb-4">
          If you believe you've discovered a security vulnerability in our systems or have security concerns about our services, please contact our security team immediately at:
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-lg font-medium text-blue-800">security@aerosolutions.com</p>
        </div>
      </section>
      
      <div className="text-right text-sm text-gray-500 mt-8">
        Last Updated: April 11, 2025
      </div>
    </div>
  );
}
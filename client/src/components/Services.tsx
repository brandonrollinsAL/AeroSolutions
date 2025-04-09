import { motion } from "framer-motion";
import { FaLaptopCode, FaCreditCard, FaHeadset, FaCheck, FaPlane, FaServer, FaChartLine, FaDatabase, FaCloudDownloadAlt, FaGlobe, FaShieldAlt } from "react-icons/fa";

export default function Services() {
  const fadeIn = {
    hidden: { opacity: 0, y: 40 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.5 }
    })
  };

  const services = [
    {
      icon: <FaLaptopCode className="text-4xl mb-4 text-black" />,
      title: "Aviation Software Development",
      slug: "aviation-software-development",
      description: "Custom aviation software solutions built by pilots who understand the unique challenges of flight operations, aircraft maintenance, and regulatory compliance.",
      features: [
        "Flight management system development",
        "Aircraft maintenance tracking software",
        "Pilot logbook & training applications",
        "Aviation compliance management tools"
      ]
    },
    {
      icon: <FaPlane className="text-4xl mb-4 text-black" />,
      title: "Proprietary Aviation Platforms",
      slug: "aviation-software-platforms",
      description: "Our suite of aviation-specific platforms—AeroSync, AeroFlight, AeroOps, and ExecSync—designed to transform how you manage flight operations.",
      features: [
        "AeroSync: Data synchronization across systems",
        "AeroFlight: Advanced flight simulation",
        "AeroOps: Operations management solution",
        "ExecSync: Executive communication platform"
      ]
    },
    {
      icon: <FaCreditCard className="text-4xl mb-4 text-black" />,
      title: "Zero-Risk Payment Model",
      slug: "no-upfront-payment-software",
      description: "Our unique no-payment-until-satisfied model eliminates all financial risk. You only pay when your custom aviation software solution meets all your requirements.",
      features: [
        "Zero upfront costs for development",
        "Pay only after complete satisfaction",
        "Transparent, fixed-price contracts",
        "Full ownership of all code upon completion"
      ]
    },
    {
      icon: <FaServer className="text-4xl mb-4 text-black" />,
      title: "Full-Stack Aviation Technologies",
      slug: "aviation-fullstack-development",
      description: "End-to-end development services covering every aspect of your aviation software project—from concept to deployment and beyond.",
      features: [
        "React & Node.js for aviation dashboards",
        "Cloud architecture for aviation applications",
        "Real-time data processing systems",
        "Secure aviation database structures"
      ]
    },
    {
      icon: <FaHeadset className="text-4xl mb-4 text-black" />,
      title: "Aviation Software Support",
      slug: "aviation-software-maintenance",
      description: "Comprehensive post-launch support and maintenance services ensuring your flight management and aviation operations software continues to deliver optimal performance.",
      features: [
        "24/7 critical aviation systems support",
        "Regular software updates & security patches",
        "Performance optimization for complex operations",
        "Training for flight staff & technical teams"
      ]
    },
    {
      icon: <FaDatabase className="text-4xl mb-4 text-black" />,
      title: "Aviation Data Integration",
      slug: "aviation-data-integration",
      description: "Seamlessly connect your existing aviation systems and data sources to create a unified ecosystem for improved operational efficiency.",
      features: [
        "Integration with major aviation platforms",
        "Flight data analytics implementation",
        "Legacy aviation system modernization",
        "Cross-platform data synchronization"
      ]
    }
  ];

  return (
    <section id="services" className="py-20 bg-white" aria-labelledby="services-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.header 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={0}
        >
          <h2 id="services-heading" className="text-3xl font-bold font-montserrat text-primary mb-4">Aviation Software Development Services</h2>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto">
            Aero Solutions offers specialized aviation software development services with our unique no-payment-until-satisfied guarantee. Our expertise spans flight management systems, aircraft maintenance tracking, and pilot training applications.
          </p>
        </motion.header>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service, index) => (
            <motion.article 
              key={index}
              id={service.slug}
              className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeIn}
              custom={index * 0.2 + 0.5}
            >
              <header>
                <div className="flex justify-center items-center w-16 h-16 bg-primary/10 rounded-full mb-6 mx-auto">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold font-montserrat text-primary mb-3 text-center">{service.title}</h3>
              </header>
              <p className="text-gray-700 mb-6 flex-grow">{service.description}</p>
              <ul className="space-y-3 text-gray-700">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <FaCheck className="text-primary mr-2 mt-1 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
        
        {/* SEO-optimized additional content section */}
        <motion.div
          className="bg-gray-50 rounded-xl p-8 shadow-lg mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={4}
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold font-montserrat text-primary mb-4">Why Choose Our Aviation Software?</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <FaPlane className="text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="block text-gray-800">Built By Pilots For Pilots</strong>
                    <p className="text-gray-700">Our development team includes professional pilots who understand aviation challenges firsthand.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <FaShieldAlt className="text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="block text-gray-800">Zero Financial Risk</strong>
                    <p className="text-gray-700">Our no-payment-until-satisfied model ensures you only pay for results that meet your needs.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <FaDatabase className="text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="block text-gray-800">Aviation-Specific Focus</strong>
                    <p className="text-gray-700">We specialize exclusively in aviation-related software, ensuring deep domain expertise.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold font-montserrat text-primary mb-4">Our Software Development Process</h3>
              <ol className="space-y-3 list-decimal pl-5">
                <li className="text-gray-700">
                  <strong className="text-gray-800">Comprehensive Requirements Analysis</strong> - We work closely with your aviation team to understand operational challenges.
                </li>
                <li className="text-gray-700">
                  <strong className="text-gray-800">Custom Solution Design</strong> - Tailored architecture development specific to aviation needs.
                </li>
                <li className="text-gray-700">
                  <strong className="text-gray-800">Agile Development & Testing</strong> - Iterative implementation with continuous QA in aviation contexts.
                </li>
                <li className="text-gray-700">
                  <strong className="text-gray-800">Deployment & Integration</strong> - Seamless implementation with existing systems and thorough training.
                </li>
                <li className="text-gray-700">
                  <strong className="text-gray-800">Ongoing Support & Evolution</strong> - Continuous improvements based on operational feedback.
                </li>
              </ol>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-12 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={5}
        >
          <a 
            href="#contact" 
            className="inline-block bg-black hover:bg-black/90 text-white font-semibold py-4 px-10 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
            aria-label="Contact us to discuss your aviation software project"
          >
            Start Your Custom Aviation Software Project
          </a>
          <p className="mt-4 text-gray-600">No upfront costs. No risk. Only pay when you're 100% satisfied.</p>
        </motion.div>
        
        {/* Hidden SEO content */}
        <div className="sr-only">
          <h2>Custom Aviation Software Development Services in Miami</h2>
          <p>Specializing in flight management systems, aircraft maintenance tracking software, and pilot training applications with our unique no-payment-until-satisfied model.</p>
          
          <h3>AeroSync Platform Features</h3>
          <p>Real-time aviation data synchronization across multiple systems, ensuring consistent information for flight operations, maintenance tracking, and crew management.</p>
          
          <h3>AeroFlight System Benefits</h3>
          <p>Advanced flight simulation and training software developed by pilots with realistic scenarios for improved proficiency and safety.</p>
          
          <h3>AeroOps Management Tools</h3>
          <p>End-to-end aviation operations management for streamlining flight scheduling, maintenance planning, and regulatory compliance.</p>
          
          <h3>ExecSync Communication Platform</h3>
          <p>Executive productivity and communication tools designed specifically for aviation leadership teams and decision-makers.</p>
        </div>
      </div>
    </section>
  );
}

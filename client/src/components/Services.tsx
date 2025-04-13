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
      title: "Web Development",
      slug: "web-development",
      description: "Custom website solutions built by experienced developers who understand the unique challenges of establishing an effective online presence for small businesses.",
      features: [
        "Responsive website design & development",
        "E-commerce platforms & online stores",
        "Content management systems",
        "Performance optimization & SEO"
      ]
    },
    {
      icon: <FaGlobe className="text-4xl mb-4 text-black" />,
      title: "Proprietary Web Platforms",
      slug: "web-platforms",
      description: "Our suite of specialized web platforms—WebCraft, EcomPro, ContentHub, AnalyticEdge, and AppForge—designed to transform your digital presence.",
      features: [
        "WebCraft: Professional website design",
        "EcomPro: Complete e-commerce solution",
        "ContentHub: Easy content management",
        "AnalyticEdge: Business intelligence tools"
      ]
    },
    {
      icon: <FaCreditCard className="text-4xl mb-4 text-black" />,
      title: "Zero-Risk Payment Model",
      slug: "no-upfront-payment-software",
      description: "Our unique no-payment-until-satisfied model eliminates all financial risk. You only pay when your custom web development solution meets all your requirements.",
      features: [
        "Zero upfront costs for development",
        "Pay only after complete satisfaction",
        "Transparent, fixed-price contracts",
        "Full ownership of all code upon completion"
      ]
    },
    {
      icon: <FaServer className="text-4xl mb-4 text-black" />,
      title: "Full-Stack Web Technologies",
      slug: "fullstack-development",
      description: "End-to-end development services covering every aspect of your web project—from concept to deployment and beyond.",
      features: [
        "React & Node.js for dynamic websites",
        "Cloud architecture for scalable applications",
        "Real-time data processing systems",
        "Secure database design & implementation"
      ]
    },
    {
      icon: <FaHeadset className="text-4xl mb-4 text-black" />,
      title: "Website Support & Maintenance",
      slug: "website-maintenance",
      description: "Comprehensive post-launch support and maintenance services ensuring your website continues to deliver optimal performance and stays up-to-date.",
      features: [
        "24/7 critical website support",
        "Regular updates & security patches",
        "Performance optimization",
        "Training for your team"
      ]
    },
    {
      icon: <FaDatabase className="text-4xl mb-4 text-black" />,
      title: "Web & API Integration",
      slug: "web-api-integration",
      description: "Seamlessly connect your website with third-party services and APIs to create a unified ecosystem for improved business operations.",
      features: [
        "Integration with major business platforms",
        "Website analytics implementation",
        "Legacy system modernization",
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
          <h2 id="services-heading" className="text-3xl font-bold font-montserrat text-primary mb-4">Web Development Services</h2>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto">
            Elevion offers specialized web development services with our unique no-payment-until-satisfied guarantee. Our expertise spans responsive website design, e-commerce platforms, content management systems, and custom web applications.
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
              <h3 className="text-xl font-bold font-montserrat text-primary mb-4">Why Choose Our Web Development Services?</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <FaLaptopCode className="text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="block text-gray-800">Built By Experts For Small Businesses</strong>
                    <p className="text-gray-700">Our development team includes experienced professionals who understand small business needs firsthand.</p>
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
                    <strong className="block text-gray-800">Small Business Focus</strong>
                    <p className="text-gray-700">We specialize in web solutions for small businesses, ensuring relevant expertise for your growth.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold font-montserrat text-primary mb-4">Our Web Development Process</h3>
              <ol className="space-y-3 list-decimal pl-5">
                <li className="text-gray-700">
                  <strong className="text-gray-800">Comprehensive Requirements Analysis</strong> - We work closely with your business team to understand your website goals and audience needs.
                </li>
                <li className="text-gray-700">
                  <strong className="text-gray-800">Custom Solution Design</strong> - Tailored architecture and design development specific to your brand and business requirements.
                </li>
                <li className="text-gray-700">
                  <strong className="text-gray-800">Agile Development & Testing</strong> - Iterative implementation with continuous QA across all devices and browsers.
                </li>
                <li className="text-gray-700">
                  <strong className="text-gray-800">Deployment & Integration</strong> - Seamless implementation with existing systems and thorough training for your team.
                </li>
                <li className="text-gray-700">
                  <strong className="text-gray-800">Ongoing Support & Evolution</strong> - Continuous improvements based on user feedback and business growth.
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
            aria-label="Contact us to discuss your web development project"
          >
            Start Your Custom Web Development Project
          </a>
          <p className="mt-4 text-gray-600">No upfront costs. No risk. Only pay when you're 100% satisfied.</p>
        </motion.div>
        
        {/* Hidden SEO content */}
        <div className="sr-only">
          <h2>Custom Web Development Services for Small Businesses</h2>
          <p>Specializing in responsive website design, e-commerce platforms, content management systems, and custom web applications with our unique no-payment-until-satisfied model.</p>
          
          <h3>WebCraft Platform Features</h3>
          <p>Professional website design and development for small businesses with mobile-responsive layouts, optimized user experience, and SEO best practices.</p>
          
          <h3>EcomPro System Benefits</h3>
          <p>Complete e-commerce solution with secure payment processing, inventory management, and customer relationship management tools.</p>
          
          <h3>ContentHub Management Tools</h3>
          <p>Easy-to-use content management system allowing non-technical users to update website content, publish blog posts, and manage digital assets.</p>
          
          <h3>AnalyticEdge Dashboard Platform</h3>
          <p>Business intelligence dashboard with visitor tracking, performance monitoring, and actionable insights to drive business growth.</p>
        </div>
      </div>
    </section>
  );
}

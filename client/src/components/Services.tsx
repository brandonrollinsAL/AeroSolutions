import { motion } from "framer-motion";
import { FaLaptopCode, FaCreditCard, FaHeadset, FaCheck } from "react-icons/fa";

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
      icon: <FaLaptopCode className="text-4xl mb-4 text-accent" />,
      title: "Full-Stack Development",
      description: "We handle everything—frontend, backend, UI/UX, deployment, and maintenance—so you can focus on your business.",
      features: [
        "Frontend (React.js, Angular, Vue.js)",
        "Backend (Node.js, Python, Java)",
        "Database (MongoDB, SQL, Firebase)",
        "DevOps & CI/CD Implementation"
      ]
    },
    {
      icon: <FaCreditCard className="text-4xl mb-4 text-accent" />,
      title: "Unique Payment Model",
      description: "No upfront deposit. No monthly retainer. You pay only when your project is complete and meets your satisfaction. That's our commitment to quality.",
      features: [
        "Zero upfront costs",
        "Pay only upon completion",
        "Transparent pricing",
        "Satisfaction guarantee"
      ]
    },
    {
      icon: <FaHeadset className="text-4xl mb-4 text-accent" />,
      title: "Post-Launch Support",
      description: "Option to keep us on for ongoing updates and scaling as your business grows and evolves.",
      features: [
        "Maintenance & bug fixes",
        "Feature enhancements",
        "Performance optimization",
        "24/7 emergency support available"
      ]
    }
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={0}
        >
          <h2 className="text-3xl font-bold font-montserrat text-primary mb-4">Our Services</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Comprehensive software development solutions tailored for aviation and technology industries.</p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-10">
          {services.map((service, index) => (
            <motion.div 
              key={index}
              className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeIn}
              custom={index + 1}
            >
              {service.icon}
              <h3 className="text-xl font-bold font-montserrat text-primary mb-3">{service.title}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <ul className="space-y-2 text-gray-600">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <FaCheck className="text-accent mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="mt-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={5}
        >
          <a href="#contact" className="inline-block bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg">
            Discuss Your Project
          </a>
        </motion.div>
      </div>
    </section>
  );
}

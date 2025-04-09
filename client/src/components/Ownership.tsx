import { motion } from "framer-motion";
import { FaCheck, FaCode, FaCopyright, FaFileContract, FaServer } from "react-icons/fa";

export default function Ownership() {
  const fadeIn = {
    hidden: { opacity: 0, y: 40 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.2, duration: 0.6 }
    })
  };

  const benefits = [
    {
      icon: <FaCode />,
      title: "Full Source Code",
      description: "Receive the complete, well-documented source code for your entire platform."
    },
    {
      icon: <FaCopyright />,
      title: "100% Ownership",
      description: "Upon final payment, you own all intellectual property rights with no hidden strings attached."
    },
    {
      icon: <FaFileContract />,
      title: "Legal Rights",
      description: "Full transfer of ownership is documented and legally binding in our contracts."
    },
    {
      icon: <FaServer />,
      title: "Infrastructure Control",
      description: "Control your hosting, domain, and all aspects of deployment and scaling."
    }
  ];

  return (
    <section className="py-20 bg-luxury text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={0}
        >
          <h2 className="text-3xl font-bold font-montserrat mb-6">Full Ownership Guarantee</h2>
          <p className="text-xl text-gray-200">
            We believe your software should truly be yours. When you work with Aero Solutions, 
            you own 100% of the code and all aspects of your platform upon project completion.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeIn}
              custom={index + 1}
            >
              <div className="text-highlight text-3xl mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold font-montserrat mb-3">{benefit.title}</h3>
              <p className="text-gray-300">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="max-w-3xl mx-auto mt-16 bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={5}
        >
          <h3 className="text-xl font-bold font-montserrat mb-4">Our Ownership Promise</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <FaCheck className="text-highlight mt-1 mr-3 flex-shrink-0" />
              <p>No recurring licensing fees or hidden charges for using your own software</p>
            </li>
            <li className="flex items-start">
              <FaCheck className="text-highlight mt-1 mr-3 flex-shrink-0" />
              <p>Freedom to modify, enhance, or resell your platform with no restrictions</p>
            </li>
            <li className="flex items-start">
              <FaCheck className="text-highlight mt-1 mr-3 flex-shrink-0" />
              <p>Complete transfer of all repositories, assets, and documentation</p>
            </li>
            <li className="flex items-start">
              <FaCheck className="text-highlight mt-1 mr-3 flex-shrink-0" />
              <p>Optional ongoing support available, but never mandatory</p>
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
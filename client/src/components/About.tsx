import { motion } from "framer-motion";
import { FaLinkedin, FaTwitter, FaGithub } from "react-icons/fa";

export default function About() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.2, duration: 0.5 }
    })
  };

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            custom={0}
          >
            <img 
              src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1780&q=80" 
              alt="Brandon Rollins - Founder of Aero Solutions" 
              className="rounded-xl shadow-xl w-full max-w-md mx-auto" 
              loading="lazy"
            />
          </motion.div>
          
          <div>
            <motion.h2 
              className="text-3xl font-bold font-montserrat text-primary mb-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
              custom={0.5}
            >
              About Us
            </motion.h2>
            
            <motion.p 
              className="text-gray-600 mb-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
              custom={1}
            >
              Founded by Brandon Rollins, Aero Solutions combines aviation expertise with cutting-edge software development to deliver solutions that soar. Our mission is to empower businesses with technology, from initial concept to final deployment, with the flexibility to retain us post-launch.
            </motion.p>
            
            <motion.div 
              className="bg-gray-50 rounded-xl p-6 shadow-md mb-6 border-l-4 border-accent"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
              custom={1.5}
            >
              <h3 className="text-xl font-bold font-montserrat text-primary mb-2">Meet Our Founder</h3>
              <p className="text-gray-600 mb-4">I'm Brandon Rollins, the founder and lead engineer of Aero Solutions. As a professional pilot and software engineer, I bring a rare blend of real-world aviation experience and technical expertise to every project. I've logged thousands of hours in the cockpit and countless more coding innovative solutions, from flight management systems to enterprise platforms.</p>
              <p className="text-gray-600">My passion is building software that solves real problems, and my commitment is to your satisfaction—our unique no-upfront-payment model proves it.</p>
            </motion.div>
            
            <motion.p 
              className="text-gray-600 mb-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
              custom={2}
            >
              <strong className="font-semibold">Our Address:</strong><br />
              1150 NW 72nd AVE Tower 1 STE 455 #17102, Miami, FL 33126, USA
            </motion.p>
            
            <motion.div 
              className="flex space-x-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
              custom={2.5}
            >
              <a href="#" className="text-primary hover:text-accent transition-colors duration-300">
                <FaLinkedin className="text-2xl" />
              </a>
              <a href="#" className="text-primary hover:text-accent transition-colors duration-300">
                <FaTwitter className="text-2xl" />
              </a>
              <a href="#" className="text-primary hover:text-accent transition-colors duration-300">
                <FaGithub className="text-2xl" />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

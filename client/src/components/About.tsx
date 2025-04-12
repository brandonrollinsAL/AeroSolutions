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
        <div className="flex flex-col gap-8 items-center max-w-5xl mx-auto">
          <motion.h2 
            className="text-4xl font-bold font-poppins text-slate-blue mb-6 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            custom={0.5}
          >
            About Elevion
          </motion.h2>
          
          <motion.p 
            className="text-lato text-slate-blue mb-4 text-lg leading-relaxed"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            custom={1}
          >
            Elevion is a premier full-stack web development company with decades of experience across diverse platforms. Our team of seasoned experts leverages cutting-edge AI technology to empower small businesses, helping them grow, compete, and thrive in a digital-first world.
          </motion.p>
          
          <motion.p 
            className="text-lato text-slate-blue mb-4 text-lg leading-relaxed"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            custom={1.5}
          >
            We've partnered with countless businesses to deliver innovative, reliable solutions that drive measurable results. Our commitment to excellence and client satisfaction has made us a trusted leader in the industry, known for transforming digital challenges into opportunities for success.
          </motion.p>
          
          <motion.p 
            className="text-lato text-slate-blue text-lg leading-relaxed"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            custom={2}
          >
            At Elevion, we believe in elevating your business with technology that's as powerful as it is accessible. Let us help you power your future.
          </motion.p>
          
          <motion.p 
            className="text-slate-blue mt-8 mb-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            custom={2.5}
          >
            <strong className="font-semibold">Our Address:</strong><br />
            123 Web Development Dr, Suite 200, Atlanta, GA 30339, USA
          </motion.p>
          
          <motion.div 
            className="flex space-x-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            custom={3}
          >
            <a href="#" className="text-slate-blue hover:text-electric-cyan transition-colors duration-300">
              <FaLinkedin className="text-3xl" />
            </a>
            <a href="#" className="text-slate-blue hover:text-electric-cyan transition-colors duration-300">
              <FaTwitter className="text-3xl" />
            </a>
            <a href="#" className="text-slate-blue hover:text-electric-cyan transition-colors duration-300">
              <FaGithub className="text-3xl" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

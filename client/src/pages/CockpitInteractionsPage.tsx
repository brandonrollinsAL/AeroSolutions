import { Helmet } from 'react-helmet';
import CockpitControls, { CockpitDial, CockpitSwitch, CockpitButton, CockpitLed } from '@/components/CockpitControls';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function CockpitInteractionsPage() {
  const [throttle, setThrottle] = useState(30);
  const [flaps, setFlaps] = useState(0);
  const [mixture, setMixture] = useState(70);
  const [navLights, setNavLights] = useState(true);
  const [landingLights, setLandingLights] = useState(false);
  const [masterSwitch, setMasterSwitch] = useState(true);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Interactive Cockpit Controls | Aero Solutions</title>
        <meta name="description" content="Experience aviation-inspired interactive controls that demonstrate our attention to detail and understanding of pilot interfaces." />
      </Helmet>
      
      <Header />
      
      <main className="bg-gray-50 dark:bg-gray-900">
        <section className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-center max-w-3xl mx-auto mb-12"
            >
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Interactive Cockpit Controls
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Experience the precision and feel of aviation controls through these interactive elements inspired by real aircraft cockpit interfaces.
              </p>
            </motion.div>
            
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-5xl mx-auto mb-16"
            >
              <CockpitControls />
            </motion.div>
            
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-center max-w-3xl mx-auto my-16"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Build Your Own Controls
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Our components are modular and can be combined to create complex aviation interfaces. Try adjusting these individual controls:
              </p>
            </motion.div>

            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto p-8 bg-gray-800 rounded-lg shadow-xl mb-16"
            >
              <motion.div variants={fadeIn} className="flex justify-center">
                <CockpitDial 
                  label="Throttle" 
                  min={0} 
                  max={100} 
                  value={throttle} 
                  onChange={setThrottle}
                  unit="%"
                />
              </motion.div>
              
              <motion.div variants={fadeIn} className="flex justify-center">
                <CockpitDial 
                  label="Flaps" 
                  min={0} 
                  max={30} 
                  value={flaps} 
                  onChange={setFlaps}
                  unit="°"
                />
              </motion.div>
              
              <motion.div variants={fadeIn} className="flex justify-center">
                <CockpitDial 
                  label="Mixture" 
                  min={0} 
                  max={100} 
                  value={mixture} 
                  onChange={setMixture}
                  unit="%"
                />
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto p-8 bg-gray-800 rounded-lg shadow-xl mb-16"
            >
              <motion.div variants={fadeIn} className="flex justify-center">
                <CockpitSwitch
                  label="NAV Lights"
                  isOn={navLights}
                  onChange={setNavLights}
                />
              </motion.div>
              
              <motion.div variants={fadeIn} className="flex justify-center">
                <CockpitSwitch
                  label="Landing Lights"
                  isOn={landingLights}
                  onChange={setLandingLights}
                />
              </motion.div>
              
              <motion.div variants={fadeIn} className="flex justify-center">
                <CockpitButton
                  label="APU Start"
                  onClick={() => alert("Auxiliary Power Unit started")}
                  color="green"
                />
              </motion.div>
              
              <motion.div variants={fadeIn} className="flex justify-center">
                <CockpitLed
                  label="Master"
                  color="amber"
                  isOn={masterSwitch}
                />
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Why Cockpit-Inspired Design?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                As a company built by pilots, we understand the importance of intuitive interfaces and precise controls. We apply the same principles of aviation control design to our software solutions:
              </p>
              
              <ul className="text-left space-y-4 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">✓</span>
                  <span>Immediate visual feedback for all actions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">✓</span>
                  <span>Tactile, responsive interfaces that minimize cognitive load</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">✓</span>
                  <span>Critical information presented clearly and consistently</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">✓</span>
                  <span>Redundant confirmation for critical actions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">✓</span>
                  <span>Attention-directing alerts based on priority</span>
                </li>
              </ul>
              
              <a 
                href="#contact" 
                className="inline-block bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Discuss Your Aviation Interface
              </a>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
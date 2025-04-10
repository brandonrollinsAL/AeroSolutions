import { useState } from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaLinkedinIn, FaTwitter, FaGithub } from "react-icons/fa";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const errors = [];
    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.email.trim()) errors.push("Email is required");
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }
    if (!formData.message.trim()) errors.push("Message is required");
    
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(". "),
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/contact", formData);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send message");
      }
      
      toast({
        title: "Success",
        description: "Your message has been sent successfully!",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        company: "",
        message: ""
      });
    } catch (error) {
      console.error("Contact form submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const fadeIn = {
    hidden: { opacity: 0, y: 40 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.5 }
    })
  };

  return (
    <section id="contact" className="py-24 bg-gradient-to-b from-white to-gray-50 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-highlight to-transparent opacity-70"></div>
      <div className="absolute hidden md:block top-20 right-10 w-24 h-24 bg-highlight/5 rounded-full blur-3xl"></div>
      <div className="absolute hidden md:block bottom-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={0}
        >
          <div className="inline-block px-4 py-1 bg-highlight/10 border border-highlight/20 rounded-full mb-4">
            <span className="text-accent text-sm font-medium tracking-wider uppercase">Contact Us</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-6 tracking-tight">Let's Discuss Your Project</h2>
          <p className="text-xl text-darkGray max-w-3xl mx-auto leading-relaxed">
            Ready to elevate your aviation operations? Let's collaborate on creating the perfect software solution for your unique challenges.
          </p>
        </motion.div>
        
        <div className="grid lg:grid-cols-5 gap-12 items-stretch">
          <motion.div
            className="lg:col-span-2 flex flex-col justify-between"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
            custom={1}
          >
            <div>
              <motion.div 
                className="space-y-6 mb-10"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeIn}
                custom={1.2}
              >
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-luxury to-primary text-white p-4 rounded-xl shadow-md mr-5 flex items-center justify-center w-14 h-14">
                    <FaMapMarkerAlt className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-primary mb-1">Address</h4>
                    <p className="text-darkGray">1150 NW 72nd AVE Tower 1 STE 455 #17102, Miami, FL 33126, USA</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-luxury to-primary text-white p-4 rounded-xl shadow-md mr-5 flex items-center justify-center w-14 h-14">
                    <FaEnvelope className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-primary mb-1">Email</h4>
                    <p className="text-darkGray">info@aerosolutions.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-luxury to-primary text-white p-4 rounded-xl shadow-md mr-5 flex items-center justify-center w-14 h-14">
                    <FaPhoneAlt className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-primary mb-1">Phone</h4>
                    <p className="text-darkGray">+1-305-555-1234</p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              className="mt-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeIn}
              custom={1.8}
            >
              <p className="text-darkGray mb-4 font-medium">Connect With Us</p>
              <div className="flex space-x-3">
                <a 
                  href="#" 
                  className="bg-luxury hover:bg-highlight text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 shadow-sm hover:shadow-md"
                  aria-label="LinkedIn"
                >
                  <FaLinkedinIn />
                </a>
                <a 
                  href="#" 
                  className="bg-luxury hover:bg-highlight text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 shadow-sm hover:shadow-md"
                  aria-label="Twitter"
                >
                  <FaTwitter />
                </a>
                <a 
                  href="#" 
                  className="bg-luxury hover:bg-highlight text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 shadow-sm hover:shadow-md"
                  aria-label="GitHub"
                >
                  <FaGithub />
                </a>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div
            className="lg:col-span-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
            custom={1.5}
          >
            <form 
              onSubmit={handleSubmit} 
              className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.05)] p-8 md:p-10 border border-gray-100 relative overflow-hidden"
            >
              {/* Decorative accent */}
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-highlight via-primary to-luxury"></div>
              
              <h3 className="text-2xl font-bold font-serif text-primary mb-6">Send Us a Message</h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-darkGray mb-2">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-highlight focus:border-highlight outline-none transition-all bg-gray-50/50" 
                    placeholder="Your name" 
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-darkGray mb-2">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-highlight focus:border-highlight outline-none transition-all bg-gray-50/50" 
                    placeholder="your.email@example.com" 
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="company" className="block text-sm font-medium text-darkGray mb-2">Company Name</label>
                <input 
                  type="text" 
                  id="company" 
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-highlight focus:border-highlight outline-none transition-all bg-gray-50/50" 
                  placeholder="Your company name" 
                />
              </div>
              
              <div className="mb-8">
                <label htmlFor="message" className="block text-sm font-medium text-darkGray mb-2">Project Details</label>
                <textarea 
                  id="message" 
                  rows={5} 
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-highlight focus:border-highlight outline-none transition-all bg-gray-50/50" 
                  placeholder="Tell us about your aviation software needs..."
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-luxury to-primary hover:from-primary hover:to-luxury text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 hover:shadow-[0_10px_20px_rgba(15,35,101,0.2)] disabled:opacity-70 disabled:hover:shadow-none"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                By submitting this form, you agree to our privacy policy and terms of service.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { FaQuoteLeft } from "react-icons/fa";
import { Testimonial } from "@/lib/types";

export default function Testimonials() {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      text: "Aero Solutions transformed our operations with AeroFlight—truly game-changing! Their no-upfront payment model made the decision easy, and the results exceeded our expectations.",
      name: "Sarah Thompson",
      title: "CEO, SkyHigh Airlines",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=1922&q=80"
    },
    {
      id: 2,
      text: "The team at Aero Solutions delivered exactly what we needed with ExecSync. As a private jet charter, we needed a system that could handle complex scheduling, and they nailed it.",
      name: "Michael Rodriguez",
      title: "Operations Director, Elite Air Charter",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80"
    },
    {
      id: 3,
      text: "The AeroOps platform revolutionized how we track and manage our maintenance operations. The aviation-specific features show that Aero Solutions truly understands our industry's unique challenges.",
      name: "Jennifer Lee",
      title: "CTO, Global Aviation Maintenance",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80"
    }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 40 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.5 }
    })
  };

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute left-0 top-0 w-64 h-64 bg-highlight/5 rounded-full filter blur-3xl opacity-70 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute right-0 bottom-0 w-80 h-80 bg-primary/5 rounded-full filter blur-3xl opacity-70 translate-x-1/3 translate-y-1/3"></div>
      
      {/* Decorative quote icon */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-highlight/5 opacity-20" style={{ fontSize: '25rem' }}>
        <FaQuoteLeft />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={0}
        >
          <div className="inline-block px-4 py-1 bg-highlight/10 border border-highlight/20 rounded-full mb-4">
            <span className="text-accent text-sm font-medium tracking-wider uppercase">Testimonials</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-6 tracking-tight">What Our Clients Say</h2>
          <p className="text-xl text-darkGray max-w-3xl mx-auto leading-relaxed">
            Hear from aviation industry leaders who have transformed their operations with our software solutions.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-10">
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={testimonial.id}
              className="bg-white rounded-2xl p-8 shadow-[0_15px_35px_rgba(0,0,0,0.05)] relative border border-gray-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeIn}
              custom={index + 1}
            >
              {/* Decorative accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-highlight via-primary to-luxury rounded-t-2xl"></div>
              
              <div className="text-highlight text-4xl mb-6">
                <FaQuoteLeft />
              </div>
              
              <p className="text-darkGray text-lg leading-relaxed mb-8 flex-grow">{testimonial.text}</p>
              
              <div className="flex items-center mt-4 pt-6 border-t border-gray-100">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-highlight/20 shadow-md mr-4 flex-shrink-0">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/avatar-placeholder.jpeg"; // Fallback image
                    }}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-primary">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600 font-medium">{testimonial.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Call to action */}
        <motion.div 
          className="mt-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={4}
        >
          <a 
            href="#contact" 
            className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 text-primary font-semibold rounded-lg shadow-sm hover:bg-gray-50 hover:border-highlight/30 transition-all duration-300 hover:shadow-md"
          >
            <span>Read More Success Stories</span>
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

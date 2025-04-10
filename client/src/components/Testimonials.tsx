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
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={0}
        >
          <h2 className="text-3xl font-bold font-montserrat text-primary mb-4">What Our Clients Say</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Hear from businesses that have transformed their operations with our aviation software solutions.</p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={testimonial.id}
              className="bg-white rounded-xl p-8 shadow-lg relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeIn}
              custom={index + 1}
            >
              <div className="text-accent text-5xl absolute -top-5 -left-2 opacity-20">
                <FaQuoteLeft />
              </div>
              <p className="text-gray-600 mb-6 relative z-10">{testimonial.text}</p>
              <div className="flex items-center">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full object-cover mr-4" 
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/avatar-placeholder.jpeg"; // Fallback image
                  }}
                />
                <div>
                  <h4 className="font-bold text-primary">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

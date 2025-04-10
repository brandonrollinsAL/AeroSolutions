import { FaEnvelope, FaPhoneAlt, FaLinkedinIn, FaTwitter, FaGithub, FaInstagram } from "react-icons/fa";
import AeroLogo from "./AeroLogo";

export default function Footer() {
  const quickLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "Platforms", href: "#platforms" },
    { name: "About Us", href: "#about" },
    { name: "Blog", href: "#blog" },
    { name: "Contact", href: "#contact" }
  ];
  
  const platforms = [
    { name: "AeroSync", href: "#" },
    { name: "AeroFlight", href: "#" },
    { name: "ExecSync", href: "#" },
    { name: "SkyForge Legend", href: "#" },
    { name: "Stitchlet", href: "#" },
    { name: "AeroOps", href: "#" }
  ];

  return (
    <footer className="bg-gradient-to-b from-luxury to-black text-white pt-20 pb-8 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-highlight to-transparent"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-highlight/20"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('/images/grid-pattern.png')] bg-repeat opacity-5"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-10 mb-16">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <AeroLogo size="md" animated={false} />
              <span className="text-2xl font-bold font-serif text-white tracking-tight">Aero Solutions</span>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              Elevating aviation software to new heights with custom technology solutions designed by pilots for the unique challenges of the industry.
            </p>
            
            <div className="flex items-start space-x-2 text-sm text-gray-400">
              <div className="mt-1 text-highlight"><FaPhoneAlt /></div>
              <p>1150 NW 72nd AVE Tower 1 STE 455 #17102, Miami, FL 33126, USA</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-bold font-serif text-highlight mb-6 tracking-wide">Quick Links</h4>
            <ul className="space-y-4">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href} 
                    className="text-gray-300 hover:text-highlight transition-colors duration-300 flex items-center"
                  >
                    <span className="mr-2">→</span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold font-serif text-highlight mb-6 tracking-wide">Our Platforms</h4>
            <ul className="space-y-4">
              {platforms.map((platform, index) => (
                <li key={index}>
                  <a 
                    href={platform.href} 
                    className="text-gray-300 hover:text-highlight transition-colors duration-300 flex items-center"
                  >
                    <span className="mr-2">→</span>
                    {platform.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold font-serif text-highlight mb-6 tracking-wide">Contact Us</h4>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <div className="bg-highlight/10 p-2 rounded-lg mr-3 flex items-center justify-center">
                  <FaEnvelope className="text-highlight" />
                </div>
                <a 
                  href="mailto:info@aerosolutions.com" 
                  className="text-gray-300 hover:text-highlight transition-colors duration-300"
                >
                  info@aerosolutions.com
                </a>
              </li>
              <li className="flex items-center">
                <div className="bg-highlight/10 p-2 rounded-lg mr-3 flex items-center justify-center">
                  <FaPhoneAlt className="text-highlight" />
                </div>
                <a 
                  href="tel:+13055551234" 
                  className="text-gray-300 hover:text-highlight transition-colors duration-300"
                >
                  +1-305-555-1234
                </a>
              </li>
            </ul>
            
            <div className="flex space-x-3">
              <a 
                href="#" 
                className="w-10 h-10 bg-highlight/10 hover:bg-highlight/20 text-highlight rounded-lg flex items-center justify-center transition-all duration-300 border border-highlight/20 hover:border-highlight/50"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-highlight/10 hover:bg-highlight/20 text-highlight rounded-lg flex items-center justify-center transition-all duration-300 border border-highlight/20 hover:border-highlight/50"
                aria-label="Twitter"
              >
                <FaTwitter />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-highlight/10 hover:bg-highlight/20 text-highlight rounded-lg flex items-center justify-center transition-all duration-300 border border-highlight/20 hover:border-highlight/50"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-highlight/10 hover:bg-highlight/20 text-highlight rounded-lg flex items-center justify-center transition-all duration-300 border border-highlight/20 hover:border-highlight/50"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-highlight/40 to-transparent mx-4 hidden md:block"></div>
              <p className="text-gray-400">&copy; {new Date().getFullYear()} Aero Solutions. All rights reserved.</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-8">
              <a href="#" className="text-gray-400 hover:text-highlight transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-highlight transition-colors duration-300">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-highlight transition-colors duration-300">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

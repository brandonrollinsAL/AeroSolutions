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
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <AeroLogo size="md" animated={false} />
              <span className="text-xl font-bold font-montserrat">Aero Solutions</span>
            </div>
            <p className="text-gray-400 mb-6">Elevating your software to new heights with custom aviation and technology solutions.</p>
            <p className="text-gray-400">
              1150 NW 72nd AVE Tower 1 STE 455 #17102, Miami, FL 33126, USA
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold font-montserrat mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-gray-400 hover:text-accent transition-colors duration-300">{link.name}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold font-montserrat mb-6">Our Platforms</h4>
            <ul className="space-y-3">
              {platforms.map((platform, index) => (
                <li key={index}>
                  <a href={platform.href} className="text-gray-400 hover:text-accent transition-colors duration-300">{platform.name}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold font-montserrat mb-6">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center">
                <FaEnvelope className="text-accent mr-3" />
                <a href="mailto:info@aerosolutions.com" className="text-gray-400 hover:text-accent transition-colors duration-300">info@aerosolutions.com</a>
              </li>
              <li className="flex items-center">
                <FaPhoneAlt className="text-accent mr-3" />
                <a href="tel:+13055551234" className="text-gray-400 hover:text-accent transition-colors duration-300">+1-305-555-1234</a>
              </li>
            </ul>
            
            <div className="mt-6 flex space-x-4">
              <a href="#" className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors duration-300">
                <FaLinkedinIn />
              </a>
              <a href="#" className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors duration-300">
                <FaTwitter />
              </a>
              <a href="#" className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors duration-300">
                <FaGithub />
              </a>
              <a href="#" className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors duration-300">
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500">&copy; {new Date().getFullYear()} Aero Solutions. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-gray-400 transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-gray-400 transition-colors duration-300">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { FaBars, FaTimes } from "react-icons/fa";
import ClientPreviewModal from "./ClientPreviewModal";
import AeroLogo from "./AeroLogo";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clientPreviewOpen, setClientPreviewOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleClientPreview = () => {
    setClientPreviewOpen(!clientPreviewOpen);
  };

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "Platforms", href: "#platforms" },
    { name: "About Us", href: "#about" },
    { name: "Blog", href: "#blog" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-sm shadow-md transition-all duration-300 ${
          isScrolled ? "py-2" : "py-4"
        }`}
        id="header"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <a 
              href="#home" 
              className="flex items-center space-x-2"
            >
              <AeroLogo size="md" animated={true} />
              <span className="text-xl font-bold font-montserrat text-primary">
                Aero Solutions
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 hover:text-black hover:scale-110 transition-all duration-300 hover:underline decoration-luxury font-medium"
                >
                  {link.name}
                </a>
              ))}
              <button
                onClick={toggleClientPreview}
                className="px-4 py-2 bg-luxury text-white rounded-lg hover:bg-luxury/90 hover:scale-105 transition-all duration-300 font-semibold"
              >
                Client Preview
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-gray-700 focus:outline-none"
            >
              <FaBars className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden bg-white border-t border-gray-200 ${
            mobileMenuOpen ? "" : "hidden"
          }`}
        >
          <div className="container mx-auto px-4 py-3 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block text-gray-700 hover:text-black py-2 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                toggleClientPreview();
              }}
              className="block bg-luxury text-white py-2 px-4 rounded-lg font-semibold w-full text-center mt-2"
            >
              Client Preview
            </button>
          </div>
        </div>
      </header>

      <ClientPreviewModal 
        isOpen={clientPreviewOpen} 
        onClose={() => setClientPreviewOpen(false)} 
      />
    </>
  );
}

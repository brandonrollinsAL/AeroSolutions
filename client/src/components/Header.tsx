import { useState } from 'react';  
import { Link } from 'wouter';  
import { Menu, X, ChevronDown } from 'lucide-react';  
import ClientPreviewModal from "./ClientPreviewModal";
import ElevionLogo from "./ElevionLogo";

export default function Header() {  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);  
  const [isSolutionsDropdownOpen, setIsSolutionsDropdownOpen] = useState(false);  
  const [isSupportDropdownOpen, setIsSupportDropdownOpen] = useState(false);  
  const [clientPreviewOpen, setClientPreviewOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);  
  const toggleSolutionsDropdown = () => setIsSolutionsDropdownOpen(!isSolutionsDropdownOpen);  
  const toggleSupportDropdown = () => setIsSupportDropdownOpen(!isSupportDropdownOpen);  
  const toggleClientPreview = () => setClientPreviewOpen(!clientPreviewOpen);

  const menuItems = [  
    { label: 'Home', path: '/' },  
    {  
      label: 'Solutions',  
      dropdown: [  
        { label: 'AI Web Development', path: '/web-development' },  
        { label: 'Small Business Growth', path: '/growth-solutions' },  
        { label: 'Competitive Analysis', path: '/competitive-analysis' },
        { label: 'Particle Background', path: '/particle-background' },
      ],  
    },  
    { label: 'Pricing', path: '/pricing' },  
    {  
      label: 'Support',  
      dropdown: [  
        { label: 'Get Started', path: '/get-started' },  
        { label: 'Resources', path: '/resources' },  
        { label: 'Contact Us', path: '/contact' },  
        { label: 'Share Feedback', path: '/feedback' },  
      ],  
    },  
    { label: 'About', path: '/about' },  
  ];  

  return (  
    <>
      <header className="bg-slate-blue text-white py-4 px-6 sticky top-0 z-50 shadow-md">  
        <div className="max-w-7xl mx-auto flex justify-between items-center">  
          {/* Logo */}  
          <Link href="/">  
            <div className="flex items-center space-x-2">
              <ElevionLogo size="sm" animated={true} />
              <div className="text-2xl font-poppins text-electric-cyan">elevion</div>  
            </div>
          </Link>  

          {/* Desktop Menu */}  
          <nav className="hidden md:flex space-x-8 items-center">  
            {menuItems.map((item) => (  
              <div key={item.label} className="relative">  
                {item.dropdown ? (  
                  <button  
                    onClick={item.label === 'Solutions' ? toggleSolutionsDropdown : toggleSupportDropdown}  
                    className="font-inter text-sm uppercase tracking-wide text-light-gray hover:text-sunset-orange flex items-center transition-colors duration-200"  
                  >  
                    {item.label}  
                    <ChevronDown className="ml-1 w-4 h-4" />  
                  </button>  
                ) : (  
                  <Link  
                    href={item.path}  
                    className="font-inter text-sm uppercase tracking-wide text-light-gray hover:text-sunset-orange transition-colors duration-200"  
                  >  
                    {item.label}  
                  </Link>  
                )}  
                {item.dropdown && (item.label === 'Solutions' ? isSolutionsDropdownOpen : isSupportDropdownOpen) && (  
                  <div className="absolute top-full left-0 mt-2 w-48 bg-light-gray rounded-lg shadow-lg z-10">  
                    {item.dropdown.map((subItem) => (  
                      <Link  
                        key={subItem.label}  
                        href={subItem.path}  
                        className="block px-4 py-2 text-slate-blue hover:bg-electric-cyan hover:text-white transition-colors duration-200"  
                      >  
                        {subItem.label}  
                      </Link>  
                    ))}  
                  </div>  
                )}  
              </div>  
            ))}  
            <button
              onClick={toggleClientPreview}
              className="font-inter text-sm uppercase tracking-wide text-electric-cyan hover:text-sunset-orange transition-colors duration-200 border border-electric-cyan px-3 py-1 rounded-md hover:border-sunset-orange"
            >
              Client Preview
            </button>
            <Link  
              href="/login"  
              className="font-inter text-sm uppercase tracking-wide text-sunset-orange hover:text-electric-cyan transition-colors duration-200"  
            >  
              Login  
            </Link>  
          </nav>  

          {/* Mobile Menu Toggle */}  
          <button  
            className="md:hidden text-light-gray focus:outline-none"  
            onClick={toggleMobileMenu}  
          >  
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}  
          </button>  
        </div>  

        {/* Mobile Menu */}  
        {isMobileMenuOpen && (  
          <nav className="md:hidden bg-slate-blue py-4">  
            <div className="flex flex-col space-y-4 px-6">  
              {menuItems.map((item) => (  
                <div key={item.label}>  
                  {item.dropdown ? (  
                    <div>  
                      <button  
                        onClick={item.label === 'Solutions' ? toggleSolutionsDropdown : toggleSupportDropdown}  
                        className="font-inter text-sm uppercase tracking-wide text-light-gray flex items-center"  
                      >  
                        {item.label}  
                        <ChevronDown className="ml-1 w-4 h-4" />  
                      </button>  
                      {(item.label === 'Solutions' ? isSolutionsDropdownOpen : isSupportDropdownOpen) && (  
                        <div className="pl-4 mt-2 space-y-2">  
                          {item.dropdown.map((subItem) => (  
                            <Link  
                              key={subItem.label}  
                              href={subItem.path}  
                              onClick={toggleMobileMenu}  
                              className="block text-light-gray hover:text-sunset-orange"  
                            >  
                              {subItem.label}  
                            </Link>  
                          ))}  
                        </div>  
                      )}  
                    </div>  
                  ) : (  
                    <Link  
                      href={item.path}  
                      onClick={toggleMobileMenu}  
                      className="font-inter text-sm uppercase tracking-wide text-light-gray hover:text-sunset-orange"  
                    >  
                      {item.label}  
                    </Link>  
                  )}  
                </div>  
              ))}
              <button
                onClick={() => {
                  toggleMobileMenu();
                  toggleClientPreview();
                }}
                className="font-inter text-sm uppercase tracking-wide text-electric-cyan hover:text-sunset-orange border border-electric-cyan px-3 py-1 rounded-md hover:border-sunset-orange"
              >
                Client Preview
              </button>
              <Link  
                href="/login"  
                onClick={toggleMobileMenu}  
                className="font-inter text-sm uppercase tracking-wide text-sunset-orange hover:text-electric-cyan"  
              >  
                Login  
              </Link>  
            </div>  
          </nav>  
        )}  
      </header>  

      <ClientPreviewModal 
        isOpen={clientPreviewOpen} 
        onClose={() => setClientPreviewOpen(false)} 
      />
    </>
  );  
}

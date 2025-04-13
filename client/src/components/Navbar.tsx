import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Menu, X, ChevronDown, User, LogOut, Star, History, Globe, Shield, Users } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import ClientPreviewModal from './ClientPreviewModal';
import ElevionLogo from './ElevionLogo';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { t } = useTranslation();
  const [clientPreviewOpen, setClientPreviewOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('token');
  
  // Check if user is admin
  const isAdmin = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      // Simple JWT check - in a real app this should be more secure
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return false;
      
      const payload = JSON.parse(atob(tokenParts[1]));
      return payload.role === 'admin';
    } catch (e) {
      return false;
    }
  };
  
  // Detect scroll for header effects
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
  
  // Open client preview modal
  const handleClientPreview = () => {
    setClientPreviewOpen(true);
  };
  
  const routes = [
    { path: '/', label: 'Home' },
    { path: '/services', label: 'Services' },
    { path: '/platforms', label: 'Platforms' },
    { path: '/marketplace', label: 'Marketplace' },
    { path: '/subscriptions', label: 'Subscriptions' },
    { path: '/premium', label: 'Premium' },
    { path: '/history', label: 'Our History' },
    { path: '/contact', label: 'Contact' },
  ];
  
  const platformLinks = [
    { name: 'WebCraft', path: '/platforms/webcraft', description: 'Professional website design and development' },
    { name: 'EcomPro', path: '/platforms/ecompro', description: 'E-commerce solutions for small businesses' },
    { name: 'ContentHub', path: '/platforms/contenthub', description: 'Content management systems and marketing' },
    { name: 'AnalyticEdge', path: '/platforms/analyticedge', description: 'Data analytics and business intelligence' },
    { name: 'AppForge', path: '/platforms/appforge', description: 'Mobile app development solutions' },
  ];

  return (
    <>
      <header className={`sticky top-0 z-40 w-full border-b transition-all duration-200 ${
        headerScrolled ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md' : 'bg-background'
      }`}>
        <div className="container flex h-16 items-center px-4">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-3">
              <ElevionLogo size="md" animated={true} />
              <motion.span 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: 0.2 }}
                className="hidden sm:inline-block font-bold text-xl bg-gradient-to-r from-slate-blue to-electric-cyan bg-clip-text text-transparent font-poppins"
              >
                Elevion
              </motion.span>
            </Link>
          </div>

          {/* Mobile Navigation Toggle */}
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {isOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/">
                    <NavigationMenuLink 
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                        location === '/' ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      Home
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/services">
                    <NavigationMenuLink 
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                        location === '/services' ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      Services
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger 
                    className={`group h-10 px-4 py-2 text-sm font-medium ${
                      location.startsWith('/platforms') ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    Platforms
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {platformLinks.map((platform) => (
                        <li key={platform.path}>
                          <Link href={platform.path}>
                            <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                              <div className="text-sm font-medium leading-none">{platform.name}</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {platform.description}
                              </p>
                            </NavigationMenuLink>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/marketplace">
                    <NavigationMenuLink 
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                        location === '/marketplace' ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      Marketplace
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/subscriptions">
                    <NavigationMenuLink 
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                        location === '/subscriptions' ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      Subscriptions
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/premium">
                    <NavigationMenuLink 
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                        location === '/premium' ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      <Star className="w-4 h-4 mr-1" />
                      {t('nav_premium')}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/history">
                    <NavigationMenuLink 
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                        location === '/history' ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      <History className="w-4 h-4 mr-1" />
                      {t('nav_history')}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/contact">
                    <NavigationMenuLink 
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                        location === '/contact' ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      Contact
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              
              <Button 
                variant="outline" 
                size="sm" 
                className="border-electric-cyan hover:border-slate-blue bg-light-gray hover:bg-slate-100 text-slate-blue"
                onClick={handleClientPreview}
              >
                <Users className="h-4 w-4 mr-1" />
                Client Preview
              </Button>
              
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 px-3 rounded-full flex items-center gap-2 bg-slate-100 hover:bg-slate-200">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {isAdmin() && (
                      <>
                        <DropdownMenuItem>
                          <Link href="/admin" className="w-full flex items-center">
                            <Shield className="mr-2 h-4 w-4 text-blue-600" />
                            <span className="font-medium">Admin Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href="/admin/client-previews" className="w-full flex items-center">
                            <Users className="mr-2 h-4 w-4 text-blue-600" />
                            <span>Manage Client Previews</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href="/website-analytics" className="w-full flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 h-4 w-4 text-blue-600" viewBox="0 0 16 16">
                              <path d="M4.5 11a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z"/>
                              <path d="M8 3.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z"/>
                            </svg>
                            <span>Website Analytics</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem>
                      <Link href="/account" className="w-full">My Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/account/orders" className="w-full">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/account/subscriptions" className="w-full">My Subscriptions</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isOpen && (
            <div className="absolute top-16 inset-x-0 z-10 h-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2">
                {routes.map((route) => (
                  <Link 
                    key={route.path} 
                    href={route.path}
                    className={`block rounded-md px-3 py-2 text-base font-medium ${
                      location === route.path 
                        ? 'bg-accent text-accent-foreground' 
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {route.label}
                  </Link>
                ))}
                
                <button
                  className="w-full text-left block rounded-md px-3 py-2 text-base font-medium bg-light-gray text-slate-blue hover:bg-slate-100 mt-2"
                  onClick={() => {
                    setIsOpen(false);
                    handleClientPreview();
                  }}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  Client Preview
                </button>
                
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">{t('language')}</span>
                      </div>
                      <LanguageSwitcher />
                    </div>
                    
                    <div className="px-4 flex items-center">
                      {isLoggedIn ? (
                        <>
                          <div className="ml-3">
                            <div className="text-base font-medium">Account</div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col space-y-2 w-full">
                          <Button asChild>
                            <Link href="/login">Login</Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link href="/signup">Sign Up</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {isLoggedIn && (
                    <div className="mt-3 space-y-1 px-2">
                      {isAdmin() && (
                        <>
                          <Link
                            href="/admin"
                            className="block rounded-md px-3 py-2 text-base font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                            onClick={() => setIsOpen(false)}
                          >
                            <Shield className="h-4 w-4 inline mr-2" />
                            Admin Dashboard
                          </Link>
                          <Link
                            href="/admin/client-previews"
                            className="block rounded-md px-3 py-2 text-base font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                            onClick={() => setIsOpen(false)}
                          >
                            <Users className="h-4 w-4 inline mr-2" />
                            Manage Client Previews
                          </Link>
                          <Link
                            href="/website-analytics"
                            className="block rounded-md px-3 py-2 text-base font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                            onClick={() => setIsOpen(false)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="h-4 w-4 inline mr-2" viewBox="0 0 16 16">
                              <path d="M4.5 11a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z"/>
                              <path d="M8 3.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z"/>
                            </svg>
                            Website Analytics
                          </Link>
                        </>
                      )}
                      <Link
                        href="/account"
                        className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setIsOpen(false)}
                      >
                        My Account
                      </Link>
                      <Link
                        href="/account/orders"
                        className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setIsOpen(false)}
                      >
                        My Orders
                      </Link>
                      <Link
                        href="/account/subscriptions"
                        className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setIsOpen(false)}
                      >
                        My Subscriptions
                      </Link>
                      <button
                        className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-red-500 hover:bg-accent"
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 inline mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Client Preview Modal */}
      <ClientPreviewModal 
        isOpen={clientPreviewOpen} 
        onClose={() => setClientPreviewOpen(false)} 
      />
    </>
  );
};

export default Navbar;
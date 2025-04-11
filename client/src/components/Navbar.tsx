import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
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
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('token');
  
  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };
  
  const routes = [
    { path: '/', label: 'Home' },
    { path: '/services', label: 'Services' },
    { path: '/platforms', label: 'Platforms' },
    { path: '/marketplace', label: 'Marketplace' },
    { path: '/subscriptions', label: 'Subscriptions' },
    { path: '/contact', label: 'Contact' },
  ];
  
  const platformLinks = [
    { name: 'AeroSync', path: '/platforms/aerosync', description: 'Flight data synchronization platform' },
    { name: 'AeroOps', path: '/platforms/aeroops', description: 'Aviation operations management system' },
    { name: 'AeroFlight', path: '/platforms/aeroflight', description: 'Flight planning and optimization' },
    { name: 'ExecSync', path: '/platforms/execsync', description: 'Executive aviation management' },
    { name: 'AeroLink', path: '/platforms/aerolink', description: 'Connectivity solutions for aviation' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="hidden sm:inline-block font-bold text-xl">Aero Solutions</span>
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
          
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
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
              
              <div className="pt-4 pb-3 border-t border-gray-200">
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
                {isLoggedIn && (
                  <div className="mt-3 space-y-1 px-2">
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
  );
};

export default Navbar;
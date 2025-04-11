import React from 'react';
import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-background border-t">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h2 className="text-lg font-semibold text-primary mb-4">Aero Solutions</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Providing cutting-edge aviation technology solutions since 2018. Innovation in flight, excellence in service.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-primary mb-4">Platforms</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/platforms/aerosync" className="text-muted-foreground hover:text-primary transition-colors">
                  AeroSync
                </Link>
              </li>
              <li>
                <Link href="/platforms/aeroops" className="text-muted-foreground hover:text-primary transition-colors">
                  AeroOps
                </Link>
              </li>
              <li>
                <Link href="/platforms/aeroflight" className="text-muted-foreground hover:text-primary transition-colors">
                  AeroFlight
                </Link>
              </li>
              <li>
                <Link href="/platforms/execsync" className="text-muted-foreground hover:text-primary transition-colors">
                  ExecSync
                </Link>
              </li>
              <li>
                <Link href="/platforms/aerolink" className="text-muted-foreground hover:text-primary transition-colors">
                  AeroLink
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-primary mb-4">Quick Links</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/subscriptions" className="text-muted-foreground hover:text-primary transition-colors">
                  Subscriptions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-primary mb-4">Contact Us</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-muted-foreground mr-2 shrink-0" />
                <span className="text-muted-foreground">
                  123 Aviation Way, Suite 450<br />Charlotte, NC 28202
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-muted-foreground mr-2" />
                <a href="tel:+13035550122" className="text-muted-foreground hover:text-primary transition-colors">
                  (303) 555-0122
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-muted-foreground mr-2" />
                <a href="mailto:info@aerosolutions.dev" className="text-muted-foreground hover:text-primary transition-colors">
                  info@aerosolutions.dev
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Aero Solutions. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/security" className="hover:text-primary transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
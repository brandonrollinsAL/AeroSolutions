import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import ElevionLogo from './ElevionLogo';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube, FaGithub, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#3B5B9D] text-white pt-16 border-t border-[#00D1D1]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ElevionLogo size="md" />
              <span className="text-xl font-bold bg-gradient-to-r from-electric-cyan to-light-gray bg-clip-text text-transparent">
                Elevion
              </span>
            </div>
            <p className="text-gray-300 max-w-xs">
              {t('footer_tagline')}
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-[#FF7043] transition-colors">
                <FaFacebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-400 hover:text-[#FF7043] transition-colors">
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-[#FF7043] transition-colors">
                <FaLinkedin className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-[#FF7043] transition-colors">
                <FaInstagram className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-400 hover:text-[#FF7043] transition-colors">
                <FaYoutube className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-400 hover:text-[#FF7043] transition-colors">
                <FaGithub className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#00D1D1]">{t('navigation')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-[#FF7043] transition-colors">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-300 hover:text-[#FF7043] transition-colors">
                  {t('services')}
                </Link>
              </li>
              <li>
                <Link href="/platforms" className="text-gray-300 hover:text-[#FF7043] transition-colors">
                  {t('platforms')}
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-gray-300 hover:text-[#FF7043] transition-colors">
                  {t('marketplace')}
                </Link>
              </li>
              <li>
                <Link href="/subscriptions" className="text-gray-300 hover:text-[#FF7043] transition-colors">
                  {t('subscriptions')}
                </Link>
              </li>
              <li>
                <Link href="/premium" className="text-gray-300 hover:text-[#FF7043] transition-colors">
                  {t('premium')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#00D1D1]">{t('legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-[#FF7043] transition-colors">
                  {t('terms_of_service')}
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-300 hover:text-[#FF7043] transition-colors">
                  {t('privacy_policy')}
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-gray-300 hover:text-[#FF7043] transition-colors">
                  {t('security_policy')}
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-300 hover:text-[#FF7043] transition-colors">
                  {t('login')}
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => window.open('/client-preview/demo', '_blank')}
                  className="text-gray-300 hover:text-[#FF7043] transition-colors"
                >
                  Client Demo
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('openTechAssistant'))}
                  className="text-gray-300 hover:text-[#FF7043] transition-colors"
                >
                  Tech Assistant
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#00D1D1]">{t('contact_us')}</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <FaMapMarkerAlt className="h-5 w-5 text-[#00D1D1] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-300">
                  123 Web Development Dr, Suite 200<br />
                  Atlanta, GA 30339
                </span>
              </li>
              <li className="flex items-center">
                <FaPhoneAlt className="h-4 w-4 text-[#00D1D1] mr-2 flex-shrink-0" />
                <span className="text-gray-300">+1 (800) 555-ELEV</span>
              </li>
              <li className="flex items-center">
                <FaEnvelope className="h-4 w-4 text-[#00D1D1] mr-2 flex-shrink-0" />
                <span className="text-gray-300">info@elevion.dev</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-[#00D1D1]/30 py-6 text-sm text-gray-400 flex flex-col md:flex-row justify-between items-center">
          <div>
            &copy; {new Date().getFullYear()} Elevion. {t('all_rights_reserved')}
          </div>
          <div className="mt-4 md:mt-0">
            <span className="mr-4">FAQ</span>
            <span className="mr-4">Support</span>
            <Link href="/history" className="text-gray-400 hover:text-[#FF7043] transition-colors mr-4">
              {t('our_history')}
            </Link>
            <Link href="/design-tools" className="text-gray-400 hover:text-[#FF7043] transition-colors">
              Particle Generator
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
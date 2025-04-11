import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import AeroLogo from './AeroLogo';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube, FaGithub, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white pt-16 border-t border-blue-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AeroLogo size="md" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
                Aero Solutions
              </span>
            </div>
            <p className="text-gray-300 max-w-xs">
              {t('footer_tagline')}
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaFacebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaLinkedin className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaInstagram className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaYoutube className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaGithub className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">{t('navigation')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-300 hover:text-white transition-colors">
                  {t('services')}
                </Link>
              </li>
              <li>
                <Link href="/platforms" className="text-gray-300 hover:text-white transition-colors">
                  {t('platforms')}
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors">
                  {t('marketplace')}
                </Link>
              </li>
              <li>
                <Link href="/subscriptions" className="text-gray-300 hover:text-white transition-colors">
                  {t('subscriptions')}
                </Link>
              </li>
              <li>
                <Link href="/premium" className="text-gray-300 hover:text-white transition-colors">
                  {t('premium')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">{t('legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                  {t('terms_of_service')}
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">
                  {t('privacy_policy')}
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-gray-300 hover:text-white transition-colors">
                  {t('security_policy')}
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                  {t('login')}
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => window.open('/client-preview/demo', '_blank')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Client Demo
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">{t('contact_us')}</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <FaMapMarkerAlt className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-300">
                  3456 Aviation Way, Suite 400<br />
                  Atlanta, GA 30339
                </span>
              </li>
              <li className="flex items-center">
                <FaPhoneAlt className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                <span className="text-gray-300">+1 (800) 555-AERO</span>
              </li>
              <li className="flex items-center">
                <FaEnvelope className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                <span className="text-gray-300">info@aerosolns.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 py-6 text-sm text-gray-400 flex flex-col md:flex-row justify-between items-center">
          <div>
            &copy; {new Date().getFullYear()} Aero Solutions. {t('all_rights_reserved')}
          </div>
          <div className="mt-4 md:mt-0">
            <span className="mr-4">FAQ</span>
            <span className="mr-4">Support</span>
            <Link href="/history" className="text-gray-400 hover:text-white transition-colors">
              {t('our_history')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
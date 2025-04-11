import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Translation resources - we'll expand this later
const resources = {
  en: {
    translation: {
      // Common
      "app_name": "Aero Solutions",
      "slogan": "Innovation in flight, excellence in service",
      
      // Navigation
      "nav_home": "Home",
      "nav_platforms": "Platforms",
      "nav_services": "Services",
      "nav_about": "About Us",
      "nav_contact": "Contact",
      "nav_marketplace": "Marketplace",
      "nav_subscriptions": "Subscriptions",
      "nav_premium": "Premium",
      "nav_login": "Log In",
      "nav_signup": "Sign Up",
      "nav_history": "Our Legacy",
      "nav_language": "Language",
      
      // Platforms
      "platform_aerosync": "AeroSync",
      "platform_aeroops": "AeroOps",
      "platform_aeroflight": "AeroFlight",
      "platform_execsync": "ExecSync",
      "platform_aerolink": "AeroLink",
      
      // Buttons & Actions
      "btn_learn_more": "Learn More",
      "btn_get_started": "Get Started",
      "btn_contact_us": "Contact Us",
      "btn_subscribe": "Subscribe",
      "btn_try_demo": "Try Demo",
      "btn_download": "Download",
      "btn_submit": "Submit",
      "btn_read_more": "Read More",
      "btn_view_all": "View All",
      "btn_upgrade": "Upgrade to Premium",
      
      // Home Page
      "hero_title": "Aviation Technology Solutions",
      "hero_subtitle": "Transforming flight operations with cutting-edge software",
      "featured_clients": "Trusted by Leading Aviation Companies",
      "solutions_title": "Our Solutions",
      "testimonials_title": "What Our Clients Say",
      "recent_updates": "Latest Updates",
      
      // Premium
      "premium_title": "Premium Aviation Solutions",
      "premium_subtitle": "Exclusive features and content for our premium members",
      "premium_benefit_1": "Advanced analytics and reporting",
      "premium_benefit_2": "Priority customer support",
      "premium_benefit_3": "Exclusive industry insights",
      "premium_benefit_4": "Early access to new features",
      "premium_benefit_5": "Custom integration solutions",
      "premium_plans": "Premium Plans",
      "premium_join": "Join Premium Today",
      
      // Legacy
      "legacy_title": "Our Legacy in Aviation Technology",
      "legacy_subtitle": "A journey of innovation and excellence since 2018",
      "legacy_founding": "Founding",
      "legacy_first_product": "First Product Launch",
      "legacy_expansion": "Market Expansion",
      "legacy_innovation": "Innovation Milestones",
      "legacy_recognition": "Industry Recognition",
      "legacy_global": "Global Presence",
      "legacy_future": "Looking Forward",
      
      // Footer
      "footer_rights": "All rights reserved",
      "footer_privacy": "Privacy Policy",
      "footer_terms": "Terms of Service",
      "footer_contact": "Contact Us",
      "footer_careers": "Careers",
      "footer_support": "Support",
      "footer_newsletter": "Subscribe to our newsletter",
      "footer_social": "Follow us",
    }
  },
  fr: {
    translation: {
      // Common
      "app_name": "Aero Solutions",
      "slogan": "Innovation en vol, excellence en service",
      
      // Navigation
      "nav_home": "Accueil",
      "nav_platforms": "Plateformes",
      "nav_services": "Services",
      "nav_about": "À Propos",
      "nav_contact": "Contact",
      "nav_marketplace": "Marché",
      "nav_subscriptions": "Abonnements",
      "nav_premium": "Premium",
      "nav_login": "Connexion",
      "nav_signup": "S'inscrire",
      "nav_history": "Notre Héritage",
      "nav_language": "Langue",
      
      // Platforms
      "platform_aerosync": "AeroSync",
      "platform_aeroops": "AeroOps",
      "platform_aeroflight": "AeroFlight",
      "platform_execsync": "ExecSync",
      "platform_aerolink": "AeroLink",
      
      // Buttons & Actions
      "btn_learn_more": "En Savoir Plus",
      "btn_get_started": "Commencer",
      "btn_contact_us": "Contactez-Nous",
      "btn_subscribe": "S'abonner",
      "btn_try_demo": "Essayer la Démo",
      "btn_download": "Télécharger",
      "btn_submit": "Soumettre",
      "btn_read_more": "Lire Plus",
      "btn_view_all": "Voir Tout",
      "btn_upgrade": "Passer à Premium",
      
      // Home Page
      "hero_title": "Solutions Technologiques pour l'Aviation",
      "hero_subtitle": "Transformer les opérations de vol avec des logiciels de pointe",
      "featured_clients": "Faisant confiance par les principales compagnies aériennes",
      "solutions_title": "Nos Solutions",
      "testimonials_title": "Ce Que Disent Nos Clients",
      "recent_updates": "Dernières Mises à Jour",
      
      // Premium
      "premium_title": "Solutions Aviation Premium",
      "premium_subtitle": "Fonctionnalités et contenu exclusifs pour nos membres premium",
      "premium_benefit_1": "Analyses et rapports avancés",
      "premium_benefit_2": "Support client prioritaire",
      "premium_benefit_3": "Aperçus exclusifs de l'industrie",
      "premium_benefit_4": "Accès anticipé aux nouvelles fonctionnalités",
      "premium_benefit_5": "Solutions d'intégration personnalisées",
      "premium_plans": "Plans Premium",
      "premium_join": "Rejoignez Premium Aujourd'hui",
      
      // Legacy
      "legacy_title": "Notre Héritage en Technologie Aéronautique",
      "legacy_subtitle": "Un parcours d'innovation et d'excellence depuis 2018",
      "legacy_founding": "Fondation",
      "legacy_first_product": "Lancement du Premier Produit",
      "legacy_expansion": "Expansion du Marché",
      "legacy_innovation": "Jalons d'Innovation",
      "legacy_recognition": "Reconnaissance de l'Industrie",
      "legacy_global": "Présence Mondiale",
      "legacy_future": "Perspectives d'Avenir",
      
      // Footer
      "footer_rights": "Tous droits réservés",
      "footer_privacy": "Politique de Confidentialité",
      "footer_terms": "Conditions d'Utilisation",
      "footer_contact": "Contactez-Nous",
      "footer_careers": "Carrières",
      "footer_support": "Support",
      "footer_newsletter": "Abonnez-vous à notre newsletter",
      "footer_social": "Suivez-nous",
    }
  },
  es: {
    translation: {
      // Common
      "app_name": "Aero Solutions",
      "slogan": "Innovación en vuelo, excelencia en servicio",
      
      // Navigation
      "nav_home": "Inicio",
      "nav_platforms": "Plataformas",
      "nav_services": "Servicios",
      "nav_about": "Sobre Nosotros",
      "nav_contact": "Contacto",
      "nav_marketplace": "Mercado",
      "nav_subscriptions": "Suscripciones",
      "nav_premium": "Premium",
      "nav_login": "Iniciar Sesión",
      "nav_signup": "Registrarse",
      "nav_history": "Nuestro Legado",
      "nav_language": "Idioma",
      
      // Platforms
      "platform_aerosync": "AeroSync",
      "platform_aeroops": "AeroOps",
      "platform_aeroflight": "AeroFlight",
      "platform_execsync": "ExecSync",
      "platform_aerolink": "AeroLink",
      
      // Buttons & Actions
      "btn_learn_more": "Más Información",
      "btn_get_started": "Comenzar",
      "btn_contact_us": "Contáctanos",
      "btn_subscribe": "Suscribirse",
      "btn_try_demo": "Probar Demo",
      "btn_download": "Descargar",
      "btn_submit": "Enviar",
      "btn_read_more": "Leer Más",
      "btn_view_all": "Ver Todo",
      "btn_upgrade": "Actualizar a Premium",
      
      // Home Page
      "hero_title": "Soluciones Tecnológicas para Aviación",
      "hero_subtitle": "Transformando operaciones de vuelo con software de vanguardia",
      "featured_clients": "Confiado por las principales compañías de aviación",
      "solutions_title": "Nuestras Soluciones",
      "testimonials_title": "Lo que Dicen Nuestros Clientes",
      "recent_updates": "Últimas Actualizaciones",
      
      // Premium
      "premium_title": "Soluciones de Aviación Premium",
      "premium_subtitle": "Características y contenido exclusivos para nuestros miembros premium",
      "premium_benefit_1": "Análisis e informes avanzados",
      "premium_benefit_2": "Soporte prioritario al cliente",
      "premium_benefit_3": "Información exclusiva de la industria",
      "premium_benefit_4": "Acceso anticipado a nuevas funciones",
      "premium_benefit_5": "Soluciones de integración personalizadas",
      "premium_plans": "Planes Premium",
      "premium_join": "Únase a Premium Hoy",
      
      // Legacy
      "legacy_title": "Nuestro Legado en Tecnología Aeronáutica",
      "legacy_subtitle": "Un viaje de innovación y excelencia desde 2018",
      "legacy_founding": "Fundación",
      "legacy_first_product": "Lanzamiento del Primer Producto",
      "legacy_expansion": "Expansión de Mercado",
      "legacy_innovation": "Hitos de Innovación",
      "legacy_recognition": "Reconocimiento de la Industria",
      "legacy_global": "Presencia Global",
      "legacy_future": "Mirando Hacia el Futuro",
      
      // Footer
      "footer_rights": "Todos los derechos reservados",
      "footer_privacy": "Política de Privacidad",
      "footer_terms": "Términos de Servicio",
      "footer_contact": "Contáctenos",
      "footer_careers": "Carreras",
      "footer_support": "Soporte",
      "footer_newsletter": "Suscríbase a nuestro boletín",
      "footer_social": "Síguenos",
    }
  }
};

i18n
  // Load translations from the server
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Default namespace used
    defaultNS: 'translation',
    
    // Detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    }
  });

export default i18n;
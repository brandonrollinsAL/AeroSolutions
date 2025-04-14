import { 
  Globe, 
  PaintBucket, 
  BarChart3, 
  FileText, 
  Search, 
  Lightbulb, 
  ShoppingCart, 
  Smartphone, 
  Code, 
  Shield, 
  Cloud, 
  Zap, 
  PenTool, 
  ImageIcon,
  Video as VideoIcon,
  Megaphone,
  LayoutGrid,
  Users,
  Bot as BotIcon,
  Database
} from 'lucide-react';

export interface MarketplaceCategory {
  id: string;
  name: string;
  description: string;
  icon: typeof Globe;
  subcategories?: string[];
  popular?: boolean;
}

export const marketplaceCategories: MarketplaceCategory[] = [
  {
    id: 'web_development',
    name: 'Web Development',
    description: 'Custom websites, web applications, and web-based solutions for businesses of all sizes',
    icon: Globe,
    subcategories: ['WordPress', 'Custom Development', 'Frontend', 'Backend', 'Full Stack'],
    popular: true
  },
  {
    id: 'design',
    name: 'Design',
    description: 'Professional graphic, UX/UI, and brand design services to elevate your visual identity',
    icon: PaintBucket,
    subcategories: ['UI/UX Design', 'Logo Design', 'Brand Identity', 'Print Design', 'Packaging'],
    popular: true
  },
  {
    id: 'marketing',
    name: 'Digital Marketing',
    description: 'Strategic marketing services to grow your online presence and reach new customers',
    icon: BarChart3,
    subcategories: ['Social Media', 'Email Marketing', 'PPC', 'Content Strategy', 'Analytics'],
    popular: true
  },
  {
    id: 'content',
    name: 'Content Creation',
    description: 'High-quality written and visual content to engage your audience and build your brand',
    icon: FileText,
    subcategories: ['Copywriting', 'Blog Posts', 'Product Descriptions', 'Technical Writing', 'Editing'],
    popular: true
  },
  {
    id: 'seo',
    name: 'SEO Services',
    description: 'Search engine optimization to improve your visibility and organic search rankings',
    icon: Search,
    subcategories: ['On-Page SEO', 'Off-Page SEO', 'Technical SEO', 'Local SEO', 'Keyword Research'],
    popular: true
  },
  {
    id: 'consulting',
    name: 'Business Consulting',
    description: 'Expert advice and strategic consulting for your business growth and digital transformation',
    icon: Lightbulb,
    subcategories: ['Digital Strategy', 'Business Analysis', 'Process Optimization', 'Growth Consulting']
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Solutions',
    description: 'Online store development, optimization, and management for selling products and services',
    icon: ShoppingCart,
    subcategories: ['Shopify', 'WooCommerce', 'Custom Stores', 'Product Management', 'Checkout Optimization'],
    popular: true
  },
  {
    id: 'mobile',
    name: 'Mobile Development',
    description: 'Native and cross-platform mobile applications for iOS and Android devices',
    icon: Smartphone,
    subcategories: ['iOS Apps', 'Android Apps', 'React Native', 'Flutter', 'App Maintenance']
  },
  {
    id: 'api_integration',
    name: 'API & Integration',
    description: 'Connect your systems and applications with seamless third-party integrations',
    icon: Code,
    subcategories: ['API Development', 'CRM Integration', 'Payment Gateways', 'Third-Party Services']
  },
  {
    id: 'security',
    name: 'Security Services',
    description: 'Protect your business and customer data with comprehensive security solutions',
    icon: Shield,
    subcategories: ['Security Audits', 'Penetration Testing', 'SSL Implementation', 'Data Protection']
  },
  {
    id: 'cloud_services',
    name: 'Cloud Services',
    description: 'Cloud infrastructure, migration, and management for scalable business operations',
    icon: Cloud,
    subcategories: ['AWS', 'Azure', 'Google Cloud', 'Cloud Migration', 'DevOps']
  },
  {
    id: 'performance',
    name: 'Performance Optimization',
    description: 'Speed up your website and applications for better user experience and conversion rates',
    icon: Zap,
    subcategories: ['Website Speed', 'Code Optimization', 'Database Optimization', 'Server Tuning']
  },
  {
    id: 'graphic_design',
    name: 'Graphic Design',
    description: 'Eye-catching visual assets and designs for all your marketing and branding needs',
    icon: PenTool,
    subcategories: ['Social Media Graphics', 'Presentation Design', 'Print Materials', 'Infographics']
  },
  {
    id: 'photo_editing',
    name: 'Photo & Image Editing',
    description: 'Professional photo editing and enhancement for products, portraits, and marketing materials',
    icon: ImageIcon,
    subcategories: ['Product Photos', 'Retouching', 'Background Removal', 'Color Correction']
  },
  {
    id: 'video_production',
    name: 'Video Production',
    description: 'Engaging video content creation for marketing, products, and social media',
    icon: VideoIcon,
    subcategories: ['Promotional Videos', 'Product Videos', 'Animations', 'Motion Graphics']
  },
  {
    id: 'social_media',
    name: 'Social Media Management',
    description: 'Comprehensive social media strategy, content creation, and account management',
    icon: Megaphone,
    subcategories: ['Content Strategy', 'Community Management', 'Paid Campaigns', 'Analytics']
  },
  {
    id: 'cms',
    name: 'CMS Development',
    description: 'Content management system implementation, customization, and training',
    icon: LayoutGrid,
    subcategories: ['WordPress', 'Drupal', 'Shopify', 'Custom CMS', 'CMS Migration']
  },
  {
    id: 'user_testing',
    name: 'User Testing & Research',
    description: 'Gather insights about your customers and improve your user experience',
    icon: Users,
    subcategories: ['Usability Testing', 'A/B Testing', 'User Research', 'Analytics Setup']
  },
  {
    id: 'ai_services',
    name: 'AI & Automation',
    description: 'Leverage artificial intelligence and automation to streamline your business processes',
    icon: BotIcon,
    subcategories: ['Chatbots', 'Process Automation', 'AI Integration', 'Custom AI Solutions']
  },
  {
    id: 'database',
    name: 'Database Services',
    description: 'Database design, optimization, and management for your business applications',
    icon: Database,
    subcategories: ['Database Design', 'Migration', 'Optimization', 'Administration']
  }
];

// Helper function to get a category by ID
export function getCategoryById(id: string): MarketplaceCategory | undefined {
  return marketplaceCategories.find(category => category.id === id);
}

// Helper function to get popular categories
export function getPopularCategories(): MarketplaceCategory[] {
  return marketplaceCategories.filter(category => category.popular);
}

// Function to get a category name from ID
export function getCategoryName(id: string): string {
  const category = getCategoryById(id);
  return category ? category.name : 'Other';
}
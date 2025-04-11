import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';

// Language options with their flags and names
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' }
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  
  // Local storage key for language preference
  const LANGUAGE_STORAGE_KEY = 'preferredLanguage';
  
  // Initialize with current i18n language or saved preference
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    localStorage.getItem(LANGUAGE_STORAGE_KEY) || i18n.language.split('-')[0] || 'en'
  );

  // Set the initial language on component mount
  useEffect(() => {
    // Get language code from saved preference, i18n, or browser preference
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const detectedLanguage = i18n.language.split('-')[0];
    
    // Use saved preference or detected language
    const languageToUse = savedLanguage || detectedLanguage || 'en';
    
    // Update state and i18n if needed
    if (currentLanguage !== languageToUse) {
      setCurrentLanguage(languageToUse);
      i18n.changeLanguage(languageToUse);
    }
  }, [currentLanguage, i18n]);

  // Handle language change
  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setCurrentLanguage(langCode);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
  };

  // Find current language details
  const currentLangDetails = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Select language">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className="cursor-pointer flex items-center justify-between"
          >
            <span className="flex items-center">
              <span className="mr-2">{language.flag}</span>
              <span>{language.name}</span>
            </span>
            {currentLanguage === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
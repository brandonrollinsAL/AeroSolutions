import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import BrandConsistencyDashboard from '@/components/BrandConsistencyDashboard';

const BrandConsistencyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-background">
      <Helmet>
        <title>{t('Brand Consistency Monitor')} | Elevion</title>
        <meta
          name="description"
          content={t('Track and manage brand consistency issues across your digital presence')}
        />
      </Helmet>
      
      <div className="container py-8">
        <BrandConsistencyDashboard />
      </div>
    </div>
  );
};

export default BrandConsistencyPage;
import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
// Import our layout component
import Layout from '@/components/Layout';
import BrandConsistencyDashboard from '@/components/BrandConsistencyDashboard';

const BrandConsistencyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Layout>
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
    </Layout>
  );
};

export default BrandConsistencyPage;
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import MockupEngagementAnalytics from '@/components/MockupEngagementAnalytics';
import MainLayout from '@/layouts/MainLayout';

const MockupAnalyticsPage = () => {
  const { t } = useTranslation();
  
  return (
    <MainLayout>
      <Helmet>
        <title>{t('Mockup Analytics')} | Elevion</title>
        <meta name="description" content={t('Analyze mockup engagement metrics, trends and client feedback')} />
      </Helmet>
      
      <div className="container mx-auto py-8">
        <MockupEngagementAnalytics />
      </div>
    </MainLayout>
  );
};

export default MockupAnalyticsPage;
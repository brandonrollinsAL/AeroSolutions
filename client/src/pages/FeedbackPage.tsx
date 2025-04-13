import MainLayout from "@/components/MainLayout";
import FeedbackForm from "@/components/FeedbackForm";
import { useTranslation } from "react-i18next";

export default function FeedbackPage() {
  const { t } = useTranslation();
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('feedback_title', 'Share Your Feedback')}</h1>
            <p className="text-lg text-muted-foreground mb-6">
              {t('feedback_description', 'We value your input! Help us improve Elevion by sharing your thoughts, suggestions, or reporting any issues you have encountered.')}
            </p>
          </div>
          
          <FeedbackForm />
          
          <div className="mt-12 text-center text-muted-foreground">
            <p>
              {t('feedback_privacy_note', 'Your feedback will be analyzed using our secure AI system to help us better understand your needs. All information is handled in accordance with our')} 
              <a href="/privacy-policy" className="text-primary hover:underline ml-1">
                {t('privacy_policy', 'Privacy Policy')}
              </a>.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
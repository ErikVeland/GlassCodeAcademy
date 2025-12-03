import {getTranslations} from 'next-intl/server';
import Section from '@/components/ui/Section';
import {Metadata} from 'next';
import ContactForm from '@/components/ContactForm';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  
  return {
    title: `${t('title')} | Glass Academy`,
    description: t('intro'),
  };
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <div className="w-full">
      <Section fullWidth className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left Column - Info */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">{t('title')}</h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('intro')}
                </p>
              </div>

              <div className="space-y-6 pt-8">
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">{t('info_cards.quick_response.heading')}</h3>
                  <p className="text-muted-foreground">{t('info_cards.quick_response.description')}</p>
                </div>
                
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">{t('info_cards.start_conversation.heading')}</h3>
                  <p className="text-muted-foreground">{t('info_cards.start_conversation.description')}</p>
                </div>

                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">{t('info_cards.no_obligation.heading')}</h3>
                  <p className="text-muted-foreground">{t('info_cards.no_obligation.description')}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="glass-strong rounded-2xl p-8 lg:p-10">
              <ContactForm locale={locale as 'en' | 'nb' | 'nn'} />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

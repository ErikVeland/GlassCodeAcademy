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
    <div className="container mx-auto px-4">
      <Section>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">{t('title')}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center mb-12">
            {t('intro')}
          </p>
          <ContactForm locale={locale as 'en' | 'nb' | 'nn'} />
        </div>
      </Section>
    </div>
  );
}

import {getTranslations} from 'next-intl/server';
import Section from '@/components/ui/Section';
import {Metadata} from 'next';
import WorkList from '@/components/WorkList';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'work' });
  
  return {
    title: `${t('title')} | Glass Academy`,
    description: t('intro'),
  };
}

export default async function WorkPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'work' });

  return (
    <Section fullWidth className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{t('title')}</h1>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-16 leading-relaxed">
          {t('intro')}
        </p>
        <WorkList locale={locale as 'en' | 'nb' | 'nn'} />
      </div>
    </Section>
  );
}

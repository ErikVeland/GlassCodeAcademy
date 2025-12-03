import {getTranslations} from 'next-intl/server';
import Section from '@/components/ui/Section';
import Button from '@/components/ui/Button';
import {Metadata} from 'next';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  
  return {
    title: `${t('title')} | Glass Academy`,
    description: t('intro'),
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  
  const values = ['clarity', 'investigative', 'accessibility', 'multilingual'];

  return (
    <div className="container mx-auto px-4">
      <Section>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">{t('title')}</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 mb-16">
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('intro')}
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('specialization')}
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('philosophy')}
            </p>
          </div>

          {/* Founder Bio Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-6">{t('founder.heading')}</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none space-y-4">
              <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('founder.intro')}
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('founder.paragraph1')}
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('founder.paragraph2')}
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('founder.paragraph3')}
              </p>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8">{t('values.heading')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value) => (
                <div key={value} className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {t(`values.items.${value}.heading`)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t(`values.items.${value}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button href="/contact" variant="primary">
              Work With Us
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}

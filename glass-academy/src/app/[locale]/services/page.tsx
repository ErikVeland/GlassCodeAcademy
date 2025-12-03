import {getTranslations} from 'next-intl/server';
import Section from '@/components/ui/Section';
import Button from '@/components/ui/Button';
import {Metadata} from 'next';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });
  
  return {
    title: `${t('title')} | Glass Academy`,
    description: t('intro'),
  };
}

export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });
  
  const services = [
    'digital_products',
    'data_viz',
    'investigative',
    'education'
  ];

  return (
    <div className="container mx-auto px-4">
      <Section>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-16">
            {t('intro')}
          </p>
          
          <div className="space-y-16">
            {services.map((service) => (
              <div key={service} className="border-l-4 border-primary pl-6 py-2">
                <h2 className="text-3xl font-bold mb-4">
                  {t(`items.${service}.heading`)}
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-400">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-2">
                      Who it&apos;s for
                    </h3>
                    <p className="leading-relaxed">
                      {t(`items.${service}.audience`)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-2">
                      What we deliver
                    </h3>
                    <p className="leading-relaxed">
                      {t(`items.${service}.deliverables`)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-2">
                      How we engage
                    </h3>
                    <p className="leading-relaxed">
                      {t(`items.${service}.engagement`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <Button href="/contact" variant="primary">
              Start a Project
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}

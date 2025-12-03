import {getTranslations} from 'next-intl/server';
import Section from '@/components/ui/Section';
import {Metadata} from 'next';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'process' });
  
  return {
    title: `${t('title')} | Glass Academy`,
    description: t('intro'),
  };
}

export default async function ProcessPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'process' });
  
  const steps = [
    'discovery',
    'research',
    'design',
    'build',
    'launch',
    'iteration'
  ];

  return (
    <div className="container mx-auto px-4">
      <Section>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-16">
            {t('intro')}
          </p>
          
          <ol className="relative border-l-2 border-primary/30 ml-4 space-y-12">
            {steps.map((step, index) => (
              <li key={step} className="ml-8">
                <span className="absolute flex items-center justify-center w-10 h-10 bg-primary rounded-full -left-5 ring-4 ring-background text-white font-bold">
                  {index + 1}
                </span>
                <h3 className="text-2xl font-bold mb-2 text-foreground">
                  {t(`steps.${step}.title`)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t(`steps.${step}.description`)}
                </p>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  {(t.raw(`steps.${step}.activities`) as string[]).map((activity: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </Section>
    </div>
  );
}

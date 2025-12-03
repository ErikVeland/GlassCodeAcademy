import { useTranslations } from 'next-intl';
import Section from '@/components/ui/Section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Process | Glass Academy',
  description: 'Our process from discovery to launch and iteration.',
};

export default function ProcessPage() {
  const t = useTranslations('nav');
  
  const steps = [
    'Discovery',
    'Research',
    'Design',
    'Build',
    'Launch',
    'Iteration'
  ];

  return (
    <div className="container mx-auto px-4">
      <Section>
        <h1 className="text-4xl font-bold mb-12">{t('process')}</h1>
        <div className="max-w-3xl">
          <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-4">
            {steps.map((step, index) => (
              <li key={step} className="mb-10 ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-primary rounded-full -left-4 ring-4 ring-white dark:ring-gray-900 text-white font-bold text-sm">
                  {index + 1}
                </span>
                <h3 className="flex items-center mb-1 text-xl font-semibold text-gray-900 dark:text-white">
                  {step}
                </h3>
                <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
                  We focus on {step.toLowerCase()} to ensure the best possible outcome.
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Section>
    </div>
  );
}

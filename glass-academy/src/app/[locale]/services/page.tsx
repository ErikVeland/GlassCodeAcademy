import { useTranslations } from 'next-intl';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services | Glass Academy',
  description: 'Our services include digital products, data visualization, and educational platforms.',
};

export default function ServicesPage() {
  const t = useTranslations('nav');
  
  // In a real app, these would be in messages.json
  const services = [
    {
      title: 'Digital products & platforms',
      description: 'We build robust, scalable digital products that solve real problems.'
    },
    {
      title: 'Data visualisation & network analysis',
      description: 'Transforming complex data into clear, actionable insights through interactive visualizations.'
    },
    {
      title: 'Investigative & research tools',
      description: 'Specialized tools for journalists and researchers to uncover the truth.'
    },
    {
      title: 'Education & learning experiences',
      description: 'Engaging educational platforms that make learning accessible and effective.'
    }
  ];

  return (
    <div className="container mx-auto px-4">
      <Section>
        <h1 className="text-4xl font-bold mb-8">{t('services')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <Card key={index} title={service.title}>
              <p>{service.description}</p>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}

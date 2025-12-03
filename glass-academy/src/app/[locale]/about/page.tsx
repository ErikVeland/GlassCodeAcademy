import { useTranslations } from 'next-intl';
import Section from '@/components/ui/Section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Glass Academy',
  description: 'Learn more about Glass Academy, our mission, and our philosophy.',
};

export default function AboutPage() {
  const t = useTranslations('nav');

  return (
    <div className="container mx-auto px-4">
      <Section>
        <h1 className="text-4xl font-bold mb-8">{t('about')}</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-xl mb-6">
            Glass Academy is a digital agency and educational platform dedicated to the intersection of technology, design, and investigation.
          </p>
          <p className="mb-6">
            Our mission is to empower organizations and individuals with the tools and knowledge they need to navigate the digital world. 
            We believe in transparency, open source, and the power of data to tell compelling stories.
          </p>
          <p>
            Founded in Norway, we work with clients globally, ranging from investigative journalism consortiums to educational institutions and forward-thinking startups.
          </p>
        </div>
      </Section>
    </div>
  );
}

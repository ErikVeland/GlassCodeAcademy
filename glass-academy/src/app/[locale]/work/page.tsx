import { useTranslations } from 'next-intl';
import Section from '@/components/ui/Section';
import { Metadata } from 'next';
import WorkList from '@/components/WorkList';

export const metadata: Metadata = {
  title: 'Work | Glass Academy',
  description: 'Explore our portfolio of investigative and educational projects.',
};

export default function WorkPage() {
  const t = useTranslations('nav');

  return (
    <div className="container mx-auto px-4">
      <Section>
        <h1 className="text-4xl font-bold mb-8">{t('work')}</h1>
        <WorkList />
      </Section>
    </div>
  );
}

import { useTranslations } from 'next-intl';
import Section from '@/components/ui/Section';
import { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact | Glass Academy',
  description: 'Get in touch with us for your next project.',
};

export default function ContactPage() {
  const t = useTranslations('nav');

  return (
    <div className="container mx-auto px-4">
      <Section>
        <h1 className="text-4xl font-bold mb-8">{t('contact')}</h1>
        <ContactForm />
      </Section>
    </div>
  );
}

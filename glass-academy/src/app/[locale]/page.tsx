import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';
import {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Glass Academy | Digital Agency',
  description: 'Glass Academy is a digital agency focused on education and investigation.',
};

export default function HomePage() {
  const t = useTranslations('hero');

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-5xl font-bold tracking-tight mb-6">
        {t('title')}
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10">
        {t('subtitle')}
      </p>
      <div className="flex gap-4">
        <Link 
          href="/work" 
          className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          View Work
        </Link>
        <Link 
          href="/contact" 
          className="bg-gray-100 dark:bg-gray-800 text-foreground px-6 py-3 rounded-md font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}

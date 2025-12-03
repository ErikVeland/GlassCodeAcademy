import {getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import Button from '@/components/ui/Button';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Tag from '@/components/ui/Tag';
import {getFeaturedProjects} from '@/lib/projects';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' });
  
  return {
    title: 'Glass Academy | Digital Agency',
    description: t('subtitle'),
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' });
  const tHome = await getTranslations({ locale, namespace: 'home' });
  const tWork = await getTranslations({ locale, namespace: 'work' });
  const tDomains = await getTranslations({ locale, namespace: 'domains' });
  
  const featuredProjects = getFeaturedProjects();
  const currentLocale = locale as 'en' | 'nb' | 'nn';

  return (
    <>
      {/* Hero Section */}
      <Section className="flex flex-col items-center justify-center text-center min-h-[60vh]">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
          {t('title')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10">
          {t('subtitle')}
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Button href="/work" variant="primary">
            {t('primaryCta')}
          </Button>
          <Button href="/contact" variant="secondary">
            {t('secondaryCta')}
          </Button>
        </div>
      </Section>

      {/* Featured Work Section */}
      <Section className="bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            {tHome('featured.heading')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            {tHome('featured.intro')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {featuredProjects.map((project) => (
              <Card
                key={project.id}
                title={project.title[currentLocale]}
                href={`/work/${project.slug}`}
                className="h-full"
              >
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-400">
                    {project.shortDescription[currentLocale]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Tag>{tDomains(project.domain)}</Tag>
                  </div>
                  {project.links.live && (
                    <a 
                      href={project.links.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm text-primary hover:underline"
                    >
                      {tWork('visitSite')} →
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* Services Overview Section */}
      <Section>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            {tHome('services.heading')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Digital Products */}
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">
                {tHome('services.digital_products.heading')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {tHome('services.digital_products.description')}
              </p>
            </div>

            {/* Data Visualization */}
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">
                {tHome('services.data_viz.heading')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {tHome('services.data_viz.description')}
              </p>
            </div>

            {/* Investigative */}
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">
                {tHome('services.investigative.heading')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {tHome('services.investigative.description')}
              </p>
            </div>

            {/* Education */}
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">
                {tHome('services.education.heading')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {tHome('services.education.description')}
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

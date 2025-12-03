import {getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import Button from '@/components/ui/Button';
import Section from '@/components/ui/Section';
import {getFeaturedProjects} from '@/lib/projects';
import HeroProjectCarousel from '@/components/hero/HeroProjectCarousel';
import ClientStrip from '@/components/home/ClientStrip';

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
  
  const featuredProjects = getFeaturedProjects();
  const currentLocale = locale as 'en' | 'nb' | 'nn';

  return (
    <>
      {/* Hero Section with Gradient Glow */}
      <Section fullWidth className="relative flex flex-col items-start justify-center min-h-[85vh] py-20 lg:py-32 bg-gradient-glow">
        <div className="w-full max-w-7xl mx-auto px-6">
          <h1 className="text-display mb-8 leading-none">
            {t('title')}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed font-light">
            {t('subtitle')}
          </p>
          <div className="flex gap-6 flex-wrap">
            <Button href="/work" variant="gradient">
              {t('primaryCta')}
            </Button>
            <Button href="/contact" variant="secondary">
              {t('secondaryCta')}
            </Button>
          </div>
        </div>
      </Section>

      {/* Client/Domain Strip */}
      <ClientStrip />

      {/* Featured Projects Carousel */}
      <Section 
        fullWidth 
        className="relative py-20 lg:py-20 border-b border-border/10" 
        style={{ 
          boxShadow: '0 12px 48px 0 rgba(99, 102, 241, 0.2), inset 0 -1px 0 0 rgba(99, 102, 241, 0.3)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-subtle pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {tHome('featured.heading')}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {tHome('featured.intro')}
            </p>
          </div>
          <HeroProjectCarousel projects={featuredProjects} locale={currentLocale} />
        </div>
      </Section>

      {/* Services Overview Section */}
      <Section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-16">
            {tHome('services.heading')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Digital Products */}
            <div className="glass rounded-2xl p-8 hover:glass-strong transition-all duration-500 group">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                {tHome('services.digital_products.heading')}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg group-hover:text-foreground transition-colors">
                {tHome('services.digital_products.description')}
              </p>
            </div>

            {/* Data Visualization */}
            <div className="glass rounded-2xl p-8 hover:glass-strong transition-all duration-500 group">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                {tHome('services.data_viz.heading')}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg group-hover:text-foreground transition-colors">
                {tHome('services.data_viz.description')}
              </p>
            </div>

            {/* Investigative */}
            <div className="glass rounded-2xl p-8 hover:glass-strong transition-all duration-500 group">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                {tHome('services.investigative.heading')}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg group-hover:text-foreground transition-colors">
                {tHome('services.investigative.description')}
              </p>
            </div>

            {/* Education */}
            <div className="glass rounded-2xl p-8 hover:glass-strong transition-all duration-500 group">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                {tHome('services.education.heading')}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg group-hover:text-foreground transition-colors">
                {tHome('services.education.description')}
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

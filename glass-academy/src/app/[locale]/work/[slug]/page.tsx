import {notFound} from 'next/navigation';
import {getProjectBySlug} from '@/lib/projects';
import {getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import Section from '@/components/ui/Section';
import Tag from '@/components/ui/Tag';
import {Link} from '@/i18n/routing';
import Button from '@/components/ui/Button';

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const project = getProjectBySlug(slug);
  
  if (!project) {
    return {
      title: 'Not Found | Glass Academy',
    };
  }
  
  const currentLocale = locale as 'en' | 'nb' | 'nn';
  return {
    title: `${project.title[currentLocale]} | Glass Academy`,
    description: project.shortDescription[currentLocale],
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const currentLocale = locale as 'en' | 'nb' | 'nn';
  const tCase = await getTranslations({ locale, namespace: 'case' });
  const tDomains = await getTranslations({ locale, namespace: 'domains' });
  const tStatus = await getTranslations({ locale, namespace: 'status' });
  const tWork = await getTranslations({ locale, namespace: 'work' });

  return (
    <div className="container mx-auto px-4">
      <Section>
        <div className="max-w-5xl mx-auto">
          {/* Back Link */}
          <Link 
            href="/work" 
            className="text-sm text-primary hover:underline mb-6 inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            ← {tWork('title')}
          </Link>
          
          {/* Project Header */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 mt-4">
            {project.title[currentLocale]}
          </h1>
          
          {/* Meta Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Tag className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {tStatus(project.status)}
            </Tag>
            <Tag>{tDomains(project.domain)}</Tag>
            <Tag className="bg-gray-50 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300">
              {project.clientType}
            </Tag>
          </div>
          
          {/* Summary */}
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
            {project.summary[currentLocale]}
          </p>

          {/* Live Link */}
          {project.links.live && (
            <div className="mb-12">
              <Button 
                href={project.links.live}
                variant="primary"
                className="inline-flex items-center gap-2"
              >
                {tWork('visitSite')} ↗
              </Button>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Case Study Narrative */}
            <div className="lg:col-span-2 space-y-12">
              {/* Context Section */}
              <section>
                <h2 className="text-3xl font-bold mb-4">
                  {tCase('context.heading')}
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {project.summary[currentLocale]}
                  </p>
                </div>
              </section>

              {/* Approach Section */}
              <section>
                <h2 className="text-3xl font-bold mb-4">
                  {tCase('approach.heading')}
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Our approach focused on {project.domain.toLowerCase()} methodologies, 
                    combining technical excellence with user-centered design principles to deliver 
                    a solution that meets real-world needs.
                  </p>
                </div>
              </section>

              {/* Solution Section */}
              <section>
                <h2 className="text-3xl font-bold mb-4">
                  {tCase('solution.heading')}
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    The solution leverages modern web technologies including {project.techStack.slice(0, 3).join(', ')} 
                    to create a robust, scalable platform. We implemented responsive design, 
                    accessibility features, and performance optimizations throughout.
                  </p>
                </div>
              </section>

              {/* Outcome Section */}
              <section>
                <h2 className="text-3xl font-bold mb-4">
                  {tCase('outcome.heading')}
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    The project successfully launched and is currently {project.status.toLowerCase()}. 
                    It demonstrates our capability in the {project.domain.toLowerCase()} domain 
                    and serves as a reference for similar future projects.
                  </p>
                </div>
              </section>
            </div>

            {/* Sidebar Meta Information */}
            <aside className="space-y-8">
              {/* Tech Stack */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  {tCase('meta.techStack')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map(tech => (
                    <Tag key={tech} className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {tech}
                    </Tag>
                  ))}
                </div>
              </div>

              {/* Our Role */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  {tCase('meta.role')}
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  {project.role.map(r => (
                    <li key={r} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Domain & Client Type */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  {tCase('meta.domain')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {tDomains(project.domain)}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  {tCase('meta.clientType')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {project.clientType}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </Section>
    </div>
  );
}

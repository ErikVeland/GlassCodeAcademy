import { notFound } from 'next/navigation';
import { getProjectBySlug } from '@/lib/projects';
import Section from '@/components/ui/Section';
import Tag from '@/components/ui/Tag';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default async function ProjectPage({
  params
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Helper to get localized string safely
  const getLocalized = (obj: { en: string; nb: string; nn: string }) => {
    return obj[locale as 'en' | 'nb' | 'nn'] || obj.en;
  };

  return (
    <div className="container mx-auto px-4">
      <Section>
        <div className="mb-8">
          <Link href="/work" className="text-sm text-gray-500 hover:text-primary mb-4 inline-block">
            ← Back to Work
          </Link>
          <h1 className="text-4xl font-bold mb-4">{getLocalized(project.title)}</h1>
          <div className="flex flex-wrap gap-2 mb-6">
            <Tag className="bg-primary/10 text-primary">{project.status}</Tag>
            <Tag>{project.domain}</Tag>
            {project.clientType && <Tag>{project.clientType}</Tag>}
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
            {getLocalized(project.summary)}
          </p>
        </div>

        {project.links.live && (
          <div className="mb-12">
            <a 
              href={project.links.live} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Visit Live Site ↗
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">Context</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {/* Placeholder content */}
                This project addresses a critical need in the {project.domain.toLowerCase()} space. 
                We worked closely with stakeholders to understand the problem domain and identify key opportunities for impact.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Approach</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Our approach combined rigorous research with iterative prototyping. 
                We focused on user-centric design principles to ensure the solution was both intuitive and powerful.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Solution</h2>
              <p className="text-gray-600 dark:text-gray-400">
                The final solution leverages modern web technologies to deliver a seamless experience. 
                Key features include real-time data visualization and responsive design.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Outcome</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Since launch, the project has seen significant engagement and positive feedback from users.
                It has successfully achieved its primary objectives and set a new standard in the field.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map(tech => (
                  <Tag key={tech}>{tech}</Tag>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Roles</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                {project.role.map(r => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

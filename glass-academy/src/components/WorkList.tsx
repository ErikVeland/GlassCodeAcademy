'use client';

import {useTranslations} from 'next-intl';
import {allProjects} from '@/lib/projects';
import Card from '@/components/ui/Card';
import Tag from '@/components/ui/Tag';
import {useState} from 'react';

type WorkListProps = {
  locale: 'en' | 'nb' | 'nn';
};

type FilterDomain = 'All' | 'Investigative' | 'Education' | 'Data viz' | 'Experimental';

export default function WorkList({ locale }: WorkListProps) {
  const t = useTranslations('work');
  const tDomains = useTranslations('domains');
  const tStatus = useTranslations('status');
  
  const [filter, setFilter] = useState<FilterDomain>('All');

  const domains: FilterDomain[] = ['All', 'Investigative', 'Education', 'Data viz', 'Experimental'];
  const filterKeys: Record<FilterDomain, string> = {
    'All': 'all',
    'Investigative': 'investigative',
    'Education': 'education',
    'Data viz': 'dataviz',
    'Experimental': 'experimental'
  };

  const filteredProjects = filter === 'All' 
    ? allProjects 
    : allProjects.filter(p => p.domain === filter);

  const handleKeyDown = (event: React.KeyboardEvent, domain: FilterDomain) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setFilter(domain);
    }
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center" role="group" aria-label="Project filters">
        {domains.map(d => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            onKeyDown={(e) => handleKeyDown(e, d)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              filter === d 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-pressed={filter === d}
            aria-current={filter === d ? 'true' : undefined}
          >
            {t(`filters.${filterKeys[d]}`)}
          </button>
        ))}
      </div>

      {/* Results announcement for screen readers */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} displayed
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <Card 
            key={project.id} 
            title={project.title[locale]} 
            href={`/work/${project.slug}`}
            className="h-full flex flex-col"
          >
            <div className="flex-grow space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {project.shortDescription[locale]}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Tag>{tDomains(project.domain)}</Tag>
                <Tag className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  {tStatus(project.status)}
                </Tag>
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">Tech:</span> {project.techStack.slice(0, 3).join(', ')}
                {project.techStack.length > 3 && ` +${project.techStack.length - 3}`}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { allProjects } from '@/lib/projects';
import Card from '@/components/ui/Card';
import Tag from '@/components/ui/Tag';
import { useState } from 'react';

export default function WorkList() {
  const t = useTranslations('nav');
  const [filter, setFilter] = useState<string>('All');

  const domains = ['All', 'Investigative', 'Education', 'Data viz', 'Experimental'];

  const filteredProjects = filter === 'All' 
    ? allProjects 
    : allProjects.filter(p => p.domain === filter);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        {domains.map(d => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === d 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map(project => (
          <Card 
            key={project.id} 
            title={project.title.en} 
            href={`/work/${project.slug}`}
          >
            <p className="mb-4">{project.shortDescription.en}</p>
            <div className="flex flex-wrap gap-2">
              <Tag>{project.domain}</Tag>
              {project.techStack.map(tech => (
                <Tag key={tech} className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {tech}
                </Tag>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

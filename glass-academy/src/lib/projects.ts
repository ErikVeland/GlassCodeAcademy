export interface Project {
  id: 'askoy-rocketre' | 'glasscode-academy' | 'epstein-investigation-project' | 'racehub';
  slug: string;
  title: { en: string; nb: string; nn: string };
  shortDescription: { en: string; nb: string; nn: string };
  summary: { en: string; nb: string; nn: string };
  role: string[];
  clientType: string;
  domain: 'Investigative' | 'Education' | 'Data viz' | 'Experimental';
  techStack: string[];
  status: 'Live' | 'Prototype' | 'Internal';
  links: { live?: string };
}

export const allProjects: Project[] = [
  {
    id: 'askoy-rocketre',
    slug: 'askoy-rocketre',
    title: {
      en: 'Askøy Rocketre',
      nb: 'Askøy Rrocketre',
      nn: 'Askøy Rrocketre'
    },
    shortDescription: {
      en: 'Interactive data visualization of local government spending.',
      nb: 'Interaktiv datavisualisering av kommunalt forbruk.',
      nn: 'Interaktiv datavisualisering av kommunalt forbruk.'
    },
    summary: {
      en: 'A comprehensive dashboard visualizing the budget and spending of Askøy municipality, helping citizens understand where their tax money goes.',
      nb: 'Et omfattende dashbord som visualiserer budsjett og forbruk i Askøy kommune, og hjelper innbyggerne å forstå hvor skattepengene går.',
      nn: 'Eit omfattande dashbord som visualiserer budsjett og forbruk i Askøy kommune, og hjelper innbyggjarane å forstå kvar skattepengane går.'
    },
    role: ['Design', 'Development', 'Data Analysis'],
    clientType: 'Municipality',
    domain: 'Data viz',
    techStack: ['Next.js', 'D3.js', 'Tailwind CSS'],
    status: 'Live',
    links: { live: 'https://askoytreet.vercel.app' }
  },
  {
    id: 'glasscode-academy',
    slug: 'glasscode-academy',
    title: {
      en: 'GlassCode Academy',
      nb: 'GlassCode Academy',
      nn: 'GlassCode Academy'
    },
    shortDescription: {
      en: 'Our own agency portfolio and educational platform.',
      nb: 'Vår egen byråportefølje og utdanningsplattform.',
      nn: 'Vår eigen byråportefølje og utdanningsplattform.'
    },
    summary: {
      en: 'The official website for GlassCode Academy, showcasing our work, services, and educational resources.',
      nb: 'Det offisielle nettstedet for GlassCode Academy, som viser frem vårt arbeid, tjenester og utdanningsressurser.',
      nn: 'Den offisielle nettstaden for GlassCode Academy, som viser fram arbeidet vårt, tenester og utdanningsressursar.'
    },
    role: ['Design', 'Development'],
    clientType: 'Internal product',
    domain: 'Education',
    techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'next-intl'],
    status: 'Live',
    links: { live: 'https://glasscode.academy' }
  },
  {
    id: 'epstein-investigation-project',
    slug: 'epstein-investigation-project',
    title: {
      en: 'Epstein Investigation Project',
      nb: 'Epstein Etterforskningsprosjekt',
      nn: 'Epstein Etterforskingsprosjekt'
    },
    shortDescription: {
      en: 'Collaborative investigative journalism platform.',
      nb: 'Samarbeidsplattform for gravende journalistikk.',
      nn: 'Samarbeidsplattform for gravande journalistikk.'
    },
    summary: {
      en: 'A secure platform for journalists and researchers to collaborate on the Epstein investigation, featuring document analysis and network mapping.',
      nb: 'En sikker plattform for journalister og forskere for å samarbeide om Epstein-etterforskningen, med dokumentanalyse og nettverkskartlegging.',
      nn: 'Ei sikker plattform for journalistar og forskarar for å samarbeide om Epstein-etterforskinga, med dokumentanalyse og nettverkskartlegging.'
    },
    role: ['Architecture', 'Development', 'Security'],
    clientType: 'Investigative Consortium',
    domain: 'Investigative',
    techStack: ['React', 'Node.js', 'Neo4j', 'Elasticsearch'],
    status: 'Live',
    links: { live: 'https://epstein.academy' }
  },
  {
    id: 'racehub',
    slug: 'racehub',
    title: {
      en: 'RaceHub',
      nb: 'RaceHub',
      nn: 'RaceHub'
    },
    shortDescription: {
      en: 'Experimental betting and racing analytics prototype.',
      nb: 'Eksperimentell prototype for betting og løpsanalyse.',
      nn: 'Eksperimentell prototype for betting og løpsanalyse.'
    },
    summary: {
      en: 'A high-performance prototype for real-time racing analytics and betting odds visualization.',
      nb: 'En høyytelses prototype for sanntids løpsanalyse og visualisering av bettingodds.',
      nn: 'Ein høgytelses prototype for sanntids løpsanalyse og visualisering av bettingodds.'
    },
    role: ['Prototyping', 'Frontend Development'],
    clientType: 'Startup',
    domain: 'Experimental',
    techStack: ['SvelteKit', 'WebSockets', 'Canvas API'],
    status: 'Prototype',
    links: { live: 'https://bet.glasscode.academy' }
  }
];

export function getProjectBySlug(slug: string): Project | undefined {
  return allProjects.find(p => p.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return allProjects;
}

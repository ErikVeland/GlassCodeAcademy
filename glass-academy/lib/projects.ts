export type Locale = 'en' | 'nb' | 'nn';

export type ProjectDomain = 'Investigative' | 'Education' | 'Data viz' | 'Experimental';

export type ProjectStatus = 'Live' | 'Prototype' | 'Internal';

export interface LocalisedText {
	en: string;
	nb: string;
	nn: string;
}

export interface ScreenshotSet {
	hero: string;
	details: string[];
}

export interface Project {
	id: 'askoy-rocketre' | 'glasscode-academy' | 'epstein-investigation-project' | 'racehub';
	slug: string;
	title: LocalisedText;
	shortDescription: LocalisedText;
	summary: LocalisedText;
	role: string[];
	clientType: string;
	domain: ProjectDomain;
	techStack: string[];
	status: ProjectStatus;
	links: {
		live?: string;
		repo?: string;
	};
	featured: boolean;
	screenshots: ScreenshotSet;
}

export const allProjects: Project[] = [
	{
		id: 'askoy-rocketre',
		slug: 'askoy-rocketre',
		title: {
			en: 'Askøy Rocketre',
			nb: 'Askøy Rocketre',
			nn: 'Askøy Rocketre'
		},
		shortDescription: {
			en: "Interactive network visualisation of Askøy's music scene and its connections to global culture.",
			nb: 'Interaktiv nettverksvisualisering av musikkscenen på Askøy og koblingene til global kultur.',
			nn: 'Interaktiv nettverksvisualisering av musikkscena på Askøy og koplingane til global kultur.'
		},
		summary: {
			en: 'Askøy Rocketre is an exploratory data visualisation that maps out the relationships between artists, venues, genres and eras in and around Askøy. It lets visitors zoom through decades of local musical history and see how a small island scene is woven into a wider global network.',
			nb: 'Askøy Rocketre er ein utforskende datavisualisering som kartlegg forholdet mellom artister, scener, sjangre og epoker på og rundt Askøy. Brukeren kan zoome gjennom tiår med lokal musikkhistorie og se hvordan ei lita øy-scene er vevd inn i et større globalt nettverk.',
			nn: 'Askøy Rocketre er ei utforskande datavisualisering som kartlegg forholdet mellom artistar, scener, sjangrar og epokar på og rundt Askøy. Brukaren kan zoome gjennom tiår med lokal musikkhistorie og sjå korleis ei lita øyscene er voven inn i eit større globalt nettverk.'
		},
		role: [
			'Information architecture',
			'Interaction design',
			'Data modelling',
			'Frontend development'
		],
		clientType: 'Cultural / local community project',
		domain: 'Data viz',
		techStack: [
			'Next.js',
			'React',
			'TypeScript',
			'D3.js or graph visualisation library',
			'Tailwind CSS'
		],
		status: 'Live',
		links: {
			live: 'https://askoytreet.vercel.app'
		},
		featured: true,
		screenshots: {
			hero: '/screenshots/askoy-rocketre/hero.png',
			details: [
				'/screenshots/askoy-rocketre/detail-1.png',
				'/screenshots/askoy-rocketre/detail-2.png',
				'/screenshots/askoy-rocketre/detail-3.png'
			]
		}
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
			en: 'A modern learning platform for full-stack engineers, from fundamentals to production-grade systems.',
			nb: 'En moderne læringsplattform for fullstack-utviklere, fra grunnleggende konsepter til produksjonsklare systemer.',
			nn: 'Ein moderne læringsplattform for fullstack-utviklarar, frå grunnleggande konsept til produksjonsklare system.'
		},
		summary: {
			en: 'GlassCode Academy is a teaching platform built by working engineers for people who want to ship real products. The platform covers everything from web fundamentals to distributed systems, with opinionated, hands-on curricula, interactive exercises and production-style projects rather than toy examples.',
			nb: 'GlassCode Academy er en undervisningsplattform laget av aktive utviklere for folk som vil bygge faktiske produkter. Plattformen dekker alt fra web-grunnlag til distribuerte systemer, med tydelige, praktiske kurs, interaktive oppgaver og prosjekter som ligner reelle produksjonsmiljøer – ikke bare lekeeksempler.',
			nn: 'GlassCode Academy er ei undervisningsplattform laga av aktive utviklarar for folk som vil byggje faktiske produkt. Plattformen dekkjer alt frå web-grunnlag til distribuerte system, med tydelege, praktiske kurs, interaktive oppgåver og prosjekt som liknar reelle produksjonsmiljø – ikkje berre leikeeksempel.'
		},
		role: [
			'Product strategy',
			'Curriculum design',
			'System architecture',
			'Full-stack development',
			'Design system'
		],
		clientType: 'Internal product / education',
		domain: 'Education',
		techStack: [
			'Next.js',
			'React',
			'TypeScript',
			'Node.js',
			'PostgreSQL',
			'Prisma',
			'Tailwind CSS',
			'Auth (e.g. NextAuth or custom)'
		],
		status: 'Live',
		links: {
			live: 'https://glasscode.academy'
		},
		featured: true,
		screenshots: {
			hero: '/screenshots/glasscode-academy/hero.png',
			details: [
				'/screenshots/glasscode-academy/detail-1.png',
				'/screenshots/glasscode-academy/detail-2.png'
			]
		}
	},
	{
		id: 'epstein-investigation-project',
		slug: 'epstein-investigation-project',
		title: {
			en: 'Epstein Investigation Project',
			nb: 'Epstein Investigation Project',
			nn: 'Epstein Investigation Project'
		},
		shortDescription: {
			en: 'A forensic-grade investigative platform for exploring the Jeffrey Epstein files and related networks.',
			nb: 'En etterforskningsplattform på forensisk nivå for å utforske Jeffrey Epstein-arkivet og tilknyttede nettverk.',
			nn: 'Ein etterforskingsplattform på forensisk nivå for å utforske Jeffrey Epstein-arkivet og tilknytte nettverk.'
		},
		summary: {
			en: 'The Epstein Investigation Project turns a chaotic document dump into a structured, searchable and collaborative investigation environment. It combines entity extraction, relationship mapping, evidence weighting and advanced search so journalists and researchers can trace people, organisations and transactions across thousands of documents with proper context and caution.',
			nb: 'Epstein Investigation Project gjør et uoversiktlig dokumentarkiv om til et strukturert, søkbart og samarbeidsorientert etterforskningsmiljø. Plattformen kombinerer enhetsuttrekk, nettverkskartlegging, vekting av bevis og avansert søk, slik at journalister og forskere kan følge personer, organisasjoner og transaksjoner på tvers av tusenvis av dokumenter – med kontekst, sporbarhet og nødvendig varsomhet.',
			nn: 'Epstein Investigation Project gjer eit uoversiktleg dokumentarkiv om til eit strukturert, søkbart og samarbeidsretta etterforskingsmiljø. Plattformen kombinerer einingsuttrekk, nettverkskartlegging, vekting av bevis og avansert søk, slik at journalistar og forskarar kan følgje personar, organisasjonar og transaksjonar på tvers av tusenvis av dokument – med kontekst, sporbarheit og naudsynt varsemd.'
		},
		role: [
			'Investigative product design',
			'Data modelling',
			'Entity and relationship architecture',
			'Full-stack development',
			'Search and relevance tuning'
		],
		clientType: 'Investigative journalism / public interest research',
		domain: 'Investigative',
		techStack: [
			'Next.js',
			'React',
			'TypeScript',
			'Node.js',
			'PostgreSQL',
			'Search index (e.g. Meilisearch or Elasticsearch)',
			'Graph visualisation',
			'Background job processing'
		],
		status: 'Live',
		links: {
			live: 'https://epstein.academy'
		},
		featured: true,
		screenshots: {
			hero: '/screenshots/epstein-investigation-project/hero.png',
			details: [
				'/screenshots/epstein-investigation-project/detail-1.png',
				'/screenshots/epstein-investigation-project/detail-2.png'
			]
		}
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
			en: 'A prototype racing and betting analytics hub that turns messy race data into clean, explorable insight. Includes a fully functional betting simulator as a bonus.',
			nb: 'En prototype for et analyseverktøy for løp og betting som gjør ustrukturert løpsdata om til ryddig, utforskbar innsikt. Inkluderer en fullt funksjonell betting-simulator som bonus.',
			nn: 'Ein prototype for eit analyseverktøy for løp og betting som gjer ustrukturert løpsdata om til ryddig, utforskbar innsikt. Inkluderer ein fullt funksjonell betting-simulator som bonus.'
		},
		summary: {
			en: 'RaceHub is an experimental product prototype that ingests race cards, results and odds data and restructures it into a fast, queryable interface. It explores how serious bettors and analysts might slice and compare runners, tracks and markets in real time without drowning in spreadsheets or ad-heavy dashboards. As a bonus feature, it includes a fully functional betting simulator that lets users test strategies with realistic market conditions.',
			nb: 'RaceHub er en eksperimentell produktprototype som leser inn løpsprogram, resultater og oddsdata og omstrukturerer alt til et raskt, søkbart grensesnitt. Prosjektet utforsker hvordan seriøse spillere og analytikere kan sammenligne hester, baner og markeder i sanntid uten å drukne i regneark eller reklametunge dashbord. Som bonusfunksjon inkluderer det en fullt funksjonell betting-simulator som lar brukere teste strategier under realistiske markedsforhold.',
			nn: 'RaceHub er ein eksperimentell produktprototype som les inn løpsprogram, resultat og oddsdata og omstrukturerer alt til eit raskt, søkbart grensesnitt. Prosjektet utforskar korleis seriøse spelarar og analytikarar kan samanlikne hestar, baner og marknader i sanntid utan å drukne i rekneark eller reklametunge dashbord. Som bonusfunksjon inkluderer det ein fullt funksjonell betting-simulator som lèt brukarar teste strategiar under realistiske marknadsforhold.'
		},
		role: [
			'Product prototyping',
			'Data ingestion and normalisation',
			'Interface design',
			'Frontend development'
		],
		clientType: 'Experimental / internal prototype',
		domain: 'Experimental',
		techStack: [
			'Next.js',
			'React',
			'TypeScript',
			'Node.js',
			'Data ingestion pipeline',
			'Tailwind CSS'
		],
		status: 'Prototype',
		links: {
			live: 'https://bet.glasscode.academy'
		},
		featured: true,
		screenshots: {
			hero: '/screenshots/racehub/hero.png',
			details: [
				'/screenshots/racehub/detail-1.png',
				'/screenshots/racehub/detail-2.png'
			]
		}
	}
];

export function getProjectBySlug(slug: string): Project | undefined {
	return allProjects.find(project => project.slug === slug);
}

export function getFeaturedProjects(): Project[] {
	return allProjects.filter(project => project.featured);
}

/**
 * Get screenshot path(s) for a project
 * @param project - The project object
 * @param variant - 'hero' for single hero image, 'details' for detail images array
 * @returns Screenshot path(s) or fallback placeholder
 */
export function getProjectScreenshots(
	project: Project,
	variant: 'hero' | 'details'
): string | string[] {
	if (variant === 'hero') {
		return project.screenshots?.hero || '/screenshots/placeholder-hero.png';
	}
	return project.screenshots?.details || [];
}

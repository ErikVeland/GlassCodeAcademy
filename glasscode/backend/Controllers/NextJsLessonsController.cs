using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class NextJsLessonsController : ControllerBase
    {
        public static readonly List<Lesson> Lessons = new List<Lesson>
        {
            new Lesson { Id = 1, Topic = "Routing", Title = "Dynamic Routes", Description = "Create dynamic routes with bracket syntax.", CodeExample = "// pages/posts/[id].js\nexport default function Post({ post }) { ... }", Output = "Dynamic route for posts." },
            new Lesson { Id = 2, Topic = "Data Fetching", Title = "getServerSideProps", Description = "Fetch data on each request.", CodeExample = "export async function getServerSideProps(context) { ... }", Output = "Server-side rendered page." },
            new Lesson { Id = 3, Topic = "Data Fetching", Title = "getStaticProps", Description = "Fetch data at build time.", CodeExample = "export async function getStaticProps() { ... }", Output = "Static generated page." },
            new Lesson { Id = 4, Topic = "Data Fetching", Title = "getStaticPaths", Description = "Define paths for dynamic routes.", CodeExample = "export async function getStaticPaths() { ... }", Output = "Pre-rendered dynamic routes." },
            new Lesson { Id = 5, Topic = "SSR vs SSG", Title = "Server-Side Rendering vs Static Site Generation", Description = "SSR renders on each request, SSG pre-renders at build time.", CodeExample = "getServerSideProps vs getStaticProps", Output = "Different rendering strategies." },
            new Lesson { Id = 6, Topic = "API Routes", Title = "Creating API Routes", Description = "Create API endpoints in pages/api.", CodeExample = "// pages/api/hello.js\nexport default function handler(req, res) { ... }", Output = "API endpoint at /api/hello." },
            new Lesson { Id = 7, Topic = "API Routes", Title = "API Middleware", Description = "Add middleware to API routes.", CodeExample = "export const config = { api: { bodyParser: false } }", Output = "Custom API configuration." },
            new Lesson { Id = 8, Topic = "Image Optimization", Title = "next/image Component", Description = "Optimize images automatically.", CodeExample = "import Image from 'next/image'\n<Image src='/photo.jpg' alt='Photo' width={500} height={500} />", Output = "Optimized responsive image." },
            new Lesson { Id = 9, Topic = "Styling", Title = "CSS Modules", Description = "Scoped CSS for components.", CodeExample = "import styles from './Component.module.css'\n<div className={styles.container}>", Output = "Scoped CSS styling." },
            new Lesson { Id = 10, Topic = "Styling", Title = "Global CSS", Description = "Apply styles globally.", CodeExample = "// pages/_app.js\nimport '../styles/globals.css'", Output = "Global styling applied." },
            new Lesson { Id = 11, Topic = "Headless CMS", Title = "Integrating with Headless CMS", Description = "Fetch content from headless CMS.", CodeExample = "const res = await fetch('https://cms.example.com/api/posts')", Output = "Content from CMS." },
            new Lesson { Id = 12, Topic = "Headless CMS", Title = "Content Modeling", Description = "Structure content for headless CMS.", CodeExample = "{ title: 'Post Title', content: 'Post content...' }", Output = "Structured content model." },
            new Lesson { Id = 13, Topic = "SEO", Title = "SEO Best Practices", Description = "Optimize for search engines.", CodeExample = "import Head from 'next/head'\n<Head><title>Page Title</title></Head>", Output = "SEO-optimized page." },
            new Lesson { Id = 14, Topic = "SEO", Title = "Meta Tags", Description = "Add meta tags for SEO.", CodeExample = "<meta name='description' content='Page description' />", Output = "Meta tags for SEO." },
            new Lesson { Id = 15, Topic = "Performance", Title = "Bundle Analyzer", Description = "Analyze bundle sizes.", CodeExample = "npx @next/bundle-analyzer", Output = "Bundle size analysis." },
            new Lesson { Id = 16, Topic = "Performance", Title = "Code Splitting", Description = "Split code for faster loading.", CodeExample = "dynamic import for components", Output = "Code-split components." },
            new Lesson { Id = 17, Topic = "Environment Variables", Title = "Environment Variables", Description = "Use environment variables.", CodeExample = "process.env.NEXT_PUBLIC_API_URL", Output = "Accesses public env variable." },
            new Lesson { Id = 18, Topic = "Environment Variables", Title = "Server-only Variables", Description = "Keep secrets on the server.", CodeExample = "process.env.SECRET_KEY", Output = "Server-only environment variable." },
            new Lesson { Id = 19, Topic = "CSS & Styling", Title = "Styled-components", Description = "Use styled-components for CSS-in-JS.", CodeExample = "import styled from 'styled-components'\nconst Button = styled.button`color: red;`", Output = "Button with red text." },
            new Lesson { Id = 20, Topic = "Environment Variables", Title = "Using Environment Variables", Description = "NEXT_PUBLIC_ prefix exposes env vars to the browser.", CodeExample = "process.env.NEXT_PUBLIC_API_URL", Output = "Accesses public env variable." },
            new Lesson { Id = 21, Topic = "Middleware", Title = "Middleware in Next.js", Description = "Run code before a request is completed.", CodeExample = "// middleware.js\nexport function middleware(req) { ... }", Output = "Runs on every request." },
            new Lesson { Id = 22, Topic = "Authentication", Title = "Authentication Strategies", Description = "Use NextAuth.js or custom JWT for authentication.", CodeExample = "import { getSession } from 'next-auth/react'", Output = "Handles user sessions." },
            new Lesson { Id = 23, Topic = "Deployment", Title = "Deploying with Docker", Description = "Render.com is the recommended platform for Docker-based deployments.", CodeExample = "docker build -t nextjs-app .", Output = "Docker image for deployment." },
            new Lesson { Id = 24, Topic = "Performance", Title = "Performance Optimization", Description = "Use built-in analytics, image optimization, and code splitting.", CodeExample = "next build", Output = "Optimized production build." },
            new Lesson { Id = 25, Topic = "Error Handling", Title = "Custom Error Pages", Description = "Create _error.js or error.js for custom error handling.", CodeExample = "// pages/_error.js\nexport default function Error({ statusCode }) { ... }", Output = "Custom error page." },
            new Lesson { Id = 26, Topic = "Internationalization", Title = "i18n in Next.js", Description = "Configure i18n in next.config.js for multi-language support.", CodeExample = "i18n: { locales: ['en', 'fr'], defaultLocale: 'en' }", Output = "Supports multiple languages." },
            new Lesson { Id = 27, Topic = "ISR", Title = "Incremental Static Regeneration (ISR)", Description = "Update static content after deployment.", CodeExample = "getStaticProps({ revalidate: 10 })", Output = "Revalidates every 10 seconds." },
            new Lesson { Id = 28, Topic = "Preview Mode", Title = "Preview Mode", Description = "Preview draft content before publishing.", CodeExample = "res.setPreviewData({})", Output = "Enables preview mode." },
            new Lesson { Id = 29, Topic = "Advanced Features", Title = "Edge Functions", Description = "Run code at the edge for low latency.", CodeExample = "export const config = { runtime: 'edge' }", Output = "Runs at the edge." },
            new Lesson { Id = 30, Topic = "Testing", Title = "Testing Next.js Apps", Description = "Use Jest and React Testing Library for testing.", CodeExample = "import { render } from '@testing-library/react'", Output = "Renders component for testing." }
        };

        [HttpGet]
        public ActionResult<IEnumerable<Lesson>> GetAll()
        {
            if (Lessons == null || Lessons.Count == 0)
            {
                return StatusCode(500, "No lessons available.");
            }
            return Ok(Lessons);
        }

        [HttpGet("{id}")]
        public ActionResult<Lesson> Get(int id)
        {
            var lesson = Lessons.FirstOrDefault(l => l.Id == id);
            return lesson == null ? NotFound() : Ok(lesson);
        }
    }
}
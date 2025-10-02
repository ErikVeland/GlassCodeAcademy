using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class NextJsInterviewQuestionsController : ControllerBase
    {
        public static readonly List<InterviewQuestion> Questions = new List<InterviewQuestion>
        {
            new InterviewQuestion { Id = 1, Topic = "Routing", Type = "multiple-choice", Question = "How do you define a dynamic route in the Pages Router?", Choices = new[]{"[id].js","{id}.js","$id.js","id.js"}, CorrectAnswer = 0, Explanation = "[id].js defines a dynamic route." },
            new InterviewQuestion { Id = 2, Topic = "Routing", Type = "multiple-choice", Question = "How do you define a dynamic route in the App Router?", Choices = new[]{"[id]/page.js","{id}/page.js","$id/page.js","id/page.js"}, CorrectAnswer = 0, Explanation = "[id]/page.js defines a dynamic route." },
            new InterviewQuestion { Id = 3, Topic = "Data Fetching", Type = "multiple-choice", Question = "Which function runs only on the server?", Choices = new[]{"getServerSideProps","getStaticProps","getInitialProps","useEffect"}, CorrectAnswer = 0, Explanation = "getServerSideProps runs only on the server." },
            new InterviewQuestion { Id = 4, Topic = "Data Fetching", Type = "multiple-choice", Question = "Which function is used for static generation?", Choices = new[]{"getStaticProps","getServerSideProps","getInitialProps","useEffect"}, CorrectAnswer = 0, Explanation = "getStaticProps is used for static generation." },
            new InterviewQuestion { Id = 5, Topic = "Data Fetching", Type = "open-ended", Question = "What are the different data fetching methods in Next.js?", Choices = null, CorrectAnswer = null, Explanation = "getStaticProps, getServerSideProps, and getStaticPaths are the main data fetching methods." },
            new InterviewQuestion { Id = 6, Topic = "SSR vs SSG", Type = "multiple-choice", Question = "When should you use SSR over SSG?", Choices = new[]{"Dynamic data","Static content","SEO","Performance"}, CorrectAnswer = 0, Explanation = "Use SSR for dynamic data that changes frequently." },
            new InterviewQuestion { Id = 7, Topic = "API Routes", Type = "multiple-choice", Question = "Where do you define API routes in the Pages Router?", Choices = new[]{"pages/api","pages/_api","api","src/api"}, CorrectAnswer = 0, Explanation = "API routes are defined in pages/api." },
            new InterviewQuestion { Id = 8, Topic = "API Routes", Type = "open-ended", Question = "How do you handle different HTTP methods in an API route?", Choices = null, CorrectAnswer = null, Explanation = "Check req.method and handle each case accordingly in the API route handler." },
            new InterviewQuestion { Id = 9, Topic = "Image Optimization", Type = "multiple-choice", Question = "Which component optimizes images automatically?", Choices = new[]{"next/image","img","Image","picture"}, CorrectAnswer = 0, Explanation = "next/image optimizes images automatically." },
            new InterviewQuestion { Id = 10, Topic = "Image Optimization", Type = "open-ended", Question = "What are the benefits of using next/image?", Choices = null, CorrectAnswer = null, Explanation = "Automatic image optimization, lazy loading, and responsive images." },
            new InterviewQuestion { Id = 11, Topic = "Styling", Type = "multiple-choice", Question = "Which styling method is recommended for Next.js?", Choices = new[]{"CSS Modules","Styled-components","Tailwind CSS","All of the above"}, CorrectAnswer = 3, Explanation = "All methods are supported, but CSS Modules and Tailwind CSS are commonly used." },
            new InterviewQuestion { Id = 12, Topic = "Styling", Type = "open-ended", Question = "How do you use CSS Modules in Next.js?", Choices = null, CorrectAnswer = null, Explanation = "Create a file with .module.css extension and import it as a module." },
            new InterviewQuestion { Id = 13, Topic = "Headless CMS", Type = "multiple-choice", Question = "What is a headless CMS?", Choices = new[]{"Content-only backend","Full-stack solution","Frontend framework","Database"}, CorrectAnswer = 0, Explanation = "A headless CMS provides content-only backend services." },
            new InterviewQuestion { Id = 14, Topic = "Headless CMS", Type = "open-ended", Question = "How can you integrate a headless CMS with Next.js?", Choices = null, CorrectAnswer = null, Explanation = "Use API routes to fetch data from the CMS and display it in components." },
            new InterviewQuestion { Id = 15, Topic = "SEO", Type = "multiple-choice", Question = "Which component helps with SEO in Next.js?", Choices = new[]{"Head","Meta","SEO","next/head"}, CorrectAnswer = 3, Explanation = "next/head helps with SEO by managing document head." },
            new InterviewQuestion { Id = 16, Topic = "SEO", Type = "open-ended", Question = "How do you implement dynamic meta tags in Next.js?", Choices = null, CorrectAnswer = null, Explanation = "Use next/head in your page components and dynamically set meta tag content." },
            new InterviewQuestion { Id = 17, Topic = "Performance", Type = "multiple-choice", Question = "Which tool analyzes Next.js bundles?", Choices = new[]{"@next/bundle-analyzer","webpack-bundle-analyzer","lighthouse","next/performance"}, CorrectAnswer = 0, Explanation = "@next/bundle-analyzer analyzes Next.js bundles." },
            new InterviewQuestion { Id = 18, Topic = "Performance", Type = "open-ended", Question = "What are some performance optimization techniques in Next.js?", Choices = null, CorrectAnswer = null, Explanation = "Code splitting, image optimization, caching, and lazy loading." },
            new InterviewQuestion { Id = 19, Topic = "Environment Variables", Type = "multiple-choice", Question = "Which prefix exposes env vars to the browser?", Choices = new[]{"NEXT_PUBLIC_","REACT_APP_","PUBLIC_","CLIENT_"}, CorrectAnswer = 0, Explanation = "NEXT_PUBLIC_ exposes env vars to the browser." },
            new InterviewQuestion { Id = 20, Topic = "Environment Variables", Type = "multiple-choice", Question = "Which prefix exposes env vars to the browser?", Choices = new[]{"NEXT_PUBLIC_","REACT_APP_","PUBLIC_","CLIENT_"}, CorrectAnswer = 0, Explanation = "NEXT_PUBLIC_ exposes env vars to the browser." },
            new InterviewQuestion { Id = 21, Topic = "Middleware", Type = "multiple-choice", Question = "What is the purpose of middleware.js?", Choices = new[]{"Run code before requests","Define layouts","Handle errors","Optimize images"}, CorrectAnswer = 0, Explanation = "middleware.js runs code before requests." },
            new InterviewQuestion { Id = 22, Topic = "Authentication", Type = "open-ended", Question = "How can you implement authentication in Next.js?", Choices = null, CorrectAnswer = null, Explanation = "Use NextAuth.js, custom JWT, or integrate with OAuth providers." },
            new InterviewQuestion { Id = 23, Topic = "Deployment", Type = "multiple-choice", Question = "Which platform is recommended for deploying Next.js?", Choices = new[]{"Render.com","Netlify","Heroku","AWS"}, CorrectAnswer = 0, Explanation = "Render.com is the recommended platform for Docker-based deployments." },
            new InterviewQuestion { Id = 24, Topic = "Performance", Type = "multiple-choice", Question = "Which feature helps optimize images automatically?", Choices = new[]{"next/image","next/optimize","img tag","ImageOptimizer"}, CorrectAnswer = 0, Explanation = "next/image optimizes images." },
            new InterviewQuestion { Id = 25, Topic = "Performance", Type = "open-ended", Question = "How does code splitting work in Next.js?", Choices = null, CorrectAnswer = null, Explanation = "Each page is automatically code-split; only the code for the current page is loaded." },
            new InterviewQuestion { Id = 26, Topic = "Error Handling", Type = "multiple-choice", Question = "How do you create a custom error page in the Pages Router?", Choices = new[]{"_error.js","error.js","404.js","customError.js"}, CorrectAnswer = 0, Explanation = "_error.js is used for custom error pages." },
            new InterviewQuestion { Id = 27, Topic = "Error Handling", Type = "multiple-choice", Question = "How do you create a 404 page?", Choices = new[]{"404.js","_error.js","notfound.js","error404.js"}, CorrectAnswer = 0, Explanation = "404.js is used for custom 404 pages." },
            new InterviewQuestion { Id = 28, Topic = "Internationalization", Type = "open-ended", Question = "How do you enable i18n in Next.js?", Choices = null, CorrectAnswer = null, Explanation = "Configure i18n in next.config.js with locales and defaultLocale." },
            new InterviewQuestion { Id = 29, Topic = "ISR", Type = "multiple-choice", Question = "What does ISR stand for?", Choices = new[]{"Incremental Static Regeneration","Instant Server Rendering","Internal Static Routing","Incremental Server Rendering"}, CorrectAnswer = 0, Explanation = "ISR is Incremental Static Regeneration." },
            new InterviewQuestion { Id = 30, Topic = "ISR", Type = "open-ended", Question = "How do you enable ISR for a page?", Choices = null, CorrectAnswer = null, Explanation = "Return a revalidate property from getStaticProps." },
            new InterviewQuestion { Id = 31, Topic = "Preview Mode", Type = "multiple-choice", Question = "What is Preview Mode used for?", Choices = new[]{"Previewing draft content","Testing middleware","Optimizing images","Debugging API routes"}, CorrectAnswer = 0, Explanation = "Preview Mode lets you preview draft content." },
            new InterviewQuestion { Id = 32, Topic = "Advanced Features", Type = "multiple-choice", Question = "What is an Edge Function?", Choices = new[]{"Runs code at the edge","Optimizes images","Handles errors","Defines layouts"}, CorrectAnswer = 0, Explanation = "Edge Functions run code at the edge for low latency." },
            new InterviewQuestion { Id = 33, Topic = "Testing", Type = "open-ended", Question = "How do you test a Next.js component?", Choices = null, CorrectAnswer = null, Explanation = "Use Jest and React Testing Library to render and test components." },
            new InterviewQuestion { Id = 34, Topic = "App Router", Type = "multiple-choice", Question = "Which file is required in every folder in the App Router?", Choices = new[]{"page.js","index.js","main.js","route.js"}, CorrectAnswer = 0, Explanation = "page.js is required in every route folder." },
            new InterviewQuestion { Id = 35, Topic = "App Router", Type = "open-ended", Question = "What are React Server Components and how are they used in Next.js?", Choices = null, CorrectAnswer = null, Explanation = "Server Components run on the server by default in the App Router, enabling better performance and data fetching." }
        };

        [HttpGet]
        public ActionResult<IEnumerable<InterviewQuestion>> GetAll()
        {
            return Ok(Questions);
        }

        [HttpGet("by-topic/{topic}")]
        public ActionResult<IEnumerable<InterviewQuestion>> GetByTopic(string topic)
        {
            var filtered = Questions.Where(q => q.Topic != null && q.Topic.Equals(topic, StringComparison.OrdinalIgnoreCase)).ToList();
            return Ok(filtered);
        }

        [HttpPost("submit")] // expects { questionId, answerIndex }
        public ActionResult<AnswerResult> SubmitAnswer([FromBody] AnswerSubmission submission)
        {
            var question = Questions.FirstOrDefault(q => q.Id == submission.QuestionId);
            if (question == null)
                return NotFound();
            bool isCorrect = question.Type == "open-ended" || (question.CorrectAnswer.HasValue && submission.AnswerIndex == question.CorrectAnswer.Value);
            return Ok(new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            });
        }
    }
}
# Backend Health: Minimal Content Requirements

This guide documents the minimal JSON files required to keep the backend `/api/health` endpoint healthy. Each category must have:

- One lessons file under `content/lessons/<file>.json`
- One interview questions file under `content/quizzes/<file>.json`

If any category has zero lessons or zero questions, health will degrade and CI will fail.

## Required Files Per Category

- DotNet
  - `content/lessons/dotnet-fundamentals.json`
  - `content/quizzes/dotnet-fundamentals.json`
- GraphQL
  - `content/lessons/graphql-advanced.json`
  - `content/quizzes/graphql-advanced.json`
- Laravel
  - `content/lessons/laravel-fundamentals.json`
  - `content/quizzes/laravel-fundamentals.json`
- React
  - `content/lessons/react-fundamentals.json`
  - `content/quizzes/react-fundamentals.json`
- Tailwind
  - `content/lessons/tailwind-advanced.json`
  - `content/quizzes/tailwind-advanced.json`
- Node
  - `content/lessons/node-fundamentals.json`
  - `content/quizzes/node-fundamentals.json`
- Sass
  - `content/lessons/sass-advanced.json`
  - `content/quizzes/sass-advanced.json`
- Vue
  - `content/lessons/vue-advanced.json`
  - `content/quizzes/vue-advanced.json`
- TypeScript
  - `content/lessons/typescript-fundamentals.json`
  - `content/quizzes/typescript-fundamentals.json`
- Database
  - `content/lessons/database-systems.json`
  - `content/quizzes/database-systems.json`
- Testing
  - `content/lessons/testing-fundamentals.json`
  - `content/quizzes/testing-fundamentals.json`
- Programming
  - `content/lessons/programming-fundamentals.json`
  - `content/quizzes/programming-fundamentals.json`
- Web
  - `content/lessons/web-fundamentals.json`
  - `content/quizzes/web-fundamentals.json`
- Next.js
  - `content/lessons/nextjs-advanced.json`
  - `content/quizzes/nextjs-advanced.json`
- Performance
  - `content/lessons/performance-optimization.json`
  - `content/quizzes/performance-optimization.json`
- Security
  - `content/lessons/security-fundamentals.json`
  - `content/quizzes/security-fundamentals.json`
- Version Control
  - `content/lessons/version-control.json`
  - `content/quizzes/version-control.json`

## Minimal JSON Examples

Lessons (array of lessons):

```json
[
  {
    "id": "intro",
    "title": "Introduction",
    "description": "A minimal lesson to keep counts non-zero"
  }
]
```

Interview Questions (either array or wrapped in an object with `questions`):

```json
[
  {
    "id": "q1",
    "question": "What is X?",
    "choices": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "Minimal explanation"
  }
]
```

or

```json
{
  "questions": [
    {
      "id": "q1",
      "question": "What is X?",
      "choices": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Minimal explanation"
    }
  ]
}
```

## CI Enforcement

- A test (`Backend.Tests/Services/HealthCountsTests.cs`) asserts every category has non-empty lessons and questions.
- The GitHub Actions workflow (`.github/workflows/backend-health.yml`) runs backend tests with `GLASSCODE_CONTENT_PATH` set to `${{ github.workspace }}/content`.
- If any category drops to zero, tests fail and CI turns red.

## Troubleshooting

- Verify required filenames match exactly.
- Ensure JSON is valid; use `scripts/json-clean.sh` or `content/json-fix.sh`.
- Confirm environment variable `GLASSCODE_CONTENT_PATH` points to the repo `content` folder in CI.
- Check the health endpoint directly: `curl "http://127.0.0.1:8080/api/health?unlock=1"`.
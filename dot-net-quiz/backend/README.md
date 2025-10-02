# Fullstack Academy Backend

This is the backend application for the Fullstack Academy project, built with .NET 9 and GraphQL.

## Deployment Options

Since the frontend is deployed separately, you'll need to deploy the .NET backend separately. Here are several options:

### Docker Deployment (Recommended)

This application is designed for Docker deployment using either docker-compose or individual container deployment.

#### Using Docker Compose (Local Development)
```bash
docker-compose up --build
```

This will start both the frontend (on port 3000) and backend (on port 8080) services.

#### Individual Container Deployment
Build and run each service separately:

**Backend:**
```bash
cd dot-net-quiz/backend
docker build -t fullstack-backend .
docker run -p 8080:8080 fullstack-backend
```

### Render.com (Recommended for Cloud Deployment)

1. Fork this repository to your GitHub account
2. Create a new Web Service on Render for the backend component:
   - Use the Docker runtime
   - Set the root directory to `dot-net-quiz/backend`
   - Configure environment variables as needed

### Azure App Service

1. Create an Azure App Service:
   - Choose .NET runtime
   - Select appropriate region
   - Configure scaling options

2. Deploy the backend:
   ```bash
   cd dot-net-quiz/backend
   dotnet publish -c Release
   ```

3. Configure the App Service:
   - Set .NET runtime version to 9.0
   - Configure custom domain if needed
   - Set up SSL certificate

4. Update CORS settings in `Program.cs` to allow your frontend domain:
   ```csharp
   builder.Services.AddCors(options =>
   {
       options.AddPolicy("AllowFrontend",
           policy => policy.WithOrigins(
               "http://localhost:3000", 
               "https://your-render-domain.onrender.com",
               "https://your-custom-domain.com")
                           .AllowAnyHeader()
                           .AllowAnyMethod());
   });
   ```

### AWS Elastic Beanstalk

1. Create an Elastic Beanstalk application
2. Configure for .NET platform
3. Deploy using the Elastic Beanstalk CLI

### Google Cloud Run

1. Containerize the .NET application
2. Deploy container to Cloud Run
3. Configure authentication and scaling

### DigitalOcean App Platform

1. Create an app
2. Link your GitHub repository
3. Configure for .NET runtime
4. Deploy automatically on push

## Configuration Files

### Backend Configuration (appsettings.json)
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

## Testing the Backend

Before testing the frontend integration, verify the backend is working:

1. Test Laravel lessons query
   ```bash
   curl -X POST -H "Content-Type: application/json" \
   -d '{"query":"{ laravelLessons { id title topic } }"}' \
   http://your-backend-url/graphql
   ```
   
2. Test React lessons query
   ```bash
   curl -X POST -H "Content-Type: application/json" \
   -d '{"query":"{ reactLessons { id title topic } }"}' \
   http://your-backend-url/graphql
   ```

3. Test GraphQL mutations
   ```bash
   curl -X POST -H "Content-Type: application/json" \
   -d '{"query":"mutation { submitLaravelAnswer(questionId: 1, answerIndex: 0) { isCorrect explanation } }"}' \
   http://your-backend-url/graphql
   ```

## Local Development

1. Run the backend server:
   ```bash
   dotnet run
   ```

The backend will be available at http://localhost:5022.

2. Test GraphQL endpoints:
   - GraphQL API: http://localhost:5022/graphql
   - GraphQL UI: http://localhost:5022/graphql-ui
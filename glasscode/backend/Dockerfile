# Dockerfile for .NET Backend
# Simpler approach to avoid build issues
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy everything
COPY . .

# Restore dependencies
RUN dotnet restore

# Build and publish
RUN dotnet publish -c Release -o out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

# Copy published app
COPY --from=build /app/out .

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://*:8080
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run the app
ENTRYPOINT ["dotnet", "backend.dll"]
# Simple Dockerfile for .NET Backend Only
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY glasscode/backend/. ./glasscode/backend/
WORKDIR /src/glasscode/backend
RUN dotnet restore
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://*:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]
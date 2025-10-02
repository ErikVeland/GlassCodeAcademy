# Reproduce the exact error from the logs
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY dot-net-quiz/backend/. ./dot-net-quiz/backend/
WORKDIR /src/dot-net-quiz/backend
RUN dotnet restore
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://*:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]
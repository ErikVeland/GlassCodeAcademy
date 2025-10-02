# Startup Scripts

This project provides several ways to start both the backend and frontend servers.

## Available Scripts

### 1. Using npm (from project root)
```bash
npm start          # Runs the main start script
npm run start:dev  # Runs the development start script
npm run start:both # Same as start:dev
```

### 2. Using bash scripts directly
```bash
./start.sh       # Main startup script
./start-dev.sh   # Development startup script
```

## What each script does

- **start.sh**: Updated version of the original startup script that starts both servers with proper cleanup
- **start-dev.sh**: New development-focused script that starts both servers in development mode

Both scripts will:
1. Start the .NET backend on port 5023
2. Start the Next.js frontend on port 3000
3. Provide clean shutdown when you press Ctrl+C

## Prerequisites

Make sure you have:
- .NET 8.0 SDK installed
- Node.js (version 18 or higher) installed
- All npm dependencies installed in the frontend directory (`npm install`)

## Usage

1. Make sure you're in the project root directory
2. Run one of the commands above
3. Access the applications:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5023
   - GraphQL Playground: http://localhost:5023/graphql
4. Press Ctrl+C to stop both servers
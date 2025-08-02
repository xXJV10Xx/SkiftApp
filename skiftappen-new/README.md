# Skiftappen

A shift scheduling application built with React Native/Expo frontend and Node.js backend.

## Project Structure

```
skiftappen/
├── package.json          # Main project configuration
├── .env                  # Environment variables (copy to .env.local)
├── scripts/              # Utility scripts
│   ├── scrape-all.cjs    # Web scraper for shift data
│   ├── generate-schemas.cjs # Generate schemas.json
│   └── schemas.json      # Schema configuration for scraping
├── backend/              # Node.js/Express API server
│   ├── server.js         # Main server file
│   └── package.json      # Backend dependencies
└── frontend/             # React Native/Expo mobile app
    ├── app/              # App router pages
    ├── components/       # Reusable components
    ├── constants/        # App constants
    ├── hooks/            # Custom React hooks
    ├── assets/           # Images, fonts, etc.
    ├── app.json          # Expo configuration
    ├── eas.json          # Expo Application Services config
    └── package.json      # Frontend dependencies
```

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies (root, frontend, and backend)
npm run install:all
```

### 2. Environment Setup

```bash
# Copy the environment template
cp .env .env.local

# Edit .env.local with your actual values
# - Database credentials
# - Supabase keys
# - API configuration
```

### 3. Generate Schemas (Optional)

```bash
# Generate schemas.json from skiftschema.se
cd scripts
node generate-schemas.cjs
```

### 4. Start Development

```bash
# Start both frontend and backend in development mode
npm run dev

# Or start them separately:
npm run backend:dev    # Start backend on port 3001
npm run frontend:dev   # Start Expo development server
```

## Available Scripts

### Root Level
- `npm start` - Start frontend only
- `npm run dev` - Start both frontend and backend
- `npm run install:all` - Install all dependencies
- `npm run scrape` - Run the web scraper
- `npm run build` - Build the frontend for production

### Frontend
- `npm run frontend:start` - Start Expo development server
- `npm run frontend:android` - Run on Android
- `npm run frontend:ios` - Run on iOS
- `npm run frontend:web` - Run on web

### Backend
- `npm run backend:start` - Start production server
- `npm run backend:dev` - Start development server with nodemon

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /health` - Health check
- `GET /api/shifts` - Get all shifts
- `GET /api/shifts/team/:team` - Get shifts for specific team
- `GET /api/shifts/range?start_date=&end_date=` - Get shifts in date range
- `GET /api/teams` - Get all unique teams

## Technologies Used

### Frontend
- React Native with Expo
- Expo Router for navigation
- TypeScript support

### Backend
- Node.js with Express
- Supabase for database
- CORS enabled for cross-origin requests

### Scraping
- Puppeteer for web scraping
- Cheerio for HTML parsing
- Automated data collection from skiftschema.se

## Development

1. Make sure you have Node.js 18+ installed
2. Install Expo CLI: `npm install -g @expo/cli`
3. Set up your Supabase project and add credentials to `.env.local`
4. Run `npm run install:all` to install dependencies
5. Start development with `npm run dev`

## Deployment

- Frontend: Use Expo Application Services (EAS) for mobile app deployment
- Backend: Deploy to any Node.js hosting service (Heroku, Railway, etc.)
- Make sure to set environment variables in your deployment platform
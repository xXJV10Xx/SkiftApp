# 🚀 Complete Deployment Guide for SSAB Skiftschema Premium

## 📋 Overview

This guide covers deployment to all major platforms: GitHub, Supabase, Vercel, Netlify, Replit, Loveable, and Cursor AI.

## 🔧 Prerequisites

- Node.js 18+
- Git
- Supabase account
- GitHub account
- Platform-specific accounts (Vercel, Netlify, etc.)

## 1. 📦 GitHub Repository Setup

### Step 1: Initialize Git Repository

```bash
cd C:\Users\jimve\skiftappen
git init
git add .
git commit -m "Initial commit: SSAB Skiftschema Premium"
```

### Step 2: Create GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
2. Name: `ssab-skiftschema-premium`
3. Description: "Premium shift scheduling for SSAB Oxelösund teams 31-35"
4. Set to Public or Private
5. Don't initialize with README (we already have one)

### Step 3: Push to GitHub

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ssab-skiftschema-premium.git
git push -u origin main
```

### Step 4: Configure GitHub Secrets

Go to Settings > Secrets and variables > Actions and add:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://your-domain.com
VERCEL_TOKEN=your-vercel-token
ORG_ID=your-vercel-org-id
PROJECT_ID=your-vercel-project-id
NETLIFY_AUTH_TOKEN=your-netlify-token
NETLIFY_SITE_ID=your-netlify-site-id
```

## 2. 🗄️ Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization
4. Project name: `ssab-skiftschema-premium`
5. Database password: Generate strong password
6. Region: Europe West (closest to Sweden)

### Step 2: Setup Database

1. Go to SQL Editor
2. Copy content from `supabase_schema.sql`
3. Run the script
4. Verify tables are created

### Step 3: Configure Authentication

#### Enable Providers:
- Email (enabled by default)
- Google OAuth
- Apple OAuth

#### Google OAuth Setup:
1. Go to Google Cloud Console
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret to Supabase

#### Apple OAuth Setup:
1. Apple Developer account required
2. Create App ID and Services ID
3. Configure Apple Sign-In
4. Copy credentials to Supabase

### Step 4: Configure URLs

Add these URLs to Authentication > URL Configuration:
- Site URL: `https://your-domain.com`
- Redirect URLs: 
  - `https://your-domain.com/auth/callback`
  - `http://localhost:3001/auth/callback`

## 3. ⚡ Vercel Deployment

### Option A: GitHub Integration (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: Other
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`
7. Deploy

### Option B: Vercel CLI

```bash
npm i -g vercel
cd frontend
vercel --prod
```

## 4. 🌐 Netlify Deployment

### Option A: Git Integration

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Choose your repository
5. Configure:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
6. Add Environment Variables
7. Deploy

### Option B: Netlify CLI

```bash
npm install -g netlify-cli
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

## 5. 🔄 Replit Setup

### Step 1: Import from GitHub

1. Go to [replit.com](https://replit.com)
2. Click "Create Repl"
3. Choose "Import from GitHub"
4. Enter your repository URL
5. Replit will automatically detect `.replit` configuration

### Step 2: Configure Environment

1. Go to Secrets tab
2. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL` (auto-generated)

### Step 3: Run

Click the Run button - Replit will automatically:
- Install dependencies
- Build the frontend
- Start both servers

## 6. 💖 Loveable Deployment

### Step 1: GitHub Integration

1. Go to [loveable.dev](https://loveable.dev)
2. Sign in with GitHub
3. Click "Import Project"
4. Select your repository

### Step 2: Configuration

Loveable will automatically detect:
- `loveable.config.json` configuration
- React + Vite frontend
- Express.js backend
- Supabase database

### Step 3: Environment Setup

1. Configure environment variables in Loveable dashboard
2. Connect Supabase project
3. Deploy

### Step 4: Custom Domain (Optional)

1. Go to Settings > Domains
2. Add your custom domain
3. Configure DNS records

## 7. 🤖 Cursor AI Workspace

### Step 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/ssab-skiftschema-premium.git
cd ssab-skiftschema-premium
```

### Step 2: Open in Cursor

1. Install Cursor AI
2. Open project folder
3. Cursor will automatically detect:
   - `.vscode/settings.json` configuration
   - Recommended extensions
   - Launch configurations

### Step 3: Install Extensions

Cursor will prompt to install recommended extensions:
- TypeScript support
- ESLint
- Prettier
- Supabase extension
- React snippets

### Step 4: Configure AI Features

1. Enable Copilot mode
2. Configure AI chat
3. Set up auto-completion

## 8. 🐳 Docker Deployment

### Local Docker

```bash
docker-compose up -d
```

### Docker Hub

```bash
# Build and push frontend
cd frontend
docker build -t your-username/ssab-frontend .
docker push your-username/ssab-frontend

# Build and push backend
cd ../backend
docker build -t your-username/ssab-backend .
docker push your-username/ssab-backend
```

## 9. 📱 Progressive Web App (PWA)

### Update Frontend for PWA

```bash
cd frontend
npm install vite-plugin-pwa workbox-window
```

Add to `vite.config.js`:

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'SSAB Skiftschema Premium',
        short_name: 'SSAB Shifts',
        description: 'Premium shift scheduling for SSAB Oxelösund',
        theme_color: '#2563eb',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

## 10. 🔍 Monitoring & Analytics

### Supabase Analytics

1. Go to Supabase dashboard
2. Navigate to Analytics
3. Monitor API usage, auth events, database performance

### Vercel Analytics

```bash
npm install @vercel/analytics
```

Add to main.jsx:

```javascript
import { Analytics } from '@vercel/analytics/react'

// Add <Analytics /> to your app
```

### Error Tracking (Sentry)

```bash
npm install @sentry/react @sentry/tracing
```

## 🎯 Production Checklist

### Security
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] Supabase RLS policies active
- [ ] HTTPS enabled
- [ ] OAuth providers configured

### Performance
- [ ] Frontend built and minified
- [ ] Images optimized
- [ ] Caching configured
- [ ] CDN enabled

### Monitoring
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Health checks working
- [ ] Logging configured

### Testing
- [ ] All features tested
- [ ] Authentication flows verified
- [ ] Mobile responsiveness checked
- [ ] Cross-browser compatibility

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+)
   - Verify environment variables
   - Clear node_modules and reinstall

2. **Supabase Connection**
   - Verify URL and keys
   - Check network connectivity
   - Validate database schema

3. **Authentication Issues**
   - Check OAuth configuration
   - Verify redirect URLs
   - Test with different providers

4. **Deployment Failures**
   - Check build logs
   - Verify configuration files
   - Test locally first

### Getting Help

- 📧 Email: support@ssab-skiftschema.com
- 💬 GitHub Issues: Create issue in repository
- 📖 Documentation: Check platform-specific docs

## 🎉 Success!

Your SSAB Skiftschema Premium app is now deployed across multiple platforms:

- **Frontend**: Vercel/Netlify
- **Backend**: Supabase Edge Functions
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Source Code**: GitHub
- **Development**: Cursor AI/Replit
- **Monitoring**: Vercel Analytics + Supabase

The app is ready for production use! 🚀
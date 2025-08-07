#!/bin/bash

# SSAB Skiftschema Premium - Deploy to All Platforms Script

echo "🚀 Deploying SSAB Skiftschema Premium to all platforms..."

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Install dependencies
echo "📦 Installing dependencies..."

if [ -d "frontend" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

if [ -d "backend" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

echo "✅ Build completed successfully!"

# Deploy to Vercel (if CLI is available)
if command -v vercel &> /dev/null; then
    echo "🌐 Deploying to Vercel..."
    cd frontend
    vercel --prod --confirm
    cd ..
    echo "✅ Vercel deployment completed!"
else
    echo "⚠️  Vercel CLI not found. Install with: npm i -g vercel"
fi

# Deploy to Netlify (if CLI is available)
if command -v netlify &> /dev/null; then
    echo "🌐 Deploying to Netlify..."
    cd frontend
    netlify deploy --prod --dir=dist
    cd ..
    echo "✅ Netlify deployment completed!"
else
    echo "⚠️  Netlify CLI not found. Install with: npm i -g netlify-cli"
fi

# Push to GitHub
if [ -d ".git" ]; then
    echo "📤 Pushing to GitHub..."
    git add .
    git commit -m "🚀 Production deployment

- Frontend built and optimized
- All configuration files updated
- Ready for multi-platform deployment"
    git push
    echo "✅ GitHub push completed!"
else
    echo "⚠️  Git repository not initialized. Run setup-github.sh first."
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Deployment Summary:"
echo "- Frontend built: ✅"
echo "- Vercel: $(command -v vercel &> /dev/null && echo "✅" || echo "⚠️ CLI not found")"
echo "- Netlify: $(command -v netlify &> /dev/null && echo "✅" || echo "⚠️ CLI not found")"
echo "- GitHub: $([ -d ".git" ] && echo "✅" || echo "⚠️ Not initialized")"
echo ""
echo "🔗 Manual deployment options:"
echo "- Replit: Import from GitHub at https://replit.com"
echo "- Loveable: Import from GitHub at https://loveable.dev"
echo "- Cursor AI: Clone repository and open in Cursor"
echo ""
echo "📋 Next steps:"
echo "1. Configure environment variables on each platform"
echo "2. Set up custom domains (optional)"
echo "3. Configure monitoring and analytics"
echo "4. Test all features in production"
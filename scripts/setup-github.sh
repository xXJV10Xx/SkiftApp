#!/bin/bash

# SSAB Skiftschema Premium - GitHub Setup Script

echo "🏭 Setting up GitHub repository for SSAB Skiftschema Premium..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git repository if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Add all files
echo "📁 Adding files to Git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: SSAB Skiftschema Premium

✨ Features:
- Multi-provider authentication (Google, Apple, Email)
- Interactive shift calendar with 17 years of data
- Team management and statistics
- Real-time chat system ready
- Mobile-responsive PWA design
- Swedish localization
- Supabase integration

🚀 Ready for deployment to Vercel, Netlify, Replit, and more!"

# Set main branch
git branch -M main

echo "✅ Git repository initialized successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create repository on GitHub: https://github.com/new"
echo "2. Name it: ssab-skiftschema-premium"
echo "3. Run: git remote add origin https://github.com/YOUR_USERNAME/ssab-skiftschema-premium.git"
echo "4. Run: git push -u origin main"
echo ""
echo "🔧 Don't forget to configure GitHub Secrets for CI/CD:"
echo "- VITE_SUPABASE_URL"
echo "- VITE_SUPABASE_ANON_KEY"
echo "- VITE_APP_URL"
echo "- VERCEL_TOKEN (if using Vercel)"
echo "- NETLIFY_AUTH_TOKEN (if using Netlify)"
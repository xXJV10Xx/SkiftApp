# 🏭 SSAB Oxelösund Skiftschema Premium

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ssab-skiftschema-premium)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/ssab-skiftschema-premium)
[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/your-username/ssab-skiftschema-premium)

## 📋 Overview

Premium shift scheduling application for SSAB Oxelösund teams 31-35. Features complete 3-shift rotation system with authentication, real-time chat, and advanced analytics.

### ✨ Features

- 🔐 **Multi-provider Authentication** (Google, Apple, Email)
- 📅 **Interactive Shift Calendar** with 17 years of data (2023-2040)
- 👥 **Team Management** with color-coded visualization
- 📊 **Advanced Statistics** and analytics
- 💬 **Real-time Team Chat** (Supabase Realtime)
- 📱 **Mobile-Responsive** PWA design
- 🌍 **Swedish Localization** with proper calendar support
- 💳 **Subscription Management** (Free/Basic/Premium tiers)
- 🔔 **Push Notifications** for shift reminders
- 📤 **Calendar Export** (CSV, ICS formats)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ssab-skiftschema-premium.git
cd ssab-skiftschema-premium

# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Configure environment
cp frontend/.env.example frontend/.env
# Update .env with your Supabase credentials

# Setup database
# Run supabase_schema.sql in your Supabase SQL Editor

# Start development servers
cd backend && npm start      # Port 3002
cd frontend && npm run dev   # Port 3001
```

Visit `http://localhost:3001` to see the app.

## 🔧 Tech Stack

### Frontend
- **React 18** with Hooks and Context
- **Vite** for fast development
- **React Router** for navigation
- **Lucide React** for icons
- **Supabase Auth UI** for authentication

### Backend
- **Express.js** REST API
- **CORS** enabled for cross-origin requests
- **Custom SSAB shift calculation** engine

### Database & Auth
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security
- **Real-time subscriptions** for chat

### Deployment Ready
- **Vercel** / **Netlify** for frontend
- **Supabase Edge Functions** for serverless backend
- **Docker** support included

## 📁 Project Structure

```
ssab-skiftschema-premium/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── contexts/        # React contexts
│   │   ├── lib/            # Supabase client
│   │   └── services/       # API services
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Express.js API
│   ├── server.js           # Main server
│   ├── ssab-system.js      # Shift calculation
│   └── package.json
├── supabase_schema.sql     # Database schema
├── docker-compose.yml      # Docker configuration
└── README.md
```

## 🎯 SSAB Shift System

### Rotation Patterns
- **Team 31-33**: 3F → 2E → 2N → 5L (12-day cycle)
- **Team 34**: 2F → 3E → 2N → 5L (12-day cycle) 
- **Team 35**: 2F → 2E → 3N → 4L (11-day cycle)

### Shift Times
- **F (Förmiddag)**: 06:00 - 14:00
- **E (Eftermiddag)**: 14:00 - 22:00  
- **N (Natt)**: 22:00 - 06:00
- **L (Ledig)**: Free day

## 🔐 Authentication Setup

### Supabase Configuration

1. Create project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase_schema.sql`
3. Configure OAuth providers:

#### Google OAuth
```bash
# Add to Supabase Auth settings
Client ID: your-google-client-id
Client Secret: your-google-client-secret
Redirect URL: https://your-project.supabase.co/auth/v1/callback
```

#### Apple OAuth
```bash
# Add to Supabase Auth settings  
Client ID: your.app.bundle.id
Team ID: your-apple-team-id
Key ID: your-apple-key-id
Private Key: your-apple-private-key
```

### Environment Variables

```env
# Frontend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://your-domain.com

# Backend (optional for local development)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
cd frontend
vercel --prod
```

### Netlify
```bash
cd frontend
npm run build
# Deploy dist/ folder to Netlify
```

### Docker
```bash
docker-compose up -d
```

### Supabase Edge Functions
```bash
cd supabase/functions
supabase functions deploy
```

## 📊 Premium Features

### Subscription Tiers

| Feature | Free | Basic (39kr/mån) | Premium (99kr/mån) |
|---------|------|------------------|-------------------|
| Basic Schedule | ✅ | ✅ | ✅ |
| Team Chat | ❌ | ✅ | ✅ |
| Advanced Statistics | ❌ | ✅ | ✅ |
| Calendar Sync | ❌ | ❌ | ✅ |
| Push Notifications | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- SSAB Oxelösund for the shift pattern specifications
- Supabase team for the excellent backend-as-a-service
- React and Vite communities for amazing tools

## 📞 Support

- 📧 Email: support@ssab-skiftschema.com
- 💬 Discord: [Join our server](https://discord.gg/ssab-skiftschema)
- 📖 Docs: [Full documentation](https://docs.ssab-skiftschema.com)

---

Made with ❤️ for SSAB Oxelösund workers | Premium scheduling experience worth 100 million kronor 💎
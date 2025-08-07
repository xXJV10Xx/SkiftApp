# SSAB Skiftschema Premium - Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization and enter project details:
   - Name: `ssab-skiftschema-premium`
   - Database Password: Generate a strong password
   - Region: Europe (closest to Sweden)

## 2. Database Setup

1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the entire content of `supabase_schema.sql`
3. Run the script to create all tables, functions, and policies

## 3. Authentication Setup

### Enable Authentication Providers

1. Go to Authentication > Providers in Supabase dashboard
2. Enable the following providers:

#### Email Provider
- Already enabled by default
- Configure email templates if needed

#### Google OAuth
1. Create a Google Cloud Project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:3001/auth/callback` (for development)
5. Copy Client ID and Client Secret to Supabase

#### Apple OAuth (iOS)
1. Create Apple Developer account
2. Create App ID and Services ID
3. Configure Apple Sign-In capability
4. Add domain and redirect URLs
5. Copy Client ID and Team ID to Supabase

### Configure Redirect URLs
Add these URLs to your Supabase Authentication settings:
- `http://localhost:3001/auth/callback`
- `https://your-domain.com/auth/callback`

## 4. Environment Configuration

1. Copy `.env.example` to `.env` in the frontend directory
2. Update the values with your Supabase project details:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=http://localhost:3001
```

## 5. Testing the Setup

1. Start the backend: `cd backend && node server.js`
2. Start the frontend: `cd frontend && npm run dev`
3. Open http://localhost:3001
4. Test authentication flow:
   - Click "Logga in"
   - Try email signup/signin
   - Try Google OAuth (if configured)
   - Complete profile setup
   - Verify user appears in Supabase dashboard

## 6. Production Deployment

### Supabase Configuration
1. Update redirect URLs for production domain
2. Configure email templates with your branding
3. Set up custom SMTP (optional)

### Environment Variables for Production
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=https://your-domain.com
```

## 7. Database Schema Overview

### Tables Created:
- **profiles**: User profiles extending auth.users
- **teams**: SSAB team configurations (31-35)
- **subscriptions**: User subscription management
- **chat_rooms**: Team and general chat rooms
- **chat_messages**: Chat message storage
- **user_preferences**: User settings and preferences

### Security:
- Row Level Security (RLS) enabled on all tables
- Policies ensure users can only access their own data
- Team-based access for chat functionality

## 8. Features Implemented:

✅ **Authentication**
- Multi-provider OAuth (Google, Apple, Email)
- Automatic profile creation
- Secure session management

✅ **User Profiles**
- Company/team selection
- Profile customization
- Preference management

✅ **Premium UI**
- Landing page for non-authenticated users
- Premium branding and styling
- Mobile-responsive design

✅ **Team Management**
- Team-based data access
- Color-coded team identification
- Profile-driven team selection

## 9. Next Steps for Full Premium App:

🚧 **Chat System**: Real-time messaging using Supabase Realtime
🚧 **Subscription Management**: Stripe integration for payments
🚧 **Push Notifications**: Web push and email notifications
🚧 **Calendar Sync**: Google/Apple Calendar integration
🚧 **PWA Features**: Native app-like experience
🚧 **Widgets**: Desktop/mobile widgets

## 10. Development Commands:

```bash
# Install dependencies
cd frontend && npm install

# Start development servers
cd backend && node server.js  # Port 3002
cd frontend && npm run dev     # Port 3001

# Build for production
cd frontend && npm run build
```
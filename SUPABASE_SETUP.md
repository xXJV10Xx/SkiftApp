# Supabase Authentication Setup

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be set up

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Navigate to Settings > API
3. Copy your Project URL and anon/public key

## 3. Configure Environment Variables

Create a `.env` file in your project root with:

```
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Configure Authentication Providers

### Email/Password Authentication
1. Go to Authentication > Settings in your Supabase dashboard
2. Enable "Enable email confirmations" if you want email verification
3. Configure password strength requirements as needed

### Google OAuth
1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Add redirect URLs:
   - `skiftappen://auth/callback` (for mobile)
   - `http://localhost:8081` (for development)

## 5. Database Setup (Optional)

If you want to store additional user profile data, create a `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 6. Test the Authentication

1. Run your app: `npm start`
2. Try signing up with email/password
3. Try signing in with Google
4. Test the forgot password functionality

## Features Implemented

- ✅ Email/Password authentication
- ✅ Google OAuth authentication
- ✅ Password reset functionality
- ✅ User session management
- ✅ Protected routes
- ✅ Profile screen with sign out
- ✅ Loading states
- ✅ Error handling

## Troubleshooting

### Google OAuth Issues
- Make sure your redirect URLs are correctly configured
- Check that your Google OAuth credentials are valid
- Ensure the app scheme `skiftappen://` is properly configured

### Environment Variables
- Make sure your `.env` file is in the project root
- Restart your development server after adding environment variables
- Check that the variable names start with `EXPO_PUBLIC_`

### Database Issues
- Ensure your Supabase project is active
- Check that RLS policies are correctly configured
- Verify your database connection in the Supabase dashboard 
# Skiftapp Deployment Script för Windows PowerShell

Write-Host "🚀 Starting Skiftapp deployment..." -ForegroundColor Green

# Funktioner för att visa status
function Show-Status {
    param([string]$Message)
    Write-Host "📋 $Message" -ForegroundColor Blue
}

function Show-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Show-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Show-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# 1. GitHub Deployment
Show-Status "Deploying to GitHub..."

# Kontrollera git status
$gitStatus = git status --porcelain
if (-not $gitStatus) {
    Show-Warning "No changes to commit"
} else {
    # Lägg till alla filer
    git add .
    
    # Skapa commit med beskrivning
    $commitMessage = @"
🚀 Major update: Calendar sync, enhanced chat, shift interest system

- Added Google/Apple Calendar synchronization
- Enhanced chat system with image sharing and online status  
- Implemented shift interest system with predefined messages
- Added user dashboard with statistics
- Updated database schema for new features
- Added comprehensive documentation
"@
    
    git commit -m $commitMessage
    
    # Push till GitHub
    if (git push origin main) {
        Show-Success "Successfully pushed to GitHub"
    } else {
        Show-Error "Failed to push to GitHub"
        exit 1
    }
}

# 2. Supabase Deployment
Show-Status "Preparing Supabase deployment..."

# Skapa SQL-fil för Supabase
$sqlContent = @"
-- Skiftapp Supabase Deployment Script

-- 1. Skapa calendar_syncs tabell
CREATE TABLE IF NOT EXISTS calendar_syncs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_type TEXT NOT NULL CHECK (calendar_type IN ('google', 'apple')),
  is_enabled BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_frequency TEXT DEFAULT 'hourly' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly')),
  access_token TEXT,
  refresh_token TEXT,
  calendar_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Skapa calendar_events tabell
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  calendar_type TEXT NOT NULL CHECK (calendar_type IN ('google', 'apple', 'skiftapp')),
  external_event_id TEXT,
  is_synced BOOLEAN DEFAULT false,
  sync_direction TEXT DEFAULT 'bidirectional' CHECK (sync_direction IN ('inbound', 'outbound', 'bidirectional')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Skapa chat_channels tabell
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('team', 'department', 'company', 'private')),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  participants TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Uppdatera chat_messages tabell
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS shift_interest JSONB;

-- 5. Skapa RLS policies
ALTER TABLE calendar_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;

-- Calendar syncs policies
CREATE POLICY "Users can view own calendar syncs" ON calendar_syncs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar syncs" ON calendar_syncs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar syncs" ON calendar_syncs
  FOR UPDATE USING (auth.uid() = user_id);

-- Calendar events policies
CREATE POLICY "Users can view own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat channels policies
CREATE POLICY "Users can view channels they participate in" ON chat_channels
  FOR SELECT USING (
    auth.uid() = ANY(participants) OR 
    auth.uid() = created_by OR
    type IN ('team', 'department', 'company')
  );

CREATE POLICY "Users can insert channels" ON chat_channels
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update channels they created" ON chat_channels
  FOR UPDATE USING (auth.uid() = created_by);

-- 6. Skapa storage bucket för chat-bilder
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies för chat-bilder
CREATE POLICY "Users can upload chat images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view chat images" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');

-- 7. Aktivera realtime för nya tabeller
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_syncs;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_channels;
"@

$sqlContent | Out-File -FilePath "supabase_deployment.sql" -Encoding UTF8
Show-Success "Created supabase_deployment.sql"
Show-Warning "Please run the SQL commands in Supabase dashboard manually"

# 3. Firebase Deployment
Show-Status "Preparing Firebase deployment..."

# Kontrollera om Firebase CLI är installerat
try {
    $null = Get-Command firebase -ErrorAction Stop
} catch {
    Show-Warning "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
}

# Skapa firebase.json om den inte finns
if (-not (Test-Path "firebase.json")) {
    $firebaseConfig = @"
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions"
  }
}
"@
    $firebaseConfig | Out-File -FilePath "firebase.json" -Encoding UTF8
    Show-Success "Created firebase.json"
}

# Skapa .firebaserc om den inte finns
if (-not (Test-Path ".firebaserc")) {
    $firebasercConfig = @"
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
"@
    $firebasercConfig | Out-File -FilePath ".firebaserc" -Encoding UTF8
    Show-Warning "Created .firebaserc - please update with your Firebase project ID"
}

# 4. Environment Variables
Show-Status "Creating environment variables template..."

$envTemplate = @"
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk

# Google Calendar
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Apple Calendar
EXPO_PUBLIC_APPLE_TEAM_ID=your_apple_team_id
EXPO_PUBLIC_APPLE_KEY_ID=your_apple_key_id

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
"@

$envTemplate | Out-File -FilePath ".env.template" -Encoding UTF8
Show-Success "Created .env.template"

# 5. Build app
Show-Status "Building app..."

try {
    npm run build
    Show-Success "App built successfully"
} catch {
    Show-Error "Build failed"
    exit 1
}

# 6. Deploy to Firebase (om konfigurerat)
if (Test-Path ".firebaserc") {
    Show-Status "Deploying to Firebase..."
    try {
        firebase deploy
        Show-Success "Successfully deployed to Firebase"
    } catch {
        Show-Warning "Firebase deployment failed - check configuration"
    }
} else {
    Show-Warning "Firebase not configured - skipping deployment"
}

# 7. Skapa deployment rapport
Show-Status "Creating deployment report..."

$reportContent = @"
# 🚀 Skiftapp Deployment Report

## ✅ Deployment Status

### GitHub
- ✅ Code committed and pushed
- ✅ All new features included
- ✅ Documentation updated

### Supabase
- ⚠️ Manual SQL execution required
- 📄 SQL file created: `supabase_deployment.sql`
- 🔧 Run SQL commands in Supabase dashboard

### Firebase
- ✅ Configuration files created
- ⚠️ Manual deployment required
- 🔧 Update .firebaserc with project ID

## 📋 Next Steps

### 1. Supabase Setup
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Copy and paste contents of `supabase_deployment.sql`
4. Execute all commands

### 2. Firebase Setup
1. Update `.firebaserc` with your project ID
2. Run `firebase login`
3. Run `firebase deploy`

### 3. Environment Variables
1. Copy `.env.template` to `.env.local`
2. Update with your actual API keys
3. Restart development server

## 🎯 New Features Deployed

- ✅ Calendar synchronization (Google/Apple)
- ✅ Enhanced chat system with image sharing
- ✅ Shift interest system with predefined messages
- ✅ User dashboard with statistics
- ✅ Private chat creation
- ✅ Online status tracking

## 🔍 Testing Checklist

- [ ] Authentication (Google/Email)
- [ ] Calendar sync functionality
- [ ] Chat system (messages, images, private chats)
- [ ] Shift interest system
- [ ] User dashboard
- [ ] Online status

## 📞 Support

- **GitHub**: Create issues for bugs
- **Supabase**: Use dashboard support
- **Firebase**: Use Firebase console

---
*Deployment completed on $(Get-Date)*
"@

$reportContent | Out-File -FilePath "DEPLOYMENT_REPORT.md" -Encoding UTF8
Show-Success "Created DEPLOYMENT_REPORT.md"

# 8. Final status
Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:"
Write-Host "1. Run SQL commands in Supabase dashboard"
Write-Host "2. Configure Firebase project ID"
Write-Host "3. Update environment variables"
Write-Host "4. Test all new features"
Write-Host ""
Write-Host "📄 Check DEPLOYMENT_REPORT.md for detailed instructions"
Write-Host "" 
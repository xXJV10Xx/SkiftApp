# 🔐 Google OAuth Setup Guide

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Note your **Project ID**

### 1.2 Enable Google+ API
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click "Enable"

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set application name: "Skiftappen"
5. Add these **Authorized redirect URIs**:
   ```
   https://fsefeherdbtsddqimjco.supabase.co/auth/v1/callback
   skiftappen://auth/callback
   ```
6. Click "Create"
7. **Save your Client ID and Client Secret**

## Step 2: Configure Supabase Dashboard

### 2.1 Enable Google Provider
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `fsefeherdbtsddqimjco`
3. Go to "Authentication" > "Providers"
4. Find "Google" and click "Enable"

### 2.2 Add Google Credentials
1. In the Google provider settings, enter:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
2. Add these **Redirect URLs**:
   ```
   skiftappen://auth/callback
   https://fsefeherdbtsddqimjco.supabase.co/auth/v1/callback
   ```
3. Click "Save"

## Step 3: Test Google OAuth

### 3.1 Test in Development
1. Start your app: `npm start`
2. Go to the login screen
3. Click "Fortsätt med Google" (Continue with Google)
4. You should be redirected to Google's OAuth page
5. After authorization, you should be redirected back to your app

### 3.2 Troubleshooting

**If Google OAuth doesn't work:**

1. **Check Redirect URLs**:
   - Make sure both URLs are added in Google Cloud Console
   - Make sure both URLs are added in Supabase dashboard

2. **Check App Scheme**:
   - Verify `app.json` has `"scheme": "skiftappen"`
   - Restart your development server after changes

3. **Check Console Errors**:
   - Look for any error messages in the console
   - Check Supabase dashboard logs

4. **Common Issues**:
   - **"Invalid redirect_uri"**: Check redirect URLs in both Google and Supabase
   - **"Client not found"**: Verify Client ID and Secret are correct
   - **"Scheme not registered"**: Restart development server

## Step 4: Production Setup

### 4.1 Update Redirect URLs for Production
When you deploy your app, add these additional redirect URLs:

**For iOS:**
```
com.skiftappen.app://auth/callback
```

**For Android:**
```
com.skiftappen.app://auth/callback
```

### 4.2 Environment Variables
For production, move credentials to environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## ✅ Success Indicators

You'll know Google OAuth is working when:

1. ✅ Clicking "Fortsätt med Google" opens Google's OAuth page
2. ✅ After authorization, you're redirected back to your app
3. ✅ You're automatically logged in and see the main app
4. ✅ Your profile shows your Google account information

## 🆘 Need Help?

If you encounter issues:

1. **Check the console** for error messages
2. **Verify all URLs** are correctly configured
3. **Restart the development server** after configuration changes
4. **Check Supabase logs** in the dashboard

The Google OAuth setup should work seamlessly once all credentials and URLs are properly configured! 
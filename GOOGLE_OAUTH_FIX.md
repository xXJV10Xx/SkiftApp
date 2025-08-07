# 🔧 Google OAuth Login Fix Guide

## 🚨 Current Issue
Google OAuth login is implemented in the code but not working because the credentials haven't been configured in Supabase.

## ✅ Quick Fix Steps

### Step 1: Configure Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Set application name: "Skiftappen"
   - Add these **Authorized redirect URIs**:
     ```
     https://fsefeherdbtsddqimjco.supabase.co/auth/v1/callback
     skiftappen://auth/callback
     ```
   - Click "Create"
   - **Save your Client ID and Client Secret**

### Step 2: Configure Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `fsefeherdbtsddqimjco`

2. **Enable Google Provider**
   - Go to "Authentication" > "Providers"
   - Find "Google" and click "Enable"

3. **Add Google Credentials**
   - In the Google provider settings, enter:
     - **Client ID**: (from Google Cloud Console)
     - **Client Secret**: (from Google Cloud Console)
   - Add these **Redirect URLs**:
     ```
     skiftappen://auth/callback
     https://fsefeherdbtsddqimjco.supabase.co/auth/v1/callback
     ```
   - Click "Save"

### Step 3: Test the Fix

1. **Restart your development server**
   ```bash
   npm start
   ```

2. **Test Google OAuth**
   - Go to the login screen
   - Click "Fortsätt med Google" (Continue with Google)
   - You should be redirected to Google's OAuth page
   - After authorization, you should be redirected back to your app

## 🛠️ Troubleshooting

### If Google OAuth still doesn't work:

1. **Check Console Errors**
   - Open browser developer tools
   - Look for any error messages in the console
   - Check Supabase dashboard logs

2. **Common Error Messages & Solutions**

   **"Invalid redirect_uri"**
   - Make sure both URLs are added in Google Cloud Console
   - Make sure both URLs are added in Supabase dashboard
   - URLs must match exactly (no extra spaces)

   **"Client not found"**
   - Verify Client ID and Secret are correct
   - Check that Google+ API is enabled
   - Make sure you copied the credentials correctly

   **"Scheme not registered"**
   - Restart development server after configuration changes
   - Verify scheme is set to "skiftappen" in app.json

3. **Verify Configuration**
   - Check that `app.json` has `"scheme": "skiftappen"`
   - Verify Supabase URL and key are correct
   - Make sure all redirect URLs are properly configured

## ✅ Success Indicators

You'll know Google OAuth is working when:

1. ✅ Clicking "Fortsätt med Google" opens Google's OAuth page
2. ✅ After authorization, you're redirected back to your app
3. ✅ You're automatically logged in and see the main app
4. ✅ Your profile shows your Google account information

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Double-check all URLs** are correctly configured
2. **Restart the development server** after any configuration changes
3. **Check Supabase logs** in the dashboard for error messages
4. **Verify Google Cloud Console** settings are correct

The Google OAuth implementation in the code is complete and correct - it just needs the proper credentials configuration in Google Cloud Console and Supabase Dashboard.

## 📱 Ready to Use

Once configured, users will be able to:
- Sign in with their Google account
- Access all app features
- Have their profile automatically created
- Use secure authentication

The fix is primarily configuration-based since the code implementation is already complete! 
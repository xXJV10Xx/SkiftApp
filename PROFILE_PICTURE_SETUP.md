# 📸 Profile Picture Upload Setup

This guide explains how to set up and use the profile picture upload functionality in the app.

## ✨ Features

- ✅ Upload profile pictures from camera or photo library
- ✅ Automatic image resizing and compression
- ✅ Secure storage with Supabase Storage
- ✅ Real-time profile updates
- ✅ Old image cleanup when uploading new ones
- ✅ Proper permissions handling

## 🚀 Quick Setup

### 1. Install Dependencies

The required dependencies are already installed:
- `expo-image-picker` - For selecting/taking photos
- `expo-image` - For displaying images
- `@supabase/supabase-js` - Includes storage functionality

### 2. Set Up Supabase Storage

#### Option A: Automatic Setup (Recommended)
```bash
npm run setup-storage
```

#### Option B: Manual Setup
1. Go to your Supabase Dashboard
2. Navigate to Storage
3. Create a new bucket named `avatars`
4. Enable "Public bucket"
5. Set file size limit to 5MB
6. Run the SQL commands from `DATABASE_SETUP.md`

### 3. Database Schema

Make sure your `employees` table has an `avatar_url` column:
```sql
ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

## 🎯 How It Works

### User Experience
1. User taps on their profile picture
2. System asks for camera/library permissions if needed
3. User chooses to take a photo or select from library
4. Image is automatically cropped to square aspect ratio
5. Image is compressed and uploaded to Supabase Storage
6. Profile is updated with the new image URL
7. Old profile picture is automatically deleted

### Technical Flow
1. **Permission Check**: App requests camera/library permissions
2. **Image Selection**: Uses `expo-image-picker` to get image URI
3. **Upload Process**: 
   - Converts image to blob
   - Uploads to Supabase Storage bucket `avatars`
   - Files are stored as `{userId}/avatar-{timestamp}.{ext}`
4. **Database Update**: Updates `employees.avatar_url` field
5. **Cleanup**: Removes old avatar file from storage

## 🔒 Security

### Row Level Security (RLS)
- Users can only upload to their own folder (`{userId}/`)
- Users can only delete their own images
- All avatar images are publicly viewable (for profile display)

### File Restrictions
- **Max file size**: 5MB
- **Allowed formats**: JPEG, JPG, PNG, WebP
- **Aspect ratio**: Forced to 1:1 (square)
- **Quality**: Compressed to 80% for optimal performance

## 🛠️ Customization

### Change Image Quality
In `app/(tabs)/profile.tsx`, modify the `quality` parameter:
```javascript
const result = await ImagePicker.launchImageLibraryAsync({
  // ... other options
  quality: 0.8, // Change this value (0.1 - 1.0)
});
```

### Change File Size Limit
Update the bucket configuration in Supabase Dashboard or modify the setup script.

### Change Allowed File Types
Update the `allowed_mime_types` in the bucket configuration.

## 🐛 Troubleshooting

### Common Issues

#### 1. "Permission denied" errors
- Make sure the app has camera/library permissions
- Check if the user is authenticated
- Verify RLS policies are set up correctly

#### 2. "Bucket not found" error
- Run `npm run setup-storage` to create the bucket
- Or manually create the `avatars` bucket in Supabase Dashboard

#### 3. Images not displaying
- Check if the bucket is set to public
- Verify the image URL is correct
- Check browser network tab for 404 errors

#### 4. Upload fails
- Check file size (must be under 5MB)
- Verify file format is supported
- Check Supabase Storage logs in dashboard

### Debug Tips

Enable debug logging by adding this to your upload function:
```javascript
console.log('Upload URI:', uri);
console.log('User ID:', user?.id);
console.log('Upload result:', uploadResult);
```

## 📱 Platform Considerations

### iOS
- Uses `ActionSheetIOS` for native action sheet experience
- Requires `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` in `Info.plist`

### Android
- Uses `Alert.alert` for action selection
- Requires camera and storage permissions in `AndroidManifest.xml`

### Web
- Limited to file picker (no camera access)
- Works with drag-and-drop file selection

## 🔄 Future Enhancements

Potential improvements you could add:
- [ ] Image cropping interface
- [ ] Multiple image upload
- [ ] Image filters/effects
- [ ] Bulk image operations
- [ ] Image metadata extraction
- [ ] Progressive image loading
- [ ] Offline upload queue

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase Storage logs
3. Check the browser/app console for errors
4. Verify your Supabase configuration

## 🎉 Testing

To test the functionality:
1. Start the app: `npm start`
2. Navigate to the Profile tab
3. Tap on the profile picture
4. Try both camera and library options
5. Verify the image appears immediately
6. Check Supabase Storage dashboard for the uploaded file
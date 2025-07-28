const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key needed for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your environment or .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('🚀 Setting up Supabase storage for profile pictures...\n');

  try {
    // Create avatars bucket
    console.log('📁 Creating avatars bucket...');
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Avatars bucket already exists');
      } else {
        console.error('❌ Error creating bucket:', bucketError.message);
        return;
      }
    } else {
      console.log('✅ Avatars bucket created successfully');
    }

    // Set up RLS policies
    console.log('\n🔒 Setting up RLS policies...');
    
    const policies = [
      {
        name: 'Avatar images are publicly accessible',
        sql: `
          CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
            FOR SELECT USING (bucket_id = 'avatars');
        `
      },
      {
        name: 'Users can upload their own avatar',
        sql: `
          CREATE POLICY "Users can upload their own avatar" ON storage.objects
            FOR INSERT WITH CHECK (
              bucket_id = 'avatars' 
              AND auth.uid()::text = (storage.foldername(name))[1]
            );
        `
      },
      {
        name: 'Users can update their own avatar',
        sql: `
          CREATE POLICY "Users can update their own avatar" ON storage.objects
            FOR UPDATE USING (
              bucket_id = 'avatars' 
              AND auth.uid()::text = (storage.foldername(name))[1]
            );
        `
      },
      {
        name: 'Users can delete their own avatar',
        sql: `
          CREATE POLICY "Users can delete their own avatar" ON storage.objects
            FOR DELETE USING (
              bucket_id = 'avatars' 
              AND auth.uid()::text = (storage.foldername(name))[1]
            );
        `
      }
    ];

    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`✅ Policy "${policy.name}" already exists`);
          } else {
            console.error(`❌ Error creating policy "${policy.name}":`, error.message);
          }
        } else {
          console.log(`✅ Policy "${policy.name}" created successfully`);
        }
      } catch (err) {
        console.error(`❌ Error creating policy "${policy.name}":`, err.message);
      }
    }

    console.log('\n🎉 Storage setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Make sure your employees table has an avatar_url column');
    console.log('2. Test the profile picture upload functionality in your app');
    console.log('3. Check the Supabase Storage dashboard to see uploaded images');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Alternative SQL setup for manual execution
function printManualSetup() {
  console.log('\n📋 Manual SQL Setup (run in Supabase SQL Editor):');
  console.log('```sql');
  console.log(`-- Create avatars bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Set up RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );`);
  console.log('```\n');
}

if (require.main === module) {
  setupStorage().catch(console.error);
  printManualSetup();
}
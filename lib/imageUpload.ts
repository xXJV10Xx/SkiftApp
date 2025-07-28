import { supabase } from './supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image to Supabase storage
 * @param uri - The local URI of the image
 * @param bucket - The storage bucket name (default: 'avatars')
 * @param fileName - Optional custom file name
 * @returns Promise with upload result
 */
export const uploadImage = async (
  uri: string,
  bucket: string = 'avatars',
  fileName?: string
): Promise<ImageUploadResult> => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Create a unique filename if not provided
    const fileExt = uri.split('.').pop() || 'jpg';
    const finalFileName = fileName || `${user.id}/avatar-${Date.now()}.${fileExt}`;

    // Fetch the image as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Convert blob to ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(finalFileName, arrayBuffer, {
        contentType: blob.type || 'image/jpeg',
        upsert: true // Allow replacing existing files
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Delete an image from Supabase storage
 * @param url - The public URL of the image to delete
 * @param bucket - The storage bucket name (default: 'avatars')
 * @returns Promise with deletion result
 */
export const deleteImage = async (
  url: string,
  bucket: string = 'avatars'
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Extract the file path from the URL
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === bucket);
    
    if (bucketIndex === -1 || bucketIndex === urlParts.length - 1) {
      return {
        success: false,
        error: 'Invalid URL format'
      };
    }
    
    // Get everything after the bucket name as the file path
    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch all shifts from Supabase
 * @returns {Promise<Array>} Array of shift objects
 */
export async function fetchShifts() {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching shifts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchShifts:', error);
    return [];
  }
}

/**
 * Create a new shift in Supabase
 * @param {Object} shift - Shift object to create
 * @returns {Promise<Object>} Created shift object
 */
export async function createShift(shift) {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .insert([shift])
      .select()
      .single();

    if (error) {
      console.error('Error creating shift:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createShift:', error);
    throw error;
  }
}

/**
 * Update a shift in Supabase
 * @param {string} id - Shift ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated shift object
 */
export async function updateShift(id, updates) {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating shift:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateShift:', error);
    throw error;
  }
}

/**
 * Delete a shift from Supabase
 * @param {string} id - Shift ID to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteShift(id) {
  try {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shift:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteShift:', error);
    throw error;
  }
}

export { supabase };
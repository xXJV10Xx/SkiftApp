import { supabase } from '../lib/supabase';

// Ladda upp skift till Supabase
export const uploadShiftsToSupabase = async (shifts, options = {}) => {
  try {
    const { 
      overwrite = false, 
      validateData = true,
      batchSize = 100 
    } = options;

    if (validateData) {
      const validation = validateShiftData(shifts);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    let uploadedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Processa i batches för bättre prestanda
    for (let i = 0; i < shifts.length; i += batchSize) {
      const batch = shifts.slice(i, i + batchSize);
      
      try {
        if (overwrite) {
          // Använd upsert för att uppdatera befintliga poster
          const { data, error } = await supabase
            .from('shifts')
            .upsert(batch, { 
              onConflict: 'date,team',
              ignoreDuplicates: false 
            });

          if (error) throw error;
          uploadedCount += batch.length;
        } else {
          // Kontrollera för dubbletter först
          const existingShifts = await checkForDuplicates(batch);
          const newShifts = batch.filter(shift => 
            !existingShifts.some(existing => 
              existing.date === shift.date && existing.team === shift.team
            )
          );

          if (newShifts.length > 0) {
            const { data, error } = await supabase
              .from('shifts')
              .insert(newShifts);

            if (error) throw error;
            uploadedCount += newShifts.length;
          }
        }
      } catch (batchError) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, batchError);
        errorCount += batch.length;
        errors.push({
          batch: i / batchSize + 1,
          error: batchError.message,
          shifts: batch
        });
      }
    }

    return {
      success: errorCount === 0,
      uploadedCount,
      errorCount,
      totalProcessed: shifts.length,
      errors
    };

  } catch (error) {
    console.error('Error uploading shifts to Supabase:', error);
    throw error;
  }
};

// Kontrollera för befintliga skift
const checkForDuplicates = async (shifts) => {
  try {
    const dates = [...new Set(shifts.map(s => s.date))];
    const teams = [...new Set(shifts.map(s => s.team))];

    const { data, error } = await supabase
      .from('shifts')
      .select('date, team, id')
      .in('date', dates)
      .in('team', teams);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return [];
  }
};

// Validera skiftdata
export const validateShiftData = (shifts) => {
  if (!Array.isArray(shifts)) {
    return { valid: false, error: 'Skiftdata måste vara en array' };
  }

  if (shifts.length === 0) {
    return { valid: false, error: 'Inga skift att ladda upp' };
  }

  const requiredFields = ['date', 'team'];
  const validTeams = [31, 32, 33, 34, 35];

  for (let i = 0; i < shifts.length; i++) {
    const shift = shifts[i];
    
    // Kontrollera obligatoriska fält
    for (const field of requiredFields) {
      if (!shift[field]) {
        return { 
          valid: false, 
          error: `Skift ${i + 1} saknar obligatoriskt fält: ${field}` 
        };
      }
    }

    // Validera datum format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(shift.date)) {
      return { 
        valid: false, 
        error: `Skift ${i + 1} har ogiltigt datumformat. Använd YYYY-MM-DD` 
      };
    }

    // Validera lag
    if (!validTeams.includes(Number(shift.team))) {
      return { 
        valid: false, 
        error: `Skift ${i + 1} har ogiltigt lag: ${shift.team}. Giltiga lag: ${validTeams.join(', ')}` 
      };
    }

    // Validera tider om de finns
    if (shift.start_time && !/^\d{2}:\d{2}$/.test(shift.start_time)) {
      return { 
        valid: false, 
        error: `Skift ${i + 1} har ogiltigt starttidsformat. Använd HH:MM` 
      };
    }

    if (shift.end_time && !/^\d{2}:\d{2}$/.test(shift.end_time)) {
      return { 
        valid: false, 
        error: `Skift ${i + 1} har ogiltigt sluttidsformat. Använd HH:MM` 
      };
    }
  }

  return { valid: true };
};

// Hämta skift från Supabase med filter
export const fetchShiftsFromSupabase = async (filters = {}) => {
  try {
    let query = supabase.from('shifts').select('*');

    // Applicera filter
    if (filters.team) {
      query = query.eq('team', filters.team);
    }

    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }

    if (filters.shiftType) {
      query = query.eq('type', filters.shiftType);
    }

    // Sortera efter datum
    query = query.order('date', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      shifts: data || [],
      count: data?.length || 0
    };

  } catch (error) {
    console.error('Error fetching shifts from Supabase:', error);
    throw error;
  }
};

// Ta bort skift från Supabase
export const deleteShiftsFromSupabase = async (shiftIds) => {
  try {
    if (!Array.isArray(shiftIds) || shiftIds.length === 0) {
      throw new Error('Inga skift-ID:n att ta bort');
    }

    const { data, error } = await supabase
      .from('shifts')
      .delete()
      .in('id', shiftIds);

    if (error) throw error;

    return {
      success: true,
      deletedCount: shiftIds.length
    };

  } catch (error) {
    console.error('Error deleting shifts from Supabase:', error);
    throw error;
  }
};

// Uppdatera enskilt skift
export const updateShiftInSupabase = async (shiftId, updates) => {
  try {
    if (!shiftId) {
      throw new Error('Skift-ID krävs för uppdatering');
    }

    // Validera uppdateringar
    if (updates.team && ![31, 32, 33, 34, 35].includes(Number(updates.team))) {
      throw new Error('Ogiltigt lag');
    }

    if (updates.date && !/^\d{4}-\d{2}-\d{2}$/.test(updates.date)) {
      throw new Error('Ogiltigt datumformat');
    }

    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', shiftId)
      .select();

    if (error) throw error;

    return {
      success: true,
      updatedShift: data?.[0]
    };

  } catch (error) {
    console.error('Error updating shift in Supabase:', error);
    throw error;
  }
};

export default {
  uploadShiftsToSupabase,
  validateShiftData,
  fetchShiftsFromSupabase,
  deleteShiftsFromSupabase,
  updateShiftInSupabase
};
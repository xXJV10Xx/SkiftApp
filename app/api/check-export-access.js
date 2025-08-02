import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .select('has_paid_export, export_paid_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking export access:', error);
      return res.status(500).json({ error: 'Failed to check export access' });
    }

    res.status(200).json({ 
      hasAccess: employee?.has_paid_export || false,
      paidAt: employee?.export_paid_at || null
    });
  } catch (error) {
    console.error('Export access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
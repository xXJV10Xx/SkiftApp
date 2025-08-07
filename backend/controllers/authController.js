// Authentication Controller
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class AuthController {
  // Verify JWT token middleware
  static async verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          error: 'No token provided',
          code: 'UNAUTHORIZED'
        });
      }

      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({
          error: 'Invalid token',
          code: 'UNAUTHORIZED'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth verification error:', error);
      res.status(500).json({
        error: 'Authentication verification failed',
        code: 'AUTH_ERROR'
      });
    }
  }

  // Get current user profile
  static async getCurrentUser(req, res) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          subscriptions (*),
          user_preferences (*)
        `)
        .eq('id', req.user.id)
        .single();

      if (error) {
        return res.status(404).json({
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      res.json({
        user: req.user,
        profile,
        subscription: profile.subscriptions?.[0] || null,
        preferences: profile.user_preferences?.[0] || null
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        error: 'Failed to get user profile',
        code: 'DATABASE_ERROR'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const { full_name, company_name, company_type, selected_team, phone_number } = req.body;

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name,
          company_name,
          company_type,
          selected_team,
          phone_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          error: 'Failed to update profile',
          code: 'UPDATE_FAILED',
          details: error.message
        });
      }

      res.json({
        message: 'Profile updated successfully',
        profile: data
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        code: 'DATABASE_ERROR'
      });
    }
  }

  // Update user preferences
  static async updatePreferences(req, res) {
    try {
      const {
        notifications_enabled,
        email_notifications,
        push_notifications,
        shift_reminders,
        reminder_hours,
        theme,
        calendar_sync_enabled,
        calendar_sync_provider
      } = req.body;

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: req.user.id,
          notifications_enabled,
          email_notifications,
          push_notifications,
          shift_reminders,
          reminder_hours,
          theme,
          calendar_sync_enabled,
          calendar_sync_provider,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          error: 'Failed to update preferences',
          code: 'UPDATE_FAILED',
          details: error.message
        });
      }

      res.json({
        message: 'Preferences updated successfully',
        preferences: data
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        error: 'Failed to update preferences',
        code: 'DATABASE_ERROR'
      });
    }
  }

  // Delete user account
  static async deleteAccount(req, res) {
    try {
      const { data, error } = await supabase.auth.admin.deleteUser(req.user.id);

      if (error) {
        return res.status(400).json({
          error: 'Failed to delete account',
          code: 'DELETE_FAILED',
          details: error.message
        });
      }

      res.json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        error: 'Failed to delete account',
        code: 'DATABASE_ERROR'
      });
    }
  }
}

module.exports = AuthController;
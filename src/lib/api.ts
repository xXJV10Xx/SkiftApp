import { supabase } from './supabase';

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  profile_image?: string;
  company_id: string;
  department_id?: string;
  team_id?: string;
  is_online: boolean;
  has_calendar_export: boolean;
}

export interface ShiftForm {
  id: string;
  type: 'skiftöverlämning' | 'jobba extra' | 'haveri';
  user_id: string;
  date: string;
  shift?: string;
  description?: string;
  status: 'öppen' | 'besvarad';
  company_id: string;
  department_id?: string;
  interested_users: string[];
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  company_id: string;
  department_id?: string;
  created_by: string;
  is_private: boolean;
}

export interface Message {
  id: string;
  sender_id: string;
  group_id: string;
  content: string;
  message_type: 'text' | 'form_response' | 'system';
  created_at: string;
}

// API Functions

/**
 * User Management
 */
export const userAPI = {
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return userData;
  },

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await supabase
      .from('users')
      .update({ 
        is_online: isOnline, 
        last_seen: new Date().toISOString() 
      })
      .eq('id', userId);
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<void> {
    await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
  },

  async getCompanyUsers(companyId: string): Promise<User[]> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('company_id', companyId);

    return data || [];
  }
};

/**
 * Shift Forms Management
 */
export const formsAPI = {
  async createForm(formData: {
    type: 'skiftöverlämning' | 'jobba extra' | 'haveri';
    user_id: string;
    date: string;
    shift?: string;
    description?: string;
    company_id: string;
    department_id?: string;
  }): Promise<ShiftForm | null> {
    const { data, error } = await supabase
      .from('shift_forms')
      .insert({
        ...formData,
        interested_users: []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating form:', error);
      return null;
    }

    return data;
  },

  async getForms(companyId: string, filters?: {
    type?: 'skiftöverlämning' | 'jobba extra' | 'haveri';
    status?: 'öppen' | 'besvarad';
    department_id?: string;
  }): Promise<ShiftForm[]> {
    let query = supabase
      .from('shift_forms')
      .select(`
        *,
        user:users(*)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    const { data } = await query;
    return data || [];
  },

  async updateFormStatus(formId: string, status: 'öppen' | 'besvarad'): Promise<void> {
    await supabase
      .from('shift_forms')
      .update({ status })
      .eq('id', formId);
  },

  async toggleInterest(formId: string, userId: string): Promise<void> {
    const { data: form } = await supabase
      .from('shift_forms')
      .select('interested_users')
      .eq('id', formId)
      .single();

    if (!form) return;

    const interestedUsers = form.interested_users || [];
    const isInterested = interestedUsers.includes(userId);

    let updatedUsers;
    if (isInterested) {
      updatedUsers = interestedUsers.filter((id: string) => id !== userId);
    } else {
      updatedUsers = [...interestedUsers, userId];
    }

    await supabase
      .from('shift_forms')
      .update({ interested_users: updatedUsers })
      .eq('id', formId);
  },

  async getFormsByUser(userId: string): Promise<ShiftForm[]> {
    const { data } = await supabase
      .from('shift_forms')
      .select(`
        *,
        user:users(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return data || [];
  }
};

/**
 * Groups and Chat Management
 */
export const chatAPI = {
  async getGroups(companyId: string, filters?: {
    department_id?: string;
    search?: string;
  }): Promise<Group[]> {
    let query = supabase
      .from('groups')
      .select(`
        *,
        group_members(count)
      `)
      .eq('company_id', companyId);

    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data } = await query;
    return data || [];
  },

  async createGroup(groupData: {
    name: string;
    company_id: string;
    department_id?: string;
    created_by: string;
    is_private?: boolean;
  }): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .insert(groupData)
      .select()
      .single();

    if (error) {
      console.error('Error creating group:', error);
      return null;
    }

    // Add creator as member
    await supabase
      .from('group_members')
      .insert({
        group_id: data.id,
        user_id: groupData.created_by,
        accepted: true
      });

    return data;
  },

  async joinGroup(groupId: string, userId: string): Promise<void> {
    await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        accepted: true
      });
  },

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
  },

  async getGroupMembers(groupId: string): Promise<User[]> {
    const { data } = await supabase
      .from('group_members')
      .select(`
        user:users(*)
      `)
      .eq('group_id', groupId)
      .eq('accepted', true);

    return data?.map(member => member.user) || [];
  },

  async getMessages(groupId: string, limit: number = 50): Promise<Message[]> {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users(*)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(limit);

    return data || [];
  },

  async sendMessage(messageData: {
    content: string;
    sender_id: string;
    group_id: string;
    message_type?: 'text' | 'form_response' | 'system';
  }): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...messageData,
        message_type: messageData.message_type || 'text'
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return data;
  },

  async createPrivateChat(user1Id: string, user2Id: string, companyId: string): Promise<Group | null> {
    // Check if private chat already exists
    const { data: existingGroups } = await supabase
      .from('groups')
      .select('*')
      .eq('is_private', true)
      .eq('company_id', companyId);

    if (existingGroups) {
      for (const group of existingGroups) {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', group.id);

        const memberIds = members?.map(m => m.user_id) || [];
        if (memberIds.includes(user1Id) && memberIds.includes(user2Id) && memberIds.length === 2) {
          return group;
        }
      }
    }

    // Create new private chat
    const { data: newGroup, error } = await supabase
      .from('groups')
      .insert({
        name: 'Privat chatt',
        company_id: companyId,
        created_by: user1Id,
        is_private: true
      })
      .select()
      .single();

    if (error || !newGroup) {
      console.error('Error creating private chat:', error);
      return null;
    }

    // Add both users to the group
    await supabase
      .from('group_members')
      .insert([
        { group_id: newGroup.id, user_id: user1Id, accepted: true },
        { group_id: newGroup.id, user_id: user2Id, accepted: true }
      ]);

    return newGroup;
  }
};

/**
 * Calendar Export and Payment
 */
export const calendarAPI = {
  async generateCalendarData(userId: string): Promise<string | null> {
    try {
      // Get user's shift forms
      const forms = await formsAPI.getFormsByUser(userId);
      
      // Generate iCal format
      let icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ShiftApp//ShiftApp//EN',
        'CALSCALE:GREGORIAN'
      ];

      forms.forEach(form => {
        const date = new Date(form.date);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        
        icalContent.push(
          'BEGIN:VEVENT',
          `UID:${form.id}@shiftapp.com`,
          `DTSTART;VALUE=DATE:${dateStr}`,
          `DTEND;VALUE=DATE:${dateStr}`,
          `SUMMARY:${form.type}${form.shift ? ` - ${form.shift}` : ''}`,
          `DESCRIPTION:${form.description || ''}`,
          `STATUS:${form.status === 'öppen' ? 'TENTATIVE' : 'CONFIRMED'}`,
          'END:VEVENT'
        );
      });

      icalContent.push('END:VCALENDAR');
      
      return icalContent.join('\r\n');
    } catch (error) {
      console.error('Error generating calendar data:', error);
      return null;
    }
  },

  async checkCalendarAccess(userId: string): Promise<boolean> {
    const { data: user } = await supabase
      .from('users')
      .select('has_calendar_export')
      .eq('id', userId)
      .single();

    return user?.has_calendar_export || false;
  },

  async grantCalendarAccess(userId: string): Promise<void> {
    await supabase
      .from('users')
      .update({ has_calendar_export: true })
      .eq('id', userId);
  }
};

/**
 * Company and Department Management
 */
export const companyAPI = {
  async getCompanies(): Promise<any[]> {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    return data || [];
  },

  async getDepartments(companyId: string): Promise<any[]> {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    return data || [];
  },

  async getTeams(departmentId: string): Promise<any[]> {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .eq('department_id', departmentId)
      .order('name');

    return data || [];
  }
};

/**
 * Real-time Subscriptions
 */
export const subscriptions = {
  subscribeToMessages(groupId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          const { data: messageWithSender } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (messageWithSender) {
            callback(messageWithSender);
          }
        }
      )
      .subscribe();
  },

  subscribeToForms(companyId: string, callback: (form: ShiftForm) => void) {
    return supabase
      .channel(`forms:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shift_forms',
          filter: `company_id=eq.${companyId}`
        },
        async (payload) => {
          const { data: formWithUser } = await supabase
            .from('shift_forms')
            .select(`
              *,
              user:users(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (formWithUser) {
            callback(formWithUser);
          }
        }
      )
      .subscribe();
  },

  subscribeToUserStatus(companyId: string, callback: (user: User) => void) {
    return supabase
      .channel(`users:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as User);
          }
        }
      )
      .subscribe();
  }
};

/**
 * Error Handling
 */
export const handleError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  
  // You can extend this to send errors to a logging service
  if (error?.message) {
    throw new Error(`${context}: ${error.message}`);
  } else {
    throw new Error(`${context}: Unknown error occurred`);
  }
};

/**
 * Utility Functions
 */
export const utils = {
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return `${this.formatDate(dateString)} ${this.formatTime(dateString)}`;
  },

  generateAvatarUrl(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff`;
  },

  isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  },

  isThisWeek(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return date >= weekStart && date <= weekEnd;
  }
};
import { supabase } from '../supabase';

const API_BASE_URL = 'http://localhost:8000/api';

export interface Shift {
  id: string;
  owner_id: string | null;
  employee_id: string | null;
  company_id: string | null;
  team_id: string | null;
  start_time: string;
  end_time: string;
  position: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ShiftTradeRequest {
  id: string;
  shift_id: string;
  requesting_user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  shifts?: Shift;
}

export interface PrivateChat {
  id: string;
  participant_ids: string[];
  related_trade_request_id: string | null;
  created_at: string;
  updated_at: string;
}

class ShiftApiClient {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Hämta användarens schema
  async getUserSchedule(userId: string): Promise<{ success: boolean; data: Shift[] }> {
    return this.makeRequest(`/schedule/${userId}`);
  }

  // Skapa skiftbyte-förfrågan
  async createTradeRequest(shiftId: string, message?: string): Promise<{ success: boolean; data: ShiftTradeRequest }> {
    return this.makeRequest('/shifts/trade', {
      method: 'POST',
      body: JSON.stringify({ shiftId, message }),
    });
  }

  // Visa intresse för skiftbyte
  async showInterest(tradeRequestId: string): Promise<{ success: boolean; data: { privateChatId: string; message: string } }> {
    return this.makeRequest('/shifts/trade/interested', {
      method: 'POST',
      body: JSON.stringify({ tradeRequestId }),
    });
  }

  // Hämta teamets trade requests
  async getTeamTradeRequests(): Promise<{ success: boolean; data: ShiftTradeRequest[] }> {
    return this.makeRequest('/shifts/trade-requests');
  }

  // Tilldela skift till ny ägare
  async assignShift(shiftId: string, newOwnerId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/shifts/${shiftId}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ newOwnerId }),
    });
  }

  // Hämta användarens privata chattar
  async getPrivateChats(): Promise<PrivateChat[]> {
    const { data, error } = await supabase
      .from('private_chats')
      .select('*')
      .contains('participant_ids', [await this.getCurrentUserId()]);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  // Hämta meddelanden för en privat chatt
  async getPrivateChatMessages(chatId: string) {
    const { data, error } = await supabase
      .from('private_chat_messages')
      .select(`
        *,
        employees:sender_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('private_chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  // Skicka meddelande i privat chatt
  async sendPrivateChatMessage(chatId: string, content: string, messageType: string = 'text') {
    const currentUserId = await this.getCurrentUserId();
    
    const { data, error } = await supabase
      .from('private_chat_messages')
      .insert({
        private_chat_id: chatId,
        sender_id: currentUserId,
        content,
        message_type: messageType,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Hjälpfunktion för att hämta aktuell användar-ID
  private async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }

  // Prenumerera på real-time uppdateringar för trade requests
  subscribeToTradeRequests(callback: (payload: any) => void) {
    return supabase
      .channel('shift_trade_requests')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'shift_trade_requests' }, 
        callback
      )
      .subscribe();
  }

  // Prenumerera på real-time uppdateringar för privata chattar
  subscribeToPrivateChat(chatId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`private_chat_${chatId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'private_chat_messages',
          filter: `private_chat_id=eq.${chatId}`
        }, 
        callback
      )
      .subscribe();
  }
}

export const shiftApi = new ShiftApiClient();
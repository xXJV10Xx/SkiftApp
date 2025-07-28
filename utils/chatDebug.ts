// 🔧 Chat Debug Utilities - För att testa och felsöka chat-funktionalitet

import { supabase } from '../lib/supabase';

export interface ChatDebugInfo {
  isConnected: boolean;
  user: any;
  chatRooms: any[];
  currentRoom: any;
  realtimeStatus: string;
  lastError: string | null;
}

export class ChatDebugger {
  private static instance: ChatDebugger;
  private debugInfo: ChatDebugInfo = {
    isConnected: false,
    user: null,
    chatRooms: [],
    currentRoom: null,
    realtimeStatus: 'disconnected',
    lastError: null
  };

  static getInstance(): ChatDebugger {
    if (!ChatDebugger.instance) {
      ChatDebugger.instance = new ChatDebugger();
    }
    return ChatDebugger.instance;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('companies').select('id').limit(1);
      if (error) {
        this.debugInfo.lastError = `Connection error: ${error.message}`;
        this.debugInfo.isConnected = false;
        return false;
      }
      this.debugInfo.isConnected = true;
      this.debugInfo.lastError = null;
      return true;
    } catch (error) {
      this.debugInfo.lastError = `Connection failed: ${error}`;
      this.debugInfo.isConnected = false;
      return false;
    }
  }

  async testChatRoomAccess(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chat_room_members')
        .select(`
          chat_rooms (
            id,
            name,
            description,
            type,
            is_private
          )
        `)
        .eq('employee_id', userId);

      if (error) {
        this.debugInfo.lastError = `Chat room access error: ${error.message}`;
        return [];
      }

      const rooms = data?.map(item => item.chat_rooms).filter(Boolean) || [];
      this.debugInfo.chatRooms = rooms;
      return rooms;
    } catch (error) {
      this.debugInfo.lastError = `Chat room test failed: ${error}`;
      return [];
    }
  }

  async testSendMessage(roomId: string, userId: string, content: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: roomId,
          sender_id: userId,
          content: content,
          message_type: 'text'
        })
        .select()
        .single();

      if (error) {
        this.debugInfo.lastError = `Send message error: ${error.message}`;
        return false;
      }

      console.log('✅ Test message sent successfully:', data);
      return true;
    } catch (error) {
      this.debugInfo.lastError = `Send message failed: ${error}`;
      return false;
    }
  }

  async testRealtimeConnection(roomId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const channel = supabase
        .channel(`test-chat:${roomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_room_id=eq.${roomId}`,
          },
          (payload) => {
            console.log('✅ Real-time message received:', payload);
            this.debugInfo.realtimeStatus = 'connected';
            channel.unsubscribe();
            resolve(true);
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status);
          this.debugInfo.realtimeStatus = status;
          
          if (status === 'SUBSCRIBED') {
            // Testa genom att skicka ett meddelande
            setTimeout(() => {
              this.debugInfo.realtimeStatus = 'timeout';
              channel.unsubscribe();
              resolve(false);
            }, 5000);
          }
        });
    });
  }

  getDebugInfo(): ChatDebugInfo {
    return { ...this.debugInfo };
  }

  async runFullDiagnostic(userId: string): Promise<ChatDebugInfo> {
    console.log('🔧 Starting chat diagnostic...');
    
    // Test 1: Connection
    console.log('Testing Supabase connection...');
    await this.testConnection();
    
    // Test 2: User authentication
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.debugInfo.user = user;
      console.log('User authenticated:', !!user);
    } catch (error) {
      this.debugInfo.lastError = `Auth error: ${error}`;
    }
    
    // Test 3: Chat room access
    console.log('Testing chat room access...');
    await this.testChatRoomAccess(userId);
    
    // Test 4: Message sending (if rooms available)
    if (this.debugInfo.chatRooms.length > 0) {
      const testRoom = this.debugInfo.chatRooms[0];
      console.log('Testing message sending...');
      await this.testSendMessage(testRoom.id, userId, '[TEST] Debug message - kan tas bort');
      
      // Test 5: Real-time connection
      console.log('Testing real-time connection...');
      await this.testRealtimeConnection(testRoom.id);
    }
    
    console.log('🔧 Chat diagnostic complete:', this.debugInfo);
    return this.getDebugInfo();
  }

  logDebugInfo(): void {
    console.log('📊 Chat Debug Info:', {
      '🔗 Connected': this.debugInfo.isConnected,
      '👤 User': !!this.debugInfo.user,
      '💬 Chat Rooms': this.debugInfo.chatRooms.length,
      '📡 Real-time': this.debugInfo.realtimeStatus,
      '❌ Last Error': this.debugInfo.lastError
    });
  }
}

// Convenience functions
export const debugChat = ChatDebugger.getInstance();

export const testChatFunctionality = async (userId: string) => {
  return await debugChat.runFullDiagnostic(userId);
};

export const logChatStatus = () => {
  debugChat.logDebugInfo();
};
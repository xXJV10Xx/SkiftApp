import { create } from 'zustand';
import { databaseService, LocalMessage, LocalTeam, LocalChatRoom } from '../services/DatabaseService';
import { syncService, SyncResult } from '../services/SyncService';

export interface ChatMessage extends LocalMessage {
  sender?: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface ChatRoom extends LocalChatRoom {
  companies?: {
    name: string;
  };
  teams?: {
    name: string;
    color: string;
  };
}

export interface Team extends LocalTeam {}

interface OfflineChatState {
  // State
  messages: ChatMessage[];
  chatRooms: ChatRoom[];
  teams: Team[];
  currentChatRoom: ChatRoom | null;
  loading: boolean;
  syncing: boolean;
  isOnline: boolean;
  lastSyncResult: SyncResult | null;

  // Actions
  initialize: () => Promise<void>;
  loadMessages: (chatRoomId: string) => Promise<void>;
  sendMessage: (content: string, messageType?: string, userId?: string) => Promise<void>;
  loadChatRooms: (companyId?: string) => Promise<void>;
  loadTeams: (companyId?: string) => Promise<void>;
  setCurrentChatRoom: (room: ChatRoom | null) => void;
  syncData: () => Promise<SyncResult>;
  checkOnlineStatus: () => Promise<void>;
}

export const useOfflineChatStore = create<OfflineChatState>((set, get) => ({
  // Initial state
  messages: [],
  chatRooms: [],
  teams: [],
  currentChatRoom: null,
  loading: false,
  syncing: false,
  isOnline: false,
  lastSyncResult: null,

  // Initialize the store and database
  initialize: async () => {
    try {
      set({ loading: true });
      
      // Initialize database
      await databaseService.initialize();
      
      // Check online status
      await get().checkOnlineStatus();
      
      // Perform initial sync if online
      if (get().isOnline) {
        await get().syncData();
      }

      console.log('OfflineChatStore initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OfflineChatStore:', error);
    } finally {
      set({ loading: false });
    }
  },

  // Load messages for a specific chat room from local database
  loadMessages: async (chatRoomId: string) => {
    try {
      set({ loading: true });
      
      const localMessages = await databaseService.getMessages(chatRoomId);
      
      // Convert LocalMessage to ChatMessage (add sender info if needed)
      const messages: ChatMessage[] = localMessages.map(msg => ({
        ...msg,
        // Note: Sender info would need to be stored separately or joined
        // For now, we'll leave it undefined and populate during sync
        sender: undefined
      }));

      set({ messages });
    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ messages: [] });
    } finally {
      set({ loading: false });
    }
  },

  // Send a message (store locally first, sync later)
  sendMessage: async (content: string, messageType = 'text', userId?: string) => {
    const { currentChatRoom } = get();
    if (!currentChatRoom || !userId) {
      throw new Error('No current chat room or user ID');
    }

    try {
      // Create local message with temporary ID
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const newMessage: Omit<LocalMessage, 'synced'> = {
        id: localId,
        chat_room_id: currentChatRoom.id,
        sender_id: userId,
        content,
        message_type: messageType,
        file_url: null,
        reply_to: null,
        is_edited: false,
        created_at: now,
        updated_at: now,
        local_id: localId
      };

      // Insert into local database
      await databaseService.insertMessage(newMessage);

      // Update local state immediately for responsive UI
      const chatMessage: ChatMessage = {
        ...newMessage,
        synced: false,
        sender: undefined // Will be populated when synced
      };

      set(state => ({
        messages: [...state.messages, chatMessage]
      }));

      // Try to sync immediately if online
      if (get().isOnline) {
        get().syncData();
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  // Load chat rooms from local database
  loadChatRooms: async (companyId?: string) => {
    try {
      set({ loading: true });
      
      const localChatRooms = await databaseService.getChatRooms(companyId);
      
      // Convert to ChatRoom format
      const chatRooms: ChatRoom[] = localChatRooms.map(room => ({
        ...room,
        companies: undefined, // Would need to be joined from companies table
        teams: undefined // Would need to be joined from teams table
      }));

      set({ chatRooms });
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
      set({ chatRooms: [] });
    } finally {
      set({ loading: false });
    }
  },

  // Load teams from local database
  loadTeams: async (companyId?: string) => {
    try {
      set({ loading: true });
      
      const localTeams = await databaseService.getTeams(companyId);
      
      set({ teams: localTeams });
    } catch (error) {
      console.error('Failed to load teams:', error);
      set({ teams: [] });
    } finally {
      set({ loading: false });
    }
  },

  // Set current chat room and load its messages
  setCurrentChatRoom: (room: ChatRoom | null) => {
    set({ currentChatRoom: room, messages: [] });
    
    if (room) {
      get().loadMessages(room.id);
    }
  },

  // Sync data with Supabase
  syncData: async () => {
    const { syncing } = get();
    if (syncing) {
      console.log('Sync already in progress');
      return get().lastSyncResult || {
        success: false,
        messagesDownloaded: 0,
        messagesUploaded: 0,
        teamsDownloaded: 0,
        teamsUploaded: 0,
        chatRoomsDownloaded: 0,
        error: 'Sync already in progress'
      };
    }

    try {
      set({ syncing: true });
      
      const result = await syncService.syncWithSupabase();
      
      set({ lastSyncResult: result });

      // Reload current data after sync
      const { currentChatRoom } = get();
      if (currentChatRoom) {
        await get().loadMessages(currentChatRoom.id);
      }
      
      // Reload chat rooms and teams if sync was successful
      if (result.success) {
        await get().loadChatRooms();
        await get().loadTeams();
      }

      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      const errorResult: SyncResult = {
        success: false,
        messagesDownloaded: 0,
        messagesUploaded: 0,
        teamsDownloaded: 0,
        teamsUploaded: 0,
        chatRoomsDownloaded: 0,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      };
      
      set({ lastSyncResult: errorResult });
      return errorResult;
    } finally {
      set({ syncing: false });
    }
  },

  // Check if device is online
  checkOnlineStatus: async () => {
    try {
      const online = await syncService.isOnline();
      set({ isOnline: online });
    } catch (error) {
      console.error('Failed to check online status:', error);
      set({ isOnline: false });
    }
  }
}));

// Auto-sync setup
let syncInterval: NodeJS.Timeout | null = null;

export const startAutoSync = (intervalMs: number = 30000) => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(async () => {
    const store = useOfflineChatStore.getState();
    
    // Only sync if online and not already syncing
    if (store.isOnline && !store.syncing) {
      try {
        await store.syncData();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }
  }, intervalMs);
};

export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};
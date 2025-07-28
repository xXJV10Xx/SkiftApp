import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  reply_to?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface ChatRoom {
  id: string;
  company_id: string;
  team_id?: string;
  name: string;
  description?: string;
  type: 'company' | 'team' | 'department' | 'direct';
  department?: string;
  is_private: boolean;
  member_count: number;
  last_message?: Message;
  unread_count: number;
  created_at: string;
}

interface ScalableChatContextType {
  // Core chat data
  chatRooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: Message[];
  onlineUsers: string[];
  
  // Connection management
  connectionMode: 'real-time' | 'polling' | 'hybrid';
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  userCount: number;
  
  // Performance metrics
  messageLatency: number;
  lastActivity: Date | null;
  
  // Core functions
  setActiveRoom: (room: ChatRoom | null) => void;
  sendMessage: (content: string, type?: string) => Promise<void>;
  loadMessages: (roomId: string, limit?: number, offset?: number) => Promise<void>;
  markAsRead: (roomId: string) => Promise<void>;
  
  // Room management
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  createRoom: (name: string, type: string, isPrivate?: boolean) => Promise<ChatRoom>;
  
  // Presence management
  updatePresence: (status: 'online' | 'away' | 'offline') => Promise<void>;
  
  // Performance controls
  setConnectionMode: (mode: 'real-time' | 'polling' | 'hybrid') => void;
  optimizeForScale: () => void;
}

const ScalableChatContext = createContext<ScalableChatContextType | undefined>(undefined);

export const ScalableChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { selectedCompany, selectedTeam, selectedDepartment } = useCompany();
  
  // Core state
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  // Connection management
  const [connectionMode, setConnectionMode] = useState<'real-time' | 'polling' | 'hybrid'>('hybrid');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [userCount, setUserCount] = useState(0);
  
  // Performance tracking
  const [messageLatency, setMessageLatency] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  
  // Internal state management
  const subscriptions = useRef<Map<string, any>>(new Map());
  const messageQueue = useRef<Message[]>([]);
  const presenceHeartbeat = useRef<NodeJS.Timeout | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const messageCache = useRef<Map<string, Message[]>>(new Map());
  
  // Configuration based on scale
  const CONFIG = {
    MAX_MESSAGES_PER_ROOM: 500, // Limit memory usage
    MESSAGE_BATCH_SIZE: 20, // Load messages in batches
    PRESENCE_HEARTBEAT_INTERVAL: 30000, // 30s heartbeat
    POLLING_INTERVAL: 5000, // 5s polling for hybrid mode
    MESSAGE_BUFFER_TIME: 1000, // 1s buffer for batching
    MAX_CONCURRENT_ROOMS: 5, // Limit active room subscriptions
    CACHE_TTL: 300000, // 5 minutes cache
  };

  // OPTIMIZATION 1: Intelligent connection mode selection
  const determineOptimalMode = useCallback(() => {
    if (userCount < 50) {
      return 'real-time'; // Low load - full real-time
    } else if (userCount < 500) {
      return 'hybrid'; // Medium load - selective real-time
    } else {
      return 'polling'; // High load - polling only
    }
  }, [userCount]);

  // OPTIMIZATION 2: Message caching and batching
  const getCacheKey = useCallback((roomId: string) => {
    return `messages_${roomId}`;
  }, []);

  const loadMessagesFromCache = useCallback(async (roomId: string): Promise<Message[] | null> => {
    try {
      // Check memory cache first
      if (messageCache.current.has(roomId)) {
        const cached = messageCache.current.get(roomId);
        console.log(`💾 Memory cache hit for room ${roomId}`);
        return cached || null;
      }

      // Check AsyncStorage
      const cacheKey = getCacheKey(roomId);
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CONFIG.CACHE_TTL) {
          messageCache.current.set(roomId, data);
          console.log(`💾 Storage cache hit for room ${roomId}`);
          return data;
        }
      }

      return null;
    } catch (error) {
      console.error('Cache load error:', error);
      return null;
    }
  }, [getCacheKey]);

  const saveMessagesToCache = useCallback(async (roomId: string, messages: Message[]) => {
    try {
      // Save to memory cache (limit size)
      const limitedMessages = messages.slice(-CONFIG.MAX_MESSAGES_PER_ROOM);
      messageCache.current.set(roomId, limitedMessages);

      // Save to storage
      const cacheKey = getCacheKey(roomId);
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data: limitedMessages,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Cache save error:', error);
    }
  }, [getCacheKey]);

  // OPTIMIZATION 3: Batched message processing
  const processMessageQueue = useCallback(() => {
    if (messageQueue.current.length === 0) return;

    const batch = [...messageQueue.current];
    messageQueue.current = [];

    console.log(`📨 Processing ${batch.length} queued messages`);

    setMessages(prev => {
      const updated = [...prev];
      
      batch.forEach(message => {
        const existingIndex = updated.findIndex(m => m.id === message.id);
        if (existingIndex >= 0) {
          updated[existingIndex] = message; // Update existing
        } else {
          updated.push(message); // Add new
        }
      });

      // Sort by timestamp and limit size
      const sorted = updated
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-CONFIG.MAX_MESSAGES_PER_ROOM);

      return sorted;
    });

    setLastActivity(new Date());
  }, []);

  // OPTIMIZATION 4: Smart real-time subscriptions
  const setupRoomSubscription = useCallback((roomId: string) => {
    if (subscriptions.current.has(roomId) || connectionMode === 'polling') {
      return;
    }

    console.log(`🔔 Setting up subscription for room ${roomId}`);

    let messageBuffer: Message[] = [];
    let bufferTimeout: NodeJS.Timeout | null = null;

    const processBuffer = () => {
      if (messageBuffer.length > 0) {
        messageQueue.current.push(...messageBuffer);
        messageBuffer = [];
        processMessageQueue();
      }
    };

    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_room_id=eq.${roomId}`
      }, (payload) => {
        const message = payload.new as Message;
        
        // Buffer messages to reduce UI updates
        messageBuffer.push(message);
        
        if (bufferTimeout) clearTimeout(bufferTimeout);
        bufferTimeout = setTimeout(processBuffer, CONFIG.MESSAGE_BUFFER_TIME);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `chat_room_id=eq.${roomId}`
      }, (payload) => {
        const message = payload.new as Message;
        messageBuffer.push(message);
        
        if (bufferTimeout) clearTimeout(bufferTimeout);
        bufferTimeout = setTimeout(processBuffer, CONFIG.MESSAGE_BUFFER_TIME);
      })
      .subscribe();

    subscriptions.current.set(roomId, channel);
  }, [connectionMode, processMessageQueue]);

  // OPTIMIZATION 5: Presence management with heartbeat
  const setupPresenceManagement = useCallback(() => {
    if (!user || presenceHeartbeat.current) return;

    const updatePresence = async () => {
      try {
        await supabase
          .from('online_status')
          .upsert({
            user_id: user.id,
            is_online: true,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Presence update error:', error);
      }
    };

    // Initial presence
    updatePresence();

    // Heartbeat
    presenceHeartbeat.current = setInterval(updatePresence, CONFIG.PRESENCE_HEARTBEAT_INTERVAL);

    // Listen to presence changes (only for active room)
    if (activeRoom && connectionMode !== 'polling') {
      const presenceChannel = supabase
        .channel('presence')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'online_status'
        }, (payload) => {
          // Update online users list
          fetchOnlineUsers();
        })
        .subscribe();

      subscriptions.current.set('presence', presenceChannel);
    }
  }, [user, activeRoom, connectionMode]);

  // OPTIMIZATION 6: Polling fallback for high load
  const setupPolling = useCallback(() => {
    if (pollingInterval.current || connectionMode === 'real-time') return;

    console.log(`⏰ Setting up polling mode (${CONFIG.POLLING_INTERVAL}ms)`);

    const poll = async () => {
      if (!activeRoom) return;

      try {
        // Poll for new messages
        const { data: newMessages } = await supabase
          .from('messages')
          .select(`
            *,
            sender:employees(id, first_name, last_name, avatar_url)
          `)
          .eq('chat_room_id', activeRoom.id)
          .gt('created_at', lastActivity?.toISOString() || new Date(Date.now() - 60000).toISOString())
          .order('created_at', { ascending: true });

        if (newMessages && newMessages.length > 0) {
          messageQueue.current.push(...newMessages);
          processMessageQueue();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    pollingInterval.current = setInterval(poll, CONFIG.POLLING_INTERVAL);
  }, [connectionMode, activeRoom, lastActivity, processMessageQueue]);

  // Core functions
  const loadMessages = useCallback(async (roomId: string, limit = CONFIG.MESSAGE_BATCH_SIZE, offset = 0) => {
    try {
      setConnectionStatus('connecting');

      // Try cache first
      if (offset === 0) {
        const cached = await loadMessagesFromCache(roomId);
        if (cached && cached.length > 0) {
          setMessages(cached);
          setConnectionStatus('connected');
          return;
        }
      }

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:employees(id, first_name, last_name, avatar_url)
        `)
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const messagesData = data || [];
      
      if (offset === 0) {
        setMessages(messagesData.reverse());
        await saveMessagesToCache(roomId, messagesData);
      } else {
        setMessages(prev => [...messagesData.reverse(), ...prev]);
      }

      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error loading messages:', error);
      setConnectionStatus('disconnected');
    }
  }, [loadMessagesFromCache, saveMessagesToCache]);

  const sendMessage = useCallback(async (content: string, type = 'text') => {
    if (!user || !activeRoom || !content.trim()) return;

    const messageId = `temp_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const sendTime = Date.now();

    // Optimistic update
    const optimisticMessage: Message = {
      id: messageId,
      chat_room_id: activeRoom.id,
      sender_id: user.id,
      content: content.trim(),
      message_type: type as any,
      is_edited: false,
      created_at: timestamp,
      updated_at: timestamp,
      sender: {
        id: user.id,
        first_name: user.user_metadata?.first_name || 'Unknown',
        last_name: user.user_metadata?.last_name || '',
        avatar_url: user.user_metadata?.avatar_url
      }
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: activeRoom.id,
          sender_id: user.id,
          content: content.trim(),
          message_type: type
        })
        .select(`
          *,
          sender:employees(id, first_name, last_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? data : msg
      ));

      // Track latency
      const latency = Date.now() - sendTime;
      setMessageLatency(prev => (prev + latency) / 2); // Rolling average

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      throw error;
    }
  }, [user, activeRoom]);

  const fetchOnlineUsers = useCallback(async () => {
    if (!selectedCompany) return;

    try {
      const { data } = await supabase
        .from('online_status')
        .select('user_id')
        .eq('is_online', true)
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 minutes

      setOnlineUsers(data?.map(u => u.user_id) || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  }, [selectedCompany]);

  const markAsRead = useCallback(async (roomId: string) => {
    // Update local state immediately
    setChatRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, unread_count: 0 } : room
    ));

    // Update server (non-blocking)
    try {
      await supabase
        .from('chat_room_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_room_id', roomId)
        .eq('employee_id', user?.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [user]);

  const joinRoom = useCallback(async (roomId: string) => {
    try {
      await supabase
        .from('chat_room_members')
        .upsert({
          chat_room_id: roomId,
          employee_id: user?.id,
          role: 'member',
          joined_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }, [user]);

  const leaveRoom = useCallback(async (roomId: string) => {
    try {
      await supabase
        .from('chat_room_members')
        .delete()
        .eq('chat_room_id', roomId)
        .eq('employee_id', user?.id);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }, [user]);

  const createRoom = useCallback(async (name: string, type: string, isPrivate = false): Promise<ChatRoom> => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({
        company_id: selectedCompany?.id,
        team_id: selectedTeam,
        name,
        type,
        department: selectedDepartment,
        is_private: isPrivate,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;

    const newRoom: ChatRoom = {
      ...data,
      member_count: 1,
      unread_count: 0
    };

    setChatRooms(prev => [...prev, newRoom]);
    return newRoom;
  }, [selectedCompany, selectedTeam, selectedDepartment, user]);

  const updatePresence = useCallback(async (status: 'online' | 'away' | 'offline') => {
    if (!user) return;

    try {
      await supabase
        .from('online_status')
        .upsert({
          user_id: user.id,
          is_online: status === 'online',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  // Auto-optimize based on user count
  const optimizeForScale = useCallback(() => {
    const optimalMode = determineOptimalMode();
    if (optimalMode !== connectionMode) {
      console.log(`🔄 Auto-switching chat to ${optimalMode} mode (${userCount} users)`);
      setConnectionMode(optimalMode);
    }

    // Limit active subscriptions
    const activeSubscriptions = Array.from(subscriptions.current.keys());
    if (activeSubscriptions.length > CONFIG.MAX_CONCURRENT_ROOMS) {
      const toRemove = activeSubscriptions.slice(CONFIG.MAX_CONCURRENT_ROOMS);
      toRemove.forEach(key => {
        const channel = subscriptions.current.get(key);
        if (channel) {
          supabase.removeChannel(channel);
          subscriptions.current.delete(key);
        }
      });
      console.log(`🧹 Cleaned up ${toRemove.length} inactive subscriptions`);
    }
  }, [determineOptimalMode, connectionMode, userCount]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear all subscriptions
    subscriptions.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    subscriptions.current.clear();

    // Clear intervals
    if (presenceHeartbeat.current) {
      clearInterval(presenceHeartbeat.current);
      presenceHeartbeat.current = null;
    }
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }

    // Clear message queue
    messageQueue.current = [];
  }, []);

  // Setup connection management based on mode
  useEffect(() => {
    cleanup();

    if (activeRoom) {
      switch (connectionMode) {
        case 'real-time':
          setupRoomSubscription(activeRoom.id);
          setupPresenceManagement();
          break;
        case 'hybrid':
          setupRoomSubscription(activeRoom.id);
          setupPolling();
          break;
        case 'polling':
          setupPolling();
          break;
      }
    }

    return cleanup;
  }, [connectionMode, activeRoom, setupRoomSubscription, setupPresenceManagement, setupPolling, cleanup]);

  // Auto-optimize periodically
  useEffect(() => {
    const interval = setInterval(optimizeForScale, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [optimizeForScale]);

  // Set active room and load messages
  const handleSetActiveRoom = useCallback((room: ChatRoom | null) => {
    setActiveRoom(room);
    if (room) {
      loadMessages(room.id);
      markAsRead(room.id);
    } else {
      setMessages([]);
    }
  }, [loadMessages, markAsRead]);

  const value = {
    // Core chat data
    chatRooms,
    activeRoom,
    messages,
    onlineUsers,
    
    // Connection management
    connectionMode,
    connectionStatus,
    userCount,
    
    // Performance metrics
    messageLatency,
    lastActivity,
    
    // Core functions
    setActiveRoom: handleSetActiveRoom,
    sendMessage,
    loadMessages,
    markAsRead,
    
    // Room management
    joinRoom,
    leaveRoom,
    createRoom,
    
    // Presence management
    updatePresence,
    
    // Performance controls
    setConnectionMode,
    optimizeForScale
  };

  return (
    <ScalableChatContext.Provider value={value}>
      {children}
    </ScalableChatContext.Provider>
  );
};

export const useScalableChat = () => {
  const context = useContext(ScalableChatContext);
  if (context === undefined) {
    throw new Error('useScalableChat must be used within a ScalableChatProvider');
  }
  return context;
};
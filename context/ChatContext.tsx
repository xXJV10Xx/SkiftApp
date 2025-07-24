import { RealtimeChannel } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { ShiftChangeRequest } from '../components/ShiftChangeForm';
import { WorkExtraRequest } from '../components/WorkExtraForm';

interface ChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  reply_to: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface ChatRoom {
  id: string;
  company_id: string | null;
  team_id: string | null;
  name: string;
  description: string | null;
  type: string;
  department: string | null;
  is_private: boolean;
  auto_join_department: string | null;
  auto_join_team: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  companies?: {
    name: string;
  };
  teams?: {
    name: string;
    color: string;
  };
}

interface ChatMember {
  id: string;
  chat_room_id: string;
  employee_id: string;
  role: string;
  joined_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
    department: string | null;
    position: string | null;
  };
}

interface ChatContextType {
  messages: ChatMessage[];
  chatRooms: ChatRoom[];
  currentChatRoom: ChatRoom | null;
  chatMembers: ChatMember[];
  loading: boolean;
  sendMessage: (content: string, messageType?: string) => Promise<void>;
  sendShiftChangeRequest: (shiftChangeData: ShiftChangeRequest) => Promise<void>;
  approveShiftChange: (requestId: string) => Promise<void>;
  rejectShiftChange: (requestId: string) => Promise<void>;
  sendWorkExtraRequest: (workExtraData: WorkExtraRequest) => Promise<void>;
  createPrivateWorkChat: (otherUserId: string, requestId: string, chatType: 'shift_exchange' | 'work_extra') => Promise<ChatRoom>;
  joinChatRoom: (roomId: string) => Promise<void>;
  leaveChatRoom: (roomId: string) => Promise<void>;
  setCurrentChatRoom: (room: ChatRoom | null) => void;
  fetchChatRooms: () => Promise<void>;
  createChatRoom: (roomData: any) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentChatRoom, setCurrentChatRoom] = useState<ChatRoom | null>(null);
  const [chatMembers, setChatMembers] = useState<ChatMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch chat rooms user is member of
  const fetchChatRooms = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('chat_room_members')
        .select(`
          chat_rooms (
            id,
            company_id,
            team_id,
            name,
            description,
            type,
            department,
            is_private,
            auto_join_department,
            auto_join_team,
            created_by,
            created_at,
            updated_at,
            companies (
              name
            ),
            teams (
              name,
              color
            )
          )
        `)
        .eq('employee_id', user.id);

      if (error) throw error;

      const rooms = data?.map(item => item.chat_rooms).filter(Boolean) as ChatRoom[];
      setChatRooms(rooms || []);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for current chat room
  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:employees!sender_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Fetch chat room members
  const fetchChatMembers = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_room_members')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            email,
            avatar_url,
            department,
            position
          )
        `)
        .eq('chat_room_id', roomId);

      if (error) throw error;
      setChatMembers(data || []);
    } catch (error) {
      console.error('Error fetching chat members:', error);
    }
  };

  // Send message
  const sendMessage = async (content: string, messageType = 'text') => {
    if (!user || !currentChatRoom) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: currentChatRoom.id,
          sender_id: user.id,
          content,
          message_type: messageType
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Send shift change request
  const sendShiftChangeRequest = async (shiftChangeData: ShiftChangeRequest) => {
    if (!user || !currentChatRoom) return;

    try {
      // First, save the shift change request to database
      const requestData = {
        ...shiftChangeData,
        requester_id: user.id,
        created_at: new Date().toISOString()
      };

      const { data: shiftRequest, error: shiftError } = await supabase
        .from('shift_change_requests')
        .insert(requestData)
        .select()
        .single();

      if (shiftError) throw shiftError;

      // Then send as a chat message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_room_id: currentChatRoom.id,
          sender_id: user.id,
          content: JSON.stringify({ ...requestData, id: shiftRequest.id }),
          message_type: 'shift_change_request'
        });

      if (messageError) throw messageError;
    } catch (error) {
      console.error('Error sending shift change request:', error);
      throw error;
    }
  };

  // Approve shift change
  const approveShiftChange = async (requestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('shift_change_requests')
        .update({ 
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Send confirmation message
      await sendMessage(`Skiftbyte-förfrågan har godkänts.`, 'system');
    } catch (error) {
      console.error('Error approving shift change:', error);
      throw error;
    }
  };

  // Reject shift change
  const rejectShiftChange = async (requestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('shift_change_requests')
        .update({ 
          status: 'rejected',
          rejected_by: user.id,
          rejected_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Send confirmation message
      await sendMessage(`Skiftbyte-förfrågan har avvisats.`, 'system');
    } catch (error) {
      console.error('Error rejecting shift change:', error);
      throw error;
    }
  };

  // Send work extra request
  const sendWorkExtraRequest = async (workExtraData: WorkExtraRequest) => {
    if (!user || !currentChatRoom) return;

    try {
      // First, save the work extra request to database
      const requestData = {
        ...workExtraData,
        requester_id: user.id,
        created_at: new Date().toISOString()
      };

      const { data: workRequest, error: workError } = await supabase
        .from('work_extra_requests')
        .insert(requestData)
        .select()
        .single();

      if (workError) throw workError;

      // Then send as a chat message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_room_id: currentChatRoom.id,
          sender_id: user.id,
          content: JSON.stringify({ ...requestData, id: workRequest.id }),
          message_type: 'work_extra_request'
        });

      if (messageError) throw messageError;
    } catch (error) {
      console.error('Error sending work extra request:', error);
      throw error;
    }
  };

  // Create private chat for work requests (shift exchange or work extra)
  const createPrivateWorkChat = async (otherUserId: string, requestId: string, chatType: 'shift_exchange' | 'work_extra'): Promise<ChatRoom> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get both users' information
      const { data: users, error: usersError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, company_id')
        .in('id', [user.id, otherUserId]);

      if (usersError) throw usersError;
      if (!users || users.length !== 2) throw new Error('Could not find users');

      const currentUser = users.find(u => u.id === user.id);
      const otherUser = users.find(u => u.id === otherUserId);

      if (!currentUser || !otherUser) throw new Error('User data incomplete');

      // Check if private chat already exists between these users
      const { data: existingChats, error: existingError } = await supabase
        .from('chat_room_members')
        .select(`
          chat_room_id,
          chat_rooms!inner (
            id,
            name,
            type,
            is_private,
            company_id,
            created_at
          )
        `)
        .eq('employee_id', user.id);

      if (existingError) throw existingError;

             // Check if there's already a private chat with the other user for this type
       for (const chatMember of existingChats || []) {
         const chatRoom = chatMember.chat_rooms;
         if (chatRoom.is_private && chatRoom.type === chatType) {
           // Check if other user is also in this chat
           const { data: otherMembers, error: otherMembersError } = await supabase
             .from('chat_room_members')
             .select('employee_id')
             .eq('chat_room_id', chatRoom.id)
             .eq('employee_id', otherUserId);

           if (otherMembersError) throw otherMembersError;
           
           if (otherMembers && otherMembers.length > 0) {
             // Private chat already exists, return it
             return chatRoom as ChatRoom;
           }
         }
       }

             // Create new private chat room
       const chatTypeNames = {
         'shift_exchange': 'Skiftbyte',
         'work_extra': 'Extrajobb'
       };
       
       const chatRoomName = `${chatTypeNames[chatType]}: ${currentUser.first_name} & ${otherUser.first_name}`;
       
       const descriptions = {
         'shift_exchange': `Privat chat för skiftbyte mellan ${currentUser.first_name} ${currentUser.last_name} och ${otherUser.first_name} ${otherUser.last_name}`,
         'work_extra': `Privat chat för extrajobb mellan ${currentUser.first_name} ${currentUser.last_name} och ${otherUser.first_name} ${otherUser.last_name}`
       };
       
       const { data: newChatRoom, error: chatRoomError } = await supabase
         .from('chat_rooms')
         .insert({
           company_id: currentUser.company_id,
           name: chatRoomName,
           description: descriptions[chatType],
           type: chatType,
           is_private: true,
           created_by: user.id
         })
         .select()
         .single();

      if (chatRoomError) throw chatRoomError;

      // Add both users to the chat room
      const { error: membersError } = await supabase
        .from('chat_room_members')
        .insert([
          {
            chat_room_id: newChatRoom.id,
            employee_id: user.id,
            role: 'member'
          },
          {
            chat_room_id: newChatRoom.id,
            employee_id: otherUserId,
            role: 'member'
          }
        ]);

      if (membersError) throw membersError;

             // Send initial system message about responsibility
       const systemMessages = {
         'shift_exchange': `🔄 **Skiftbyte-chat skapad**\n\n📋 **Viktigt att komma ihåg:**\n• Den som ansökt om skiftbytet ansvarar för att meddela sin chef\n• Kom överens om alla detaljer innan ni informerar chefen\n• Se till att båda parter är överens om bytet\n\n💬 Ni kan nu diskutera detaljerna för ert skiftbyte här!`,
         'work_extra': `💼 **Extrajobb-chat skapad**\n\n📋 **Viktigt att komma ihåg:**\n• Den som publicerat extrajobbet ansvarar för att meddela sin chef\n• Kom överens om alla detaljer innan jobbet bekräftas\n• Se till att båda parter är överens om villkoren\n\n💬 Ni kan nu diskutera detaljerna för extrajobbet här!`
       };
       
       const { error: messageError } = await supabase
         .from('messages')
         .insert({
           chat_room_id: newChatRoom.id,
           sender_id: user.id,
           content: systemMessages[chatType],
           message_type: 'system'
         });

      if (messageError) throw messageError;

      // Refresh chat rooms list
      await fetchChatRooms();

      return newChatRoom as ChatRoom;
    } catch (error) {
      console.error('Error creating private shift chat:', error);
      throw error;
    }
  };

  // Join chat room
  const joinChatRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_room_members')
        .insert({
          chat_room_id: roomId,
          employee_id: user.id,
          role: 'member'
        });

      if (error) throw error;
      await fetchChatRooms();
    } catch (error) {
      console.error('Error joining chat room:', error);
      throw error;
    }
  };

  // Leave chat room
  const leaveChatRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_room_members')
        .delete()
        .eq('chat_room_id', roomId)
        .eq('employee_id', user.id);

      if (error) throw error;
      
      if (currentChatRoom?.id === roomId) {
        setCurrentChatRoom(null);
      }
      
      await fetchChatRooms();
    } catch (error) {
      console.error('Error leaving chat room:', error);
      throw error;
    }
  };

  // Create chat room
  const createChatRoom = async (roomData: any) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          ...roomData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join creator to the room
      await joinChatRoom(data.id);
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!currentChatRoom) {
      if (channel) {
        channel.unsubscribe();
        setChannel(null);
      }
      return;
    }

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`chat:${currentChatRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${currentChatRoom.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${currentChatRoom.id}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe();

    setChannel(messageChannel);

    return () => {
      messageChannel.unsubscribe();
    };
  }, [currentChatRoom]);

  // Load data when current chat room changes
  useEffect(() => {
    if (currentChatRoom) {
      fetchMessages(currentChatRoom.id);
      fetchChatMembers(currentChatRoom.id);
    } else {
      setMessages([]);
      setChatMembers([]);
    }
  }, [currentChatRoom]);

  // Load chat rooms on mount
  useEffect(() => {
    if (user) {
      fetchChatRooms();
    }
  }, [user]);

  const value = {
    messages,
    chatRooms,
    currentChatRoom,
    chatMembers,
    loading,
    sendMessage,
         sendShiftChangeRequest,
     approveShiftChange,
     rejectShiftChange,
     sendWorkExtraRequest,
     createPrivateWorkChat,
    joinChatRoom,
    leaveChatRoom,
    setCurrentChatRoom,
    fetchChatRooms,
    createChatRoom
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
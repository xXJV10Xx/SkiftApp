import { RealtimeChannel } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ChatMessage {
  id: string;
  team_id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: string;
  joined_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  online_status?: {
    is_online: boolean;
    last_seen: string;
  };
}

interface Team {
  id: string;
  name: string;
  color: string;
  company_id: string;
  description: string | null;
  company?: {
    name: string;
  };
}

interface ChatContextType {
  messages: ChatMessage[];
  teamMembers: TeamMember[];
  currentTeam: Team | null;
  teams: Team[];
  loading: boolean;
  sendMessage: (message: string) => Promise<void>;
  joinTeam: (teamId: string) => Promise<void>;
  leaveTeam: (teamId: string) => Promise<void>;
  setCurrentTeam: (team: Team | null) => void;
  updateOnlineStatus: (isOnline: boolean) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch user's teams
  const fetchUserTeams = async () => {
    if (!user) return;

    try {
      const { data: teamMemberships, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams (
            id,
            name,
            color,
            company_id,
            description,
            companies (
              name
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const userTeams = (teamMemberships?.map(tm => tm.teams).filter(Boolean) || []) as unknown as Team[];
      setTeams(userTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  // Fetch team members
  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          user:profiles!user_id (
            full_name,
            email,
            avatar_url
          ),
          online_status!user_id (
            is_online,
            last_seen
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  // Fetch chat messages
  const fetchMessages = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user:profiles!user_id (
            full_name,
            email
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send message
  const sendMessage = async (message: string) => {
    if (!user || !currentTeam) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          team_id: currentTeam.id,
          user_id: user.id,
          message,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Join team
  const joinTeam = async (teamId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          user_id: user.id,
          team_id: teamId,
          role: 'member',
        });

      if (error) throw error;
      await fetchUserTeams();
    } catch (error) {
      console.error('Error joining team:', error);
    }
  };

  // Leave team
  const leaveTeam = async (teamId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('user_id', user.id)
        .eq('team_id', teamId);

      if (error) throw error;
      await fetchUserTeams();
    } catch (error) {
      console.error('Error leaving team:', error);
    }
  };

  // Update online status
  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('online_status')
        .upsert({
          user_id: user.id,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!currentTeam) return;

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`chat:${currentTeam.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `team_id=eq.${currentTeam.id}`,
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
          table: 'online_status',
        },
        () => {
          // Refresh team members to update online status
          fetchTeamMembers(currentTeam.id);
        }
      )
      .subscribe();

    setChannel(messageChannel);

    return () => {
      messageChannel.unsubscribe();
    };
  }, [currentTeam]);

  // Load data when current team changes
  useEffect(() => {
    if (currentTeam) {
      fetchMessages(currentTeam.id);
      fetchTeamMembers(currentTeam.id);
    }
  }, [currentTeam]);

  // Load user teams on mount
  useEffect(() => {
    if (user) {
      fetchUserTeams();
      updateOnlineStatus(true);
    }
  }, [user]);

  // Update online status when app goes to background/foreground
  useEffect(() => {
    const handleAppStateChange = (isActive: boolean) => {
      updateOnlineStatus(isActive);
    };

    // Set up app state listeners here if needed
    return () => {
      updateOnlineStatus(false);
    };
  }, []);

  const value = {
    messages,
    teamMembers,
    currentTeam,
    teams,
    loading,
    sendMessage,
    joinTeam,
    leaveTeam,
    setCurrentTeam,
    updateOnlineStatus,
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
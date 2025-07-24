import { supabase } from '../lib/supabase';
import { databaseService, LocalMessage, LocalTeam, LocalChatRoom } from './DatabaseService';

export interface SyncResult {
  success: boolean;
  messagesDownloaded: number;
  messagesUploaded: number;
  teamsDownloaded: number;
  teamsUploaded: number;
  chatRoomsDownloaded: number;
  error?: string;
}

class SyncService {
  private isSyncing = false;

  async syncWithSupabase(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return {
        success: false,
        messagesDownloaded: 0,
        messagesUploaded: 0,
        teamsDownloaded: 0,
        teamsUploaded: 0,
        chatRoomsDownloaded: 0,
        error: 'Sync already in progress'
      };
    }

    this.isSyncing = true;
    console.log('Starting sync with Supabase...');

    try {
      const result: SyncResult = {
        success: true,
        messagesDownloaded: 0,
        messagesUploaded: 0,
        teamsDownloaded: 0,
        teamsUploaded: 0,
        chatRoomsDownloaded: 0
      };

      // Sync messages
      const messageResult = await this.syncMessages();
      result.messagesDownloaded = messageResult.downloaded;
      result.messagesUploaded = messageResult.uploaded;

      // Sync teams
      const teamResult = await this.syncTeams();
      result.teamsDownloaded = teamResult.downloaded;
      result.teamsUploaded = teamResult.uploaded;

      // Sync chat rooms
      const chatRoomResult = await this.syncChatRooms();
      result.chatRoomsDownloaded = chatRoomResult.downloaded;

      console.log('Sync completed successfully:', result);
      return result;

    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        messagesDownloaded: 0,
        messagesUploaded: 0,
        teamsDownloaded: 0,
        teamsUploaded: 0,
        chatRoomsDownloaded: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncMessages(): Promise<{ downloaded: number; uploaded: number }> {
    let downloaded = 0;
    let uploaded = 0;

    try {
      // 1. Download new messages from Supabase
      const lastSync = await databaseService.getLastSyncTime('messages');
      let query = supabase
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
        .order('created_at', { ascending: true });

      // Only fetch messages newer than last sync
      if (lastSync) {
        query = query.gt('updated_at', lastSync);
      }

      const { data: remoteMessages, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch messages: ${fetchError.message}`);
      }

      // Insert new messages into local database
      if (remoteMessages && remoteMessages.length > 0) {
        for (const message of remoteMessages) {
          const localMessage: Omit<LocalMessage, 'synced'> = {
            id: message.id,
            chat_room_id: message.chat_room_id,
            sender_id: message.sender_id,
            content: message.content,
            message_type: message.message_type,
            file_url: message.file_url,
            reply_to: message.reply_to,
            is_edited: message.is_edited,
            created_at: message.created_at,
            updated_at: message.updated_at
          };

          await databaseService.insertMessage(localMessage);
          await databaseService.markMessageAsSynced(message.id);
          downloaded++;
        }
      }

      // 2. Upload local unsynced messages to Supabase
      const unsyncedMessages = await databaseService.getUnsyncedMessages();

      for (const localMessage of unsyncedMessages) {
        try {
          // Skip messages that don't have a real ID (only local_id)
          if (!localMessage.id || localMessage.id.startsWith('local_')) {
            // Generate a new UUID for the message
            const { data, error } = await supabase
              .from('messages')
              .insert({
                chat_room_id: localMessage.chat_room_id,
                sender_id: localMessage.sender_id,
                content: localMessage.content,
                message_type: localMessage.message_type,
                file_url: localMessage.file_url,
                reply_to: localMessage.reply_to,
                is_edited: localMessage.is_edited
              })
              .select()
              .single();

            if (error) {
              console.error('Failed to upload message:', error);
              continue;
            }

            // Update local message with the server-generated ID
            if (data) {
              await databaseService.insertMessage({
                ...localMessage,
                id: data.id,
                created_at: data.created_at,
                updated_at: data.updated_at
              });
              await databaseService.markMessageAsSynced(data.id);
              uploaded++;
            }
          } else {
            // Message has a real ID, just mark as synced
            await databaseService.markMessageAsSynced(localMessage.id);
          }
        } catch (uploadError) {
          console.error('Failed to upload message:', uploadError);
          // Continue with other messages
        }
      }

      // Update last sync time
      await databaseService.updateLastSyncTime('messages', new Date().toISOString());

    } catch (error) {
      console.error('Error syncing messages:', error);
      throw error;
    }

    return { downloaded, uploaded };
  }

  private async syncTeams(): Promise<{ downloaded: number; uploaded: number }> {
    let downloaded = 0;
    let uploaded = 0;

    try {
      // 1. Download new teams from Supabase
      const lastSync = await databaseService.getLastSyncTime('teams');
      let query = supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: true });

      if (lastSync) {
        query = query.gt('updated_at', lastSync);
      }

      const { data: remoteTeams, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch teams: ${fetchError.message}`);
      }

      // Insert new teams into local database
      if (remoteTeams && remoteTeams.length > 0) {
        for (const team of remoteTeams) {
          const localTeam: Omit<LocalTeam, 'synced'> = {
            id: team.id,
            company_id: team.company_id,
            name: team.name,
            description: team.description,
            color: team.color,
            created_at: team.created_at,
            updated_at: team.updated_at
          };

          await databaseService.insertTeam(localTeam);
          await databaseService.markTeamAsSynced(team.id);
          downloaded++;
        }
      }

      // 2. Upload local unsynced teams to Supabase
      const unsyncedTeams = await databaseService.getUnsyncedTeams();

      for (const localTeam of unsyncedTeams) {
        try {
          if (!localTeam.id || localTeam.id.startsWith('local_')) {
            // Create new team on server
            const { data, error } = await supabase
              .from('teams')
              .insert({
                company_id: localTeam.company_id,
                name: localTeam.name,
                description: localTeam.description,
                color: localTeam.color
              })
              .select()
              .single();

            if (error) {
              console.error('Failed to upload team:', error);
              continue;
            }

            if (data) {
              await databaseService.insertTeam({
                ...localTeam,
                id: data.id,
                created_at: data.created_at,
                updated_at: data.updated_at
              });
              await databaseService.markTeamAsSynced(data.id);
              uploaded++;
            }
          } else {
            await databaseService.markTeamAsSynced(localTeam.id);
          }
        } catch (uploadError) {
          console.error('Failed to upload team:', uploadError);
        }
      }

      // Update last sync time
      await databaseService.updateLastSyncTime('teams', new Date().toISOString());

    } catch (error) {
      console.error('Error syncing teams:', error);
      throw error;
    }

    return { downloaded, uploaded };
  }

  private async syncChatRooms(): Promise<{ downloaded: number; uploaded: number }> {
    let downloaded = 0;
    let uploaded = 0;

    try {
      // 1. Download new chat rooms from Supabase
      const lastSync = await databaseService.getLastSyncTime('chat_rooms');
      let query = supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: true });

      if (lastSync) {
        query = query.gt('updated_at', lastSync);
      }

      const { data: remoteChatRooms, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch chat rooms: ${fetchError.message}`);
      }

      // Insert new chat rooms into local database
      if (remoteChatRooms && remoteChatRooms.length > 0) {
        for (const chatRoom of remoteChatRooms) {
          const localChatRoom: Omit<LocalChatRoom, 'synced'> = {
            id: chatRoom.id,
            company_id: chatRoom.company_id,
            team_id: chatRoom.team_id,
            name: chatRoom.name,
            description: chatRoom.description,
            type: chatRoom.type,
            department: chatRoom.department,
            is_private: chatRoom.is_private,
            auto_join_department: chatRoom.auto_join_department,
            auto_join_team: chatRoom.auto_join_team,
            created_by: chatRoom.created_by,
            created_at: chatRoom.created_at,
            updated_at: chatRoom.updated_at
          };

          await databaseService.insertChatRoom(localChatRoom);
          downloaded++;
        }
      }

      // Update last sync time
      await databaseService.updateLastSyncTime('chat_rooms', new Date().toISOString());

    } catch (error) {
      console.error('Error syncing chat rooms:', error);
      throw error;
    }

    return { downloaded, uploaded };
  }

  // Check if device is online
  async isOnline(): Promise<boolean> {
    try {
      // Simple connectivity check by pinging Supabase
      const { error } = await supabase.from('companies').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // Get sync status
  getSyncStatus(): { isSyncing: boolean } {
    return { isSyncing: this.isSyncing };
  }

  // Force sync (useful for manual sync triggers)
  async forcSync(): Promise<SyncResult> {
    this.isSyncing = false; // Reset sync lock
    return this.syncWithSupabase();
  }
}

export const syncService = new SyncService();
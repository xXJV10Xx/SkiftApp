import { supabase } from './supabase';
import { Alert } from 'react-native';

export interface GroupMember {
  user_id: string;
  is_online: boolean;
  joined_at: string;
  users: {
    username: string;
    avatar_url: string | null;
    first_name?: string;
    last_name?: string;
  };
}

export interface ChatForm {
  id: string;
  type: 'skiftöverlämning' | 'jobba extra' | 'haveri';
  sender_id: string;
  group_id: string;
  date: string;
  shift: string;
  description: string;
  interested_user_ids: string[];
  created_at: string;
  sender?: {
    username: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'form' | 'image';
  metadata?: any;
  created_at: string;
  sender?: {
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

/**
 * Markera användare som intresserad av ett formulär och starta privat chatt
 */
export async function markInterested(formId: string, interestedUserId: string): Promise<boolean> {
  try {
    // Använd Supabase RPC för att lägga till användare i interested_user_ids array
    const { data, error } = await supabase.rpc('add_interested_user', {
      form_id_input: formId,
      user_id_input: interestedUserId
    });

    if (error) {
      console.error('Error marking interested:', error);
      Alert.alert('Fel', 'Kunde inte markera intresse');
      return false;
    }

    // Hämta formulärets avsändare för att starta privat chatt
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('sender_id')
      .eq('id', formId)
      .single();

    if (formError) {
      console.error('Error fetching form sender:', formError);
      return true; // Intresse markerat men privat chatt misslyckades
    }

    // Starta privat chatt mellan intresserad användare och formulärets avsändare
    await startPrivateChat(interestedUserId, formData.sender_id);
    
    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    Alert.alert('Fel', 'Ett oväntat fel uppstod');
    return false;
  }
}

/**
 * Starta en privat chatt mellan två användare
 */
export async function startPrivateChat(userId1: string, userId2: string): Promise<string | null> {
  try {
    // Kontrollera om en privat grupp redan finns mellan dessa användare
    const { data: existingGroups, error: searchError } = await supabase
      .from('groups')
      .select(`
        id,
        group_members!inner(user_id)
      `)
      .eq('name', null) // Privata grupper har inget namn
      .limit(10);

    if (searchError) {
      console.error('Error searching for existing private chat:', searchError);
    }

    // Hitta en grupp som bara har dessa två användare
    let existingGroupId = null;
    if (existingGroups) {
      for (const group of existingGroups) {
        const memberIds = group.group_members.map((m: any) => m.user_id);
        if (memberIds.length === 2 && 
            memberIds.includes(userId1) && 
            memberIds.includes(userId2)) {
          existingGroupId = group.id;
          break;
        }
      }
    }

    if (existingGroupId) {
      return existingGroupId;
    }

    // Skapa ny privat grupp
    const { data: newGroup, error: groupError } = await supabase
      .from('groups')
      .insert([{
        name: null, // Privata grupper har inget namn
        created_by: userId1
      }])
      .select()
      .single();

    if (groupError) {
      console.error('Error creating private group:', groupError);
      Alert.alert('Fel', 'Kunde inte starta privat chatt');
      return null;
    }

    // Lägg till båda användarna i gruppen
    const { error: membersError } = await supabase
      .from('group_members')
      .insert([
        { group_id: newGroup.id, user_id: userId1 },
        { group_id: newGroup.id, user_id: userId2 }
      ]);

    if (membersError) {
      console.error('Error adding members to private group:', membersError);
      // Försök ta bort gruppen om medlemmar inte kunde läggas till
      await supabase.from('groups').delete().eq('id', newGroup.id);
      Alert.alert('Fel', 'Kunde inte starta privat chatt');
      return null;
    }

    return newGroup.id;
  } catch (error) {
    console.error('Unexpected error starting private chat:', error);
    Alert.alert('Fel', 'Ett oväntat fel uppstod');
    return null;
  }
}

/**
 * Hämta onlineanvändare för en grupp med profilbilder
 */
export async function getOnlineGroupMembers(groupId: string): Promise<GroupMember[]> {
  try {
    const { data: members, error } = await supabase
      .from('group_members')
      .select(`
        user_id,
        is_online,
        joined_at,
        users!inner (
          username,
          avatar_url,
          first_name,
          last_name
        )
      `)
      .eq('group_id', groupId)
      .eq('is_online', true)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching online members:', error);
      return [];
    }

    return members || [];
  } catch (error) {
    console.error('Unexpected error fetching online members:', error);
    return [];
  }
}

/**
 * Uppdatera användarens online-status
 */
export async function updateOnlineStatus(groupId: string, userId: string, isOnline: boolean): Promise<void> {
  try {
    const { error } = await supabase
      .from('group_members')
      .update({ is_online: isOnline })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating online status:', error);
    }
  } catch (error) {
    console.error('Unexpected error updating online status:', error);
  }
}

/**
 * Skicka ett meddelande till en grupp
 */
export async function sendMessage(
  groupId: string, 
  content: string, 
  type: 'text' | 'form' | 'image' = 'text',
  metadata?: any
): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      Alert.alert('Fel', 'Du måste vara inloggad');
      return false;
    }

    const { error } = await supabase
      .from('messages')
      .insert([{
        group_id: groupId,
        sender_id: user.user.id,
        content,
        type,
        metadata
      }]);

    if (error) {
      console.error('Error sending message:', error);
      Alert.alert('Fel', 'Kunde inte skicka meddelandet');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error sending message:', error);
    Alert.alert('Fel', 'Ett oväntat fel uppstod');
    return false;
  }
}

/**
 * Hämta meddelanden för en grupp
 */
export async function getGroupMessages(groupId: string, limit: number = 50): Promise<ChatMessage[]> {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        group_id,
        sender_id,
        content,
        type,
        metadata,
        created_at,
        sender:users!sender_id (
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return messages || [];
  } catch (error) {
    console.error('Unexpected error fetching messages:', error);
    return [];
  }
}
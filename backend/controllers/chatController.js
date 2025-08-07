// Chat Controller
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class ChatController {
  // Get chat rooms for user
  static async getChatRooms(req, res) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_team, company_type')
        .eq('id', req.user.id)
        .single();

      if (!profile) {
        return res.status(404).json({
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      // Get public rooms and team-specific rooms
      let query = supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_messages!inner (
            id,
            content,
            created_at,
            user_id,
            profiles!inner (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .or(`is_public.eq.true,and(is_team_specific.eq.true,team_number.eq.${profile.selected_team})`)
        .order('updated_at', { ascending: false });

      const { data: rooms, error } = await query;

      if (error) {
        return res.status(500).json({
          error: 'Failed to get chat rooms',
          code: 'DATABASE_ERROR',
          details: error.message
        });
      }

      // Get latest message for each room
      const roomsWithLatestMessage = rooms.map(room => {
        const latestMessage = room.chat_messages
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

        return {
          ...room,
          latest_message: latestMessage || null,
          message_count: room.chat_messages.length
        };
      });

      res.json({
        rooms: roomsWithLatestMessage,
        user_team: profile.selected_team
      });

    } catch (error) {
      console.error('Get chat rooms error:', error);
      res.status(500).json({
        error: 'Failed to get chat rooms',
        code: 'DATABASE_ERROR'
      });
    }
  }

  // Get messages for a specific room
  static async getRoomMessages(req, res) {
    try {
      const { roomId } = req.params;
      const { limit = 50, offset = 0, before } = req.query;

      // Check if user has access to this room
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('*, profiles!inner(selected_team)')
        .eq('id', roomId)
        .single();

      if (!room) {
        return res.status(404).json({
          error: 'Room not found',
          code: 'ROOM_NOT_FOUND'
        });
      }

      // Verify access permissions
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_team')
        .eq('id', req.user.id)
        .single();

      if (room.is_team_specific && room.team_number !== profile.selected_team) {
        return res.status(403).json({
          error: 'Access denied to this room',
          code: 'ACCESS_DENIED'
        });
      }

      // Get messages with pagination
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          profiles!inner (
            id,
            full_name,
            avatar_url
          ),
          reply_to_message:reply_to (
            id,
            content,
            profiles!inner (
              full_name
            )
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      // Add before filter if specified
      if (before) {
        query = query.lt('created_at', before);
      }

      const { data: messages, error } = await query;

      if (error) {
        return res.status(500).json({
          error: 'Failed to get messages',
          code: 'DATABASE_ERROR',
          details: error.message
        });
      }

      res.json({
        room_id: roomId,
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: messages.length === parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get room messages error:', error);
      res.status(500).json({
        error: 'Failed to get messages',
        code: 'DATABASE_ERROR'
      });
    }
  }

  // Send a message
  static async sendMessage(req, res) {
    try {
      const { roomId } = req.params;
      const { content, message_type = 'text', reply_to } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          error: 'Message content is required',
          code: 'INVALID_INPUT'
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          error: 'Message too long (max 1000 characters)',
          code: 'MESSAGE_TOO_LONG'
        });
      }

      // Verify room access
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (!room) {
        return res.status(404).json({
          error: 'Room not found',
          code: 'ROOM_NOT_FOUND'
        });
      }

      // Check team access for team-specific rooms
      if (room.is_team_specific) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('selected_team')
          .eq('id', req.user.id)
          .single();

        if (room.team_number !== profile.selected_team) {
          return res.status(403).json({
            error: 'Access denied to this room',
            code: 'ACCESS_DENIED'
          });
        }
      }

      // Validate reply_to message if specified
      if (reply_to) {
        const { data: replyMessage } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('id', reply_to)
          .eq('room_id', roomId)
          .single();

        if (!replyMessage) {
          return res.status(400).json({
            error: 'Reply message not found in this room',
            code: 'INVALID_REPLY'
          });
        }
      }

      // Insert message
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: req.user.id,
          content: content.trim(),
          message_type,
          reply_to
        })
        .select(`
          *,
          profiles!inner (
            id,
            full_name,
            avatar_url
          ),
          reply_to_message:reply_to (
            id,
            content,
            profiles!inner (
              full_name
            )
          )
        `)
        .single();

      if (error) {
        return res.status(500).json({
          error: 'Failed to send message',
          code: 'DATABASE_ERROR',
          details: error.message
        });
      }

      // Update room's updated_at timestamp
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', roomId);

      res.status(201).json({
        message: 'Message sent successfully',
        data: message
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        error: 'Failed to send message',
        code: 'DATABASE_ERROR'
      });
    }
  }

  // Edit a message
  static async editMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          error: 'Message content is required',
          code: 'INVALID_INPUT'
        });
      }

      // Verify message ownership
      const { data: message } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('id', messageId)
        .eq('user_id', req.user.id)
        .single();

      if (!message) {
        return res.status(404).json({
          error: 'Message not found or access denied',
          code: 'MESSAGE_NOT_FOUND'
        });
      }

      // Check if message is too old to edit (24 hours)
      const messageAge = Date.now() - new Date(message.created_at).getTime();
      if (messageAge > 24 * 60 * 60 * 1000) {
        return res.status(400).json({
          error: 'Message too old to edit (24h limit)',
          code: 'EDIT_TIME_EXPIRED'
        });
      }

      // Update message
      const { data: updatedMessage, error } = await supabase
        .from('chat_messages')
        .update({
          content: content.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select(`
          *,
          profiles!inner (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        return res.status(500).json({
          error: 'Failed to edit message',
          code: 'DATABASE_ERROR',
          details: error.message
        });
      }

      res.json({
        message: 'Message edited successfully',
        data: updatedMessage
      });

    } catch (error) {
      console.error('Edit message error:', error);
      res.status(500).json({
        error: 'Failed to edit message',
        code: 'DATABASE_ERROR'
      });
    }
  }

  // Delete a message
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;

      // Verify message ownership
      const { data: message } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('id', messageId)
        .eq('user_id', req.user.id)
        .single();

      if (!message) {
        return res.status(404).json({
          error: 'Message not found or access denied',
          code: 'MESSAGE_NOT_FOUND'
        });
      }

      // Delete message
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        return res.status(500).json({
          error: 'Failed to delete message',
          code: 'DATABASE_ERROR',
          details: error.message
        });
      }

      res.json({
        message: 'Message deleted successfully'
      });

    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        error: 'Failed to delete message',
        code: 'DATABASE_ERROR'
      });
    }
  }

  // Create a new chat room (admin only)
  static async createRoom(req, res) {
    try {
      const { name, description, team_number, is_public = false } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          error: 'Room name is required',
          code: 'INVALID_INPUT'
        });
      }

      // For now, only allow admins to create rooms
      // In a real app, you'd check user roles here
      
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: name.trim(),
          description: description?.trim(),
          team_number,
          is_public,
          is_team_specific: !!team_number,
          created_by: req.user.id
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          error: 'Failed to create room',
          code: 'DATABASE_ERROR',
          details: error.message
        });
      }

      res.status(201).json({
        message: 'Room created successfully',
        room
      });

    } catch (error) {
      console.error('Create room error:', error);
      res.status(500).json({
        error: 'Failed to create room',
        code: 'DATABASE_ERROR'
      });
    }
  }
}

module.exports = ChatController;
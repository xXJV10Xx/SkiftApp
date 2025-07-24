import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  schema: string;
  old_record: any;
}

interface Employee {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
}

interface PushNotificationPayload {
  to: string;
  title: string;
  body: string;
  data?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const payload: WebhookPayload = await req.json();
    
    // Only process INSERT events on the messages table
    if (payload.type !== 'INSERT' || payload.table !== 'messages') {
      return new Response('Not a new message', {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const message = payload.record;
    console.log('Processing new message:', message);

    // Extract @mentions from the message content
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(message.content)) !== null) {
      mentions.push(match[1]);
    }

    if (mentions.length === 0) {
      return new Response('No mentions found', {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log('Found mentions:', mentions);

    // Get the sender information
    const { data: sender, error: senderError } = await supabaseClient
      .from('employees')
      .select('first_name, last_name')
      .eq('id', message.sender_id)
      .single();

    if (senderError) {
      console.error('Error fetching sender:', senderError);
      throw senderError;
    }

    // Get the chat room information
    const { data: chatRoom, error: chatRoomError } = await supabaseClient
      .from('chat_rooms')
      .select('name')
      .eq('id', message.chat_room_id)
      .single();

    if (chatRoomError) {
      console.error('Error fetching chat room:', chatRoomError);
      throw chatRoomError;
    }

    // Find employees by their employee_id or first name that match the mentions
    const { data: mentionedEmployees, error: employeesError } = await supabaseClient
      .from('employees')
      .select('id, email, first_name, last_name, employee_id')
      .or(
        mentions.map(mention => 
          `employee_id.eq.${mention},first_name.ilike.${mention}`
        ).join(',')
      )
      .eq('is_active', true);

    if (employeesError) {
      console.error('Error fetching mentioned employees:', employeesError);
      throw employeesError;
    }

    console.log('Found mentioned employees:', mentionedEmployees);

    if (!mentionedEmployees || mentionedEmployees.length === 0) {
      return new Response('No valid mentioned employees found', {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Send push notifications to mentioned users
    const notificationPromises = mentionedEmployees.map(async (employee: Employee) => {
      try {
        // Get the user's push token (you'll need to store this in a separate table)
        const { data: pushTokenData, error: tokenError } = await supabaseClient
          .from('push_tokens')
          .select('token')
          .eq('employee_id', employee.id)
          .eq('is_active', true);

        if (tokenError) {
          console.error(`Error fetching push token for ${employee.email}:`, tokenError);
          return null;
        }

        if (!pushTokenData || pushTokenData.length === 0) {
          console.log(`No push token found for ${employee.email}`);
          return null;
        }

        // Send notification to each device token
        const notificationResults = await Promise.all(
          pushTokenData.map(async (tokenData) => {
            const notificationPayload: PushNotificationPayload = {
              to: tokenData.token,
              title: `You were mentioned in ${chatRoom.name}`,
              body: `${sender.first_name} ${sender.last_name}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
              data: {
                chatRoomId: message.chat_room_id,
                messageId: message.id,
                senderId: message.sender_id,
                type: 'mention',
              },
            };

            // Send to Expo Push Notification service
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(notificationPayload),
            });

            const result = await response.json();
            console.log(`Push notification sent to ${employee.email}:`, result);
            return result;
          })
        );

        return notificationResults;
      } catch (error) {
        console.error(`Error sending notification to ${employee.email}:`, error);
        return null;
      }
    });

    const results = await Promise.all(notificationPromises);
    console.log('All notification results:', results);

    // Store mention records in the database for tracking
    const mentionRecords = mentionedEmployees.map(employee => ({
      message_id: message.id,
      mentioned_employee_id: employee.id,
      mentioned_by: message.sender_id,
      chat_room_id: message.chat_room_id,
      created_at: new Date().toISOString(),
    }));

    const { error: mentionError } = await supabaseClient
      .from('message_mentions')
      .insert(mentionRecords);

    if (mentionError) {
      console.error('Error storing mention records:', mentionError);
      // Don't throw here as the main functionality (sending notifications) was successful
    }

    return new Response(
      JSON.stringify({
        success: true,
        mentionsProcessed: mentions.length,
        notificationsSent: results.filter(r => r !== null).length,
        mentionedEmployees: mentionedEmployees.map(e => ({
          id: e.id,
          name: `${e.first_name} ${e.last_name}`,
          email: e.email
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in handle-new-message function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FCMMessage {
  to: string
  notification: {
    title: string
    body: string
    icon?: string
  }
  data?: {
    [key: string]: string
  }
}

async function sendFCMNotification(message: FCMMessage): Promise<boolean> {
  try {
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
    if (!fcmServerKey) {
      console.error('FCM_SERVER_KEY not configured')
      return false
    }

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      console.error('FCM request failed:', await response.text())
      return false
    }

    const result = await response.json()
    console.log('FCM response:', result)
    return result.success === 1
  } catch (error) {
    console.error('Error sending FCM notification:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { chat_id, message_content, message_type = 'text' } = await req.json()

    if (!chat_id || !message_content) {
      return new Response(
        JSON.stringify({ error: 'chat_id and message_content are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get chat info and participants
    const { data: chatData, error: chatError } = await supabaseClient
      .from('private_chats')
      .select(`
        *,
        participant_1:profiles!participant_1_id(id, username, fcm_token),
        participant_2:profiles!participant_2_id(id, username, fcm_token),
        trade_request:shift_trade_requests(
          *,
          shifts(title, start_time, shift_teams(name))
        )
      `)
      .eq('id', chat_id)
      .single()

    if (chatError || !chatData) {
      return new Response(
        JSON.stringify({ error: 'Chat not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user is part of this chat
    if (chatData.participant_1_id !== user.id && chatData.participant_2_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You are not a participant in this chat' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Save the message to database
    const { data: savedMessage, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: chat_id,
        sender_id: user.id,
        content: message_content,
        message_type: message_type
      })
      .select(`
        *,
        sender:profiles!sender_id(username, avatar_url)
      `)
      .single()

    if (messageError) {
      console.error('Error saving message:', messageError)
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Determine recipient
    const sender = chatData.participant_1_id === user.id ? chatData.participant_1 : chatData.participant_2
    const recipient = chatData.participant_1_id === user.id ? chatData.participant_2 : chatData.participant_1

    // Send push notification to recipient if they have FCM token
    let notificationSent = false
    if (recipient.fcm_token) {
      const shiftInfo = chatData.trade_request?.shifts
      const notificationTitle = `Nytt meddelande från ${sender.username}`
      const notificationBody = message_type === 'text' 
        ? message_content.length > 100 
          ? message_content.substring(0, 97) + '...'
          : message_content
        : `${sender.username} skickade ett specialmeddelande`

      const fcmMessage: FCMMessage = {
        to: recipient.fcm_token,
        notification: {
          title: notificationTitle,
          body: notificationBody,
          icon: 'ic_notification'
        },
        data: {
          type: 'chat_message',
          chat_id: chat_id,
          sender_id: user.id,
          sender_username: sender.username,
          message_type: message_type,
          shift_title: shiftInfo?.title || '',
          team_name: shiftInfo?.shift_teams?.name || ''
        }
      }

      notificationSent = await sendFCMNotification(fcmMessage)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: savedMessage,
        notification_sent: notificationSent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
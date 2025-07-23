import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FCMNotification {
  to: string
  notification: {
    title: string
    body: string
    sound?: string
  }
  data?: Record<string, string>
  priority?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse the request body (triggered by new message)
    const { record, old_record } = await req.json()

    if (!record) {
      return new Response(
        JSON.stringify({ error: 'No message record provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const messageId = record.id
    const chatId = record.chat_id
    const senderId = record.sender_id
    const content = record.content
    const messageType = record.message_type || 'text'

    // Get chat details
    const { data: chat, error: chatError } = await supabaseClient
      .from('private_chats')
      .select('user1_id, user2_id, shift_trade_request_id')
      .eq('id', chatId)
      .single()

    if (chatError || !chat) {
      console.error('Error fetching chat:', chatError)
      return new Response(
        JSON.stringify({ error: 'Chat not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine recipient (the other user in the chat)
    const recipientId = chat.user1_id === senderId ? chat.user2_id : chat.user1_id

    // Get recipient's profile for FCM token
    const { data: recipientProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name, fcm_token, preferences')
      .eq('id', recipientId)
      .single()

    if (profileError || !recipientProfile) {
      console.error('Error fetching recipient profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Recipient profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has notifications enabled
    const preferences = recipientProfile.preferences || {}
    if (preferences.notifications_enabled === false) {
      return new Response(
        JSON.stringify({ message: 'Notifications disabled for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get sender's profile for notification
    const { data: senderProfile } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single()

    // Get trade request details if this is a trade-related chat
    let tradeRequestDetails = null
    if (chat.shift_trade_request_id) {
      const { data: tradeRequest } = await supabaseClient
        .from('shift_trade_requests')
        .select(`
          id,
          status,
          message,
          shifts!shift_id(shift_type, start_time, end_time),
          requested_shifts!requested_shift_id(shift_type, start_time, end_time)
        `)
        .eq('id', chat.shift_trade_request_id)
        .single()

      if (tradeRequest) {
        tradeRequestDetails = {
          id: tradeRequest.id,
          status: tradeRequest.status,
          requester_message: tradeRequest.message,
          shifts: {
            requester: tradeRequest.shifts,
            requested: tradeRequest.requested_shifts
          }
        }
      }
    }

    // Prepare notification content
    const senderName = senderProfile?.full_name || 'En kollega'
    let notificationTitle = 'Nytt meddelande'
    let notificationBody = content

    // Customize notification based on message type and context
    if (messageType === 'shift_trade') {
      notificationTitle = 'Skiftbyte förfrågan'
      notificationBody = `${senderName} vill byta skift med dig`
    } else if (chat.shift_trade_request_id) {
      notificationTitle = 'Bytesförfrågan'
      notificationBody = `${senderName}: ${content}`
    } else {
      // Regular chat message
      if (content.length > 50) {
        notificationBody = `${senderName}: ${content.substring(0, 50)}...`
      } else {
        notificationBody = `${senderName}: ${content}`
      }
    }

    // Send FCM notification if token exists
    if (recipientProfile.fcm_token) {
      const fcmNotification: FCMNotification = {
        to: recipientProfile.fcm_token,
        notification: {
          title: notificationTitle,
          body: notificationBody,
          sound: 'default'
        },
        data: {
          chat_id: chatId,
          message_id: messageId,
          sender_id: senderId,
          sender_name: senderName,
          message_type: messageType,
          trade_request_id: chat.shift_trade_request_id || '',
          action: 'open_chat'
        },
        priority: 'high'
      }

      // Send to FCM
      const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fcmNotification)
      })

      if (!fcmResponse.ok) {
        console.error('FCM notification failed:', await fcmResponse.text())
      }
    }

    // Update online status for sender
    await supabaseClient
      .from('online_status')
      .upsert({
        user_id: senderId,
        is_online: true,
        last_seen: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent',
        recipient_id: recipientId,
        fcm_token_exists: !!recipientProfile.fcm_token,
        notification: {
          title: notificationTitle,
          body: notificationBody
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-chat-notification:', error)
    return new Response(
      JSON.stringify({ error: 'Ett internt fel uppstod' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 
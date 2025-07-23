import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FCMMessage {
  to: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
  };
  data?: {
    [key: string]: string;
  };
}

async function sendFCMNotification(fcmToken: string, title: string, body: string, data?: any) {
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
  
  if (!fcmServerKey) {
    console.error('FCM_SERVER_KEY not configured')
    return false
  }

  const message: FCMMessage = {
    to: fcmToken,
    notification: {
      title,
      body,
      icon: 'ic_notification'
    },
    data: data || {}
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    })

    const result = await response.json()
    
    if (response.ok && result.success === 1) {
      console.log('FCM notification sent successfully:', result)
      return true
    } else {
      console.error('FCM notification failed:', result)
      return false
    }
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

    // Get user from auth
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { chat_id, message_content } = await req.json()

    if (!chat_id || !message_content) {
      return new Response(
        JSON.stringify({ error: 'chat_id and message_content are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get chat information and verify user is participant
    const { data: chat, error: chatError } = await supabaseClient
      .from('private_chats')
      .select('participants')
      .eq('id', chat_id)
      .single()

    if (chatError || !chat) {
      return new Response(
        JSON.stringify({ error: 'Chat not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user is participant in the chat
    if (!chat.participants.includes(user.id)) {
      return new Response(
        JSON.stringify({ error: 'You are not a participant in this chat' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get sender's profile for notification
    const { data: senderProfile, error: senderError } = await supabaseClient
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    if (senderError || !senderProfile) {
      console.error('Could not fetch sender profile:', senderError)
    }

    const senderName = senderProfile?.username || 'Okänd användare'

    // Get FCM tokens for other participants (exclude sender)
    const otherParticipants = chat.participants.filter(id => id !== user.id)
    
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, username, fcm_token')
      .in('id', otherParticipants)

    if (profilesError) {
      console.error('Error fetching participant profiles:', profilesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch participant profiles' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send notifications to all participants with FCM tokens
    const notificationPromises = profiles
      ?.filter(profile => profile.fcm_token)
      .map(profile => {
        const title = `Nytt meddelande från ${senderName}`
        const body = message_content.length > 100 
          ? `${message_content.substring(0, 100)}...` 
          : message_content
        
        const data = {
          type: 'chat_message',
          chat_id: chat_id,
          sender_id: user.id,
          sender_name: senderName
        }

        return sendFCMNotification(profile.fcm_token, title, body, data)
      }) || []

    // Wait for all notifications to be sent
    const results = await Promise.allSettled(notificationPromises)
    
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length

    const failureCount = results.length - successCount

    return new Response(
      JSON.stringify({ 
        success: true,
        notifications_sent: successCount,
        notifications_failed: failureCount,
        total_recipients: profiles?.length || 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-chat-notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
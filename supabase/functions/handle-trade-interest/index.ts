import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { trade_request_id, message } = await req.json()

    if (!trade_request_id) {
      return new Response(
        JSON.stringify({ error: 'trade_request_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the trade request with requester info
    const { data: tradeRequest, error: tradeError } = await supabaseClient
      .from('shift_trade_requests')
      .select(`
        *,
        profiles!requester_id(id, username),
        shifts(
          *,
          shift_teams(name, color_hex)
        )
      `)
      .eq('id', trade_request_id)
      .eq('status', 'open')
      .single()

    if (tradeError || !tradeRequest) {
      return new Response(
        JSON.stringify({ error: 'Trade request not found or no longer available' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prevent users from showing interest in their own trade requests
    if (tradeRequest.requester_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'You cannot show interest in your own trade request' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if a private chat already exists for this trade request between these users
    const { data: existingChat } = await supabaseClient
      .from('private_chats')
      .select('id')
      .eq('trade_request_id', trade_request_id)
      .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${tradeRequest.requester_id}),and(participant_1_id.eq.${tradeRequest.requester_id},participant_2_id.eq.${user.id})`)
      .single()

    let chatId: string

    if (existingChat) {
      // Use existing chat
      chatId = existingChat.id
    } else {
      // Create new private chat
      const { data: newChat, error: chatError } = await supabaseClient
        .from('private_chats')
        .insert({
          trade_request_id: trade_request_id,
          participant_1_id: tradeRequest.requester_id,
          participant_2_id: user.id
        })
        .select('id')
        .single()

      if (chatError || !newChat) {
        console.error('Error creating chat:', chatError)
        return new Response(
          JSON.stringify({ error: 'Failed to create chat' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      chatId = newChat.id
    }

    // Send initial message if provided
    if (message && message.trim()) {
      const { error: messageError } = await supabaseClient
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: message.trim(),
          message_type: 'text'
        })

      if (messageError) {
        console.error('Error sending initial message:', messageError)
        // Don't fail the whole request if message fails
      }
    }

    // Get the chat with participant info
    const { data: chatData, error: chatDataError } = await supabaseClient
      .from('private_chats')
      .select(`
        *,
        trade_request:shift_trade_requests(
          *,
          shifts(
            *,
            shift_teams(name, color_hex)
          )
        ),
        participant_1:profiles!participant_1_id(id, username, avatar_url),
        participant_2:profiles!participant_2_id(id, username, avatar_url)
      `)
      .eq('id', chatId)
      .single()

    if (chatDataError || !chatData) {
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve chat data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        chat: chatData,
        message: existingChat ? 'Joined existing chat' : 'New chat created'
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
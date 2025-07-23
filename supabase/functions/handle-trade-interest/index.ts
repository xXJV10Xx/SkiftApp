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
    const { trade_request_id } = await req.json()

    if (!trade_request_id) {
      return new Response(
        JSON.stringify({ error: 'trade_request_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get trade request with shift owner information
    const { data: tradeRequest, error: tradeError } = await supabaseClient
      .from('shift_trade_requests')
      .select(`
        *,
        shifts!inner(owner_id)
      `)
      .eq('id', trade_request_id)
      .eq('status', 'pending')
      .single()

    if (tradeError || !tradeRequest) {
      return new Response(
        JSON.stringify({ error: 'Trade request not found or not pending' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify that the current user is the shift owner
    if (tradeRequest.shifts.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only the shift owner can show interest' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if a chat already exists for this trade request
    const { data: existingChat } = await supabaseClient
      .from('private_chats')
      .select('id')
      .eq('trade_request_id', trade_request_id)
      .single()

    if (existingChat) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          chat_id: existingChat.id,
          message: 'Chat already exists'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create private chat with both participants
    const participants = [user.id, tradeRequest.requesting_user_id]
    
    const { data: chat, error: chatError } = await supabaseClient
      .from('private_chats')
      .insert({
        trade_request_id,
        participants
      })
      .select()
      .single()

    if (chatError) {
      console.error('Error creating private chat:', chatError)
      return new Response(
        JSON.stringify({ error: 'Failed to create private chat' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send initial system message to the chat
    const { error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: chat.id,
        sender_id: user.id,
        content: 'Hej! Jag är intresserad av att diskutera skiftbytet. Låt oss prata!'
      })

    if (messageError) {
      console.error('Error sending initial message:', messageError)
      // Don't fail the entire request if message fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        chat_id: chat.id,
        participants,
        message: 'Private chat created successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in handle-trade-interest function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth header
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { trade_request_id, message } = await req.json()

    // Validate required fields
    if (!trade_request_id) {
      return new Response(
        JSON.stringify({ error: 'trade_request_id krävs' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get trade request details
    const { data: tradeRequest, error: tradeError } = await supabaseClient
      .from('shift_trade_requests')
      .select(`
        id,
        shift_id,
        requested_shift_id,
        requester_id,
        status,
        message,
        shifts!shift_id(user_id, shift_type, start_time, end_time),
        requested_shifts!requested_shift_id(user_id, shift_type, start_time, end_time)
      `)
      .eq('id', trade_request_id)
      .single()

    if (tradeError || !tradeRequest) {
      return new Response(
        JSON.stringify({ error: 'Bytesförfrågan hittades inte' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if trade request is still pending
    if (tradeRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Bytesförfrågan är inte längre aktiv' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine the other user in the trade
    const requesterId = tradeRequest.requester_id
    const shiftOwnerId = tradeRequest.shifts.user_id
    const requestedShiftOwnerId = tradeRequest.requested_shifts.user_id

    let otherUserId: string
    if (user.id === requesterId) {
      // User is the requester, other user is the shift owner
      otherUserId = shiftOwnerId
    } else if (user.id === shiftOwnerId) {
      // User is the shift owner, other user is the requester
      otherUserId = requesterId
    } else {
      return new Response(
        JSON.stringify({ error: 'Du är inte involverad i detta byte' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if chat already exists
    const { data: existingChat, error: chatError } = await supabaseClient
      .from('private_chats')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
      .eq('shift_trade_request_id', trade_request_id)
      .single()

    if (existingChat) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          chat_id: existingChat.id,
          message: 'Chatt finns redan',
          action: 'existing_chat'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create private chat
    const { data: newChat, error: createChatError } = await supabaseClient
      .from('private_chats')
      .insert({
        user1_id: user.id,
        user2_id: otherUserId,
        shift_trade_request_id: trade_request_id
      })
      .select()
      .single()

    if (createChatError) {
      console.error('Error creating chat:', createChatError)
      return new Response(
        JSON.stringify({ error: 'Kunde inte skapa chatt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add initial message if provided
    if (message) {
      const { error: messageError } = await supabaseClient
        .from('messages')
        .insert({
          chat_id: newChat.id,
          sender_id: user.id,
          content: message,
          message_type: 'text'
        })

      if (messageError) {
        console.error('Error creating initial message:', messageError)
        // Don't fail the entire request if message creation fails
      }
    }

    // Get user profiles for notification
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('full_name, fcm_token')
      .eq('id', user.id)
      .single()

    const { data: otherUserProfile } = await supabaseClient
      .from('profiles')
      .select('full_name, fcm_token')
      .eq('id', otherUserId)
      .single()

    // Get shift details for context
    const shiftDetails = {
      requester_shift: {
        type: tradeRequest.shifts.shift_type,
        start_time: tradeRequest.shifts.start_time,
        end_time: tradeRequest.shifts.end_time
      },
      requested_shift: {
        type: tradeRequest.requested_shifts.shift_type,
        start_time: tradeRequest.requested_shifts.start_time,
        end_time: tradeRequest.requested_shifts.end_time
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        chat_id: newChat.id,
        message: 'Chatt skapad för bytesförfrågan',
        action: 'new_chat',
        trade_request: {
          id: tradeRequest.id,
          status: tradeRequest.status,
          requester_message: tradeRequest.message
        },
        users: {
          requester: {
            id: requesterId,
            name: userProfile?.full_name || 'Okänd användare'
          },
          shift_owner: {
            id: shiftOwnerId,
            name: otherUserProfile?.full_name || 'Okänd användare'
          }
        },
        shift_details: shiftDetails
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in handle-trade-interest:', error)
    return new Response(
      JSON.stringify({ error: 'Ett internt fel uppstod' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 
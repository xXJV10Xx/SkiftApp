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
    const { shift_id, requested_shift_id, message } = await req.json()

    // Validate required fields
    if (!shift_id || !requested_shift_id) {
      return new Response(
        JSON.stringify({ error: 'shift_id och requested_shift_id krävs' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate that shifts exist and belong to different users
    const { data: shifts, error: shiftsError } = await supabaseClient
      .from('shifts')
      .select('id, user_id, shift_type, start_time, end_time')
      .in('id', [shift_id, requested_shift_id])

    if (shiftsError || shifts.length !== 2) {
      return new Response(
        JSON.stringify({ error: 'Ett eller båda skiften hittades inte' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const shift = shifts.find(s => s.id === shift_id)
    const requestedShift = shifts.find(s => s.id === requested_shift_id)

    if (!shift || !requestedShift) {
      return new Response(
        JSON.stringify({ error: 'Ogiltiga skift-ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate that user owns the requested shift
    if (requestedShift.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Du kan bara byta dina egna skift' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate that the other shift is not owned by the user
    if (shift.user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Du kan inte byta med ditt eget skift' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if shift is available for trade (not free day)
    if (shift.shift_type === 'L' || shift.shift_type === 'ledig') {
      return new Response(
        JSON.stringify({ error: 'Lediga dagar kan inte bytas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if there's already a pending request
    const { data: existingRequest, error: existingError } = await supabaseClient
      .from('shift_trade_requests')
      .select('id, status')
      .eq('shift_id', shift_id)
      .eq('requested_shift_id', requested_shift_id)
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return new Response(
        JSON.stringify({ error: 'En förfrågan för detta byte finns redan' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create trade request
    const { data: tradeRequest, error: insertError } = await supabaseClient
      .from('shift_trade_requests')
      .insert({
        shift_id,
        requested_shift_id,
        requester_id: user.id,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating trade request:', insertError)
      return new Response(
        JSON.stringify({ error: 'Kunde inte skapa bytesförfrågan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user information for notification
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('full_name, fcm_token')
      .eq('id', user.id)
      .single()

    // Get shift owner information
    const { data: shiftOwner } = await supabaseClient
      .from('profiles')
      .select('full_name, fcm_token')
      .eq('id', shift.user_id)
      .single()

    return new Response(
      JSON.stringify({
        success: true,
        trade_request: tradeRequest,
        message: 'Bytesförfrågan skapad',
        requester_name: userProfile?.full_name || 'Okänd användare',
        shift_owner_name: shiftOwner?.full_name || 'Okänd användare',
        shift_details: {
          shift_type: shift.shift_type,
          start_time: shift.start_time,
          end_time: shift.end_time
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-trade-request:', error)
    return new Response(
      JSON.stringify({ error: 'Ett internt fel uppstod' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 
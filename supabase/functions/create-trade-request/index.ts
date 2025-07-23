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
    const { shift_id, reason } = await req.json()

    if (!shift_id) {
      return new Response(
        JSON.stringify({ error: 'shift_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify that the shift exists and user is part of the same team
    const { data: shiftData, error: shiftError } = await supabaseClient
      .from('shifts')
      .select(`
        *,
        shift_teams!inner(*)
      `)
      .eq('id', shift_id)
      .single()

    if (shiftError || !shiftData) {
      return new Response(
        JSON.stringify({ error: 'Shift not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's profile to check team membership
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('shift_team_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.shift_team_id !== shiftData.shift_team_id) {
      return new Response(
        JSON.stringify({ error: 'You can only create trade requests for shifts in your team' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if there's already an open trade request for this shift by this user
    const { data: existingRequest } = await supabaseClient
      .from('shift_trade_requests')
      .select('id')
      .eq('shift_id', shift_id)
      .eq('requester_id', user.id)
      .eq('status', 'open')
      .single()

    if (existingRequest) {
      return new Response(
        JSON.stringify({ error: 'You already have an open trade request for this shift' }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the trade request
    const { data: tradeRequest, error: tradeError } = await supabaseClient
      .from('shift_trade_requests')
      .insert({
        requester_id: user.id,
        shift_id: shift_id,
        reason: reason || null,
        status: 'open'
      })
      .select(`
        *,
        profiles!requester_id(username, avatar_url),
        shifts(
          *,
          shift_teams(name, color_hex)
        )
      `)
      .single()

    if (tradeError) {
      console.error('Error creating trade request:', tradeError)
      return new Response(
        JSON.stringify({ error: 'Failed to create trade request' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        trade_request: tradeRequest 
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
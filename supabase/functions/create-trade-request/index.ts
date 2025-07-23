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
    const { shift_id, message } = await req.json()

    if (!shift_id) {
      return new Response(
        JSON.stringify({ error: 'shift_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify that the shift exists and user is not the owner
    const { data: shift, error: shiftError } = await supabaseClient
      .from('shifts')
      .select('owner_id')
      .eq('id', shift_id)
      .single()

    if (shiftError || !shift) {
      return new Response(
        JSON.stringify({ error: 'Shift not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (shift.owner_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot request your own shift' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user already has a pending request for this shift
    const { data: existingRequest } = await supabaseClient
      .from('shift_trade_requests')
      .select('id')
      .eq('shift_id', shift_id)
      .eq('requesting_user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return new Response(
        JSON.stringify({ error: 'You already have a pending request for this shift' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create trade request
    const { data: tradeRequest, error: insertError } = await supabaseClient
      .from('shift_trade_requests')
      .insert({
        shift_id,
        requesting_user_id: user.id,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating trade request:', insertError)
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
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-trade-request function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
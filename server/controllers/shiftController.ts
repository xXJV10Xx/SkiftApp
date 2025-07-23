import { Context } from "oak";
import { supabase, supabaseAdmin } from "../config/database.ts";
import { AuthContext } from "../middleware/auth.ts";

export class ShiftController {
  // GET /api/schedule/:userId - Hämta användarens schema
  static async getUserSchedule(ctx: AuthContext) {
    try {
      const userId = ctx.params.userId;
      
      if (!userId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "User ID is required" };
        return;
      }

      // Kontrollera att användaren har behörighet att se detta schema
      if (ctx.state.user?.id !== userId) {
        // Kontrollera om användaren är i samma team
        const { data: teamCheck } = await supabase
          .from("employees")
          .select("team_id")
          .eq("id", ctx.state.user?.id)
          .single();

        const { data: targetTeamCheck } = await supabase
          .from("employees")
          .select("team_id")
          .eq("id", userId)
          .single();

        if (!teamCheck || !targetTeamCheck || teamCheck.team_id !== targetTeamCheck.team_id) {
          ctx.response.status = 403;
          ctx.response.body = { error: "Access denied" };
          return;
        }
      }

      // Hämta användarens skift
      const { data: shifts, error } = await supabase
        .from("shifts")
        .select(`
          *,
          employees:owner_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("owner_id", userId)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching user schedule:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to fetch schedule" };
        return;
      }

      ctx.response.body = {
        success: true,
        data: shifts
      };
    } catch (error) {
      console.error("getUserSchedule error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  // POST /api/shifts/trade - Skapa skiftbyte-förfrågan
  static async createTradeRequest(ctx: AuthContext) {
    try {
      const body = await ctx.request.body().value;
      const { shiftId, message } = body;

      if (!shiftId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Shift ID is required" };
        return;
      }

      // Kontrollera att skiftet tillhör användaren
      const { data: shift, error: shiftError } = await supabase
        .from("shifts")
        .select("*")
        .eq("id", shiftId)
        .eq("owner_id", ctx.state.user?.id)
        .single();

      if (shiftError || !shift) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Shift not found or access denied" };
        return;
      }

      // Skapa trade request
      const { data: tradeRequest, error } = await supabase
        .from("shift_trade_requests")
        .insert({
          shift_id: shiftId,
          requesting_user_id: ctx.state.user!.id,
          message: message || null,
          status: "open"
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating trade request:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to create trade request" };
        return;
      }

      // Uppdatera skiftets status
      await supabase
        .from("shifts")
        .update({ status: "pending_trade" })
        .eq("id", shiftId);

      // TODO: Skicka notifikation till teamchatten
      await ShiftController.notifyTeamAboutTradeRequest(tradeRequest, shift);

      ctx.response.body = {
        success: true,
        data: tradeRequest
      };
    } catch (error) {
      console.error("createTradeRequest error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  // POST /api/shifts/trade/interested - Visa intresse för skiftbyte
  static async showInterest(ctx: AuthContext) {
    try {
      const body = await ctx.request.body().value;
      const { tradeRequestId } = body;

      if (!tradeRequestId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Trade request ID is required" };
        return;
      }

      // Hämta trade request info
      const { data: tradeRequest, error: tradeError } = await supabase
        .from("shift_trade_requests")
        .select(`
          *,
          shifts (
            *,
            employees:owner_id (
              id,
              first_name,
              last_name
            )
          )
        `)
        .eq("id", tradeRequestId)
        .eq("status", "open")
        .single();

      if (tradeError || !tradeRequest) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Trade request not found or already closed" };
        return;
      }

      // Kontrollera att användaren inte försöker visa intresse för sitt eget skift
      if (tradeRequest.requesting_user_id === ctx.state.user?.id) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Cannot show interest in your own shift" };
        return;
      }

      // Skapa privat chatt
      const { data: privateChat, error: chatError } = await supabase
        .from("private_chats")
        .insert({
          participant_ids: [tradeRequest.requesting_user_id, ctx.state.user!.id],
          related_trade_request_id: tradeRequestId
        })
        .select()
        .single();

      if (chatError) {
        console.error("Error creating private chat:", chatError);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to create private chat" };
        return;
      }

      // Skicka systemmeddelande i chatten
      await supabase
        .from("private_chat_messages")
        .insert({
          private_chat_id: privateChat.id,
          sender_id: ctx.state.user!.id,
          content: `Jag är intresserad av att byta skift: ${new Date(tradeRequest.shifts.start_time).toLocaleString("sv-SE")} - ${new Date(tradeRequest.shifts.end_time).toLocaleString("sv-SE")}`,
          message_type: "system"
        });

      ctx.response.body = {
        success: true,
        data: {
          privateChatId: privateChat.id,
          message: "Private chat created successfully"
        }
      };
    } catch (error) {
      console.error("showInterest error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  // PUT /api/shifts/:shiftId/assign - Tilldela skift till ny ägare
  static async assignShift(ctx: AuthContext) {
    try {
      const shiftId = ctx.params.shiftId;
      const body = await ctx.request.body().value;
      const { newOwnerId } = body;

      if (!shiftId || !newOwnerId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Shift ID and new owner ID are required" };
        return;
      }

      // Hämta skift och kontrollera behörighet
      const { data: shift, error: shiftError } = await supabase
        .from("shifts")
        .select("*, shift_trade_requests(*)")
        .eq("id", shiftId)
        .single();

      if (shiftError || !shift) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Shift not found" };
        return;
      }

      // Kontrollera att användaren är antingen ägaren eller den som visat intresse
      const hasPermission = shift.owner_id === ctx.state.user?.id || 
        shift.shift_trade_requests.some((req: any) => 
          req.requesting_user_id === ctx.state.user?.id
        );

      if (!hasPermission) {
        ctx.response.status = 403;
        ctx.response.body = { error: "Access denied" };
        return;
      }

      // Uppdatera skiftets ägare
      const { error: updateError } = await supabase
        .from("shifts")
        .update({
          owner_id: newOwnerId,
          status: "confirmed"
        })
        .eq("id", shiftId);

      if (updateError) {
        console.error("Error updating shift owner:", updateError);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to assign shift" };
        return;
      }

      // Stäng alla relaterade trade requests
      await supabase
        .from("shift_trade_requests")
        .update({ status: "completed" })
        .eq("shift_id", shiftId);

      ctx.response.body = {
        success: true,
        message: "Shift assigned successfully"
      };
    } catch (error) {
      console.error("assignShift error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  // Hjälpfunktion för att notifiera team om trade request
  private static async notifyTeamAboutTradeRequest(tradeRequest: any, shift: any) {
    try {
      // TODO: Implementera notifikation till teamchatt
      // Detta kan göras genom att skicka ett meddelande till teamets chatrum
      console.log(`Trade request created for shift ${shift.id} by user ${tradeRequest.requesting_user_id}`);
    } catch (error) {
      console.error("Error notifying team:", error);
    }
  }

  // GET /api/shifts/trade-requests - Hämta alla öppna trade requests för användarens team
  static async getTeamTradeRequests(ctx: AuthContext) {
    try {
      // Hämta användarens team
      const { data: employee } = await supabase
        .from("employees")
        .select("team_id")
        .eq("id", ctx.state.user?.id)
        .single();

      if (!employee?.team_id) {
        ctx.response.body = { success: true, data: [] };
        return;
      }

      // Hämta alla öppna trade requests för teamet
      const { data: tradeRequests, error } = await supabase
        .from("shift_trade_requests")
        .select(`
          *,
          shifts (
            *,
            employees:owner_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq("status", "open")
        .eq("shifts.team_id", employee.team_id);

      if (error) {
        console.error("Error fetching trade requests:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to fetch trade requests" };
        return;
      }

      ctx.response.body = {
        success: true,
        data: tradeRequests
      };
    } catch (error) {
      console.error("getTeamTradeRequests error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }
}
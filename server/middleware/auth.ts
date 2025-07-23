import { Context, Next } from "oak";
import { supabase } from "../config/database.ts";

export interface AuthContext extends Context {
  state: {
    user?: {
      id: string;
      email: string;
    };
  };
}

export async function authMiddleware(ctx: AuthContext, next: Next) {
  try {
    const authHeader = ctx.request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Missing or invalid authorization header" };
      return;
    }

    const token = authHeader.substring(7); // Ta bort "Bearer "
    
    // Verifiera token med Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid token" };
      return;
    }

    // Lägg till användarinfo i context
    ctx.state.user = {
      id: user.id,
      email: user.email || "",
    };

    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
}

export function requireAuth() {
  return authMiddleware;
}
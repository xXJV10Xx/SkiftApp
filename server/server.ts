import { Application } from "oak";
import { oakCors } from "cors";
import shiftRoutes from "./routes/shiftRoutes.ts";

const app = new Application();
const port = parseInt(Deno.env.get("PORT") || "8000");

// Middleware
app.use(oakCors({
  origin: ["http://localhost:8081", "exp://localhost:8081", /^https:\/\/.*\.exp\.direct$/],
  credentials: true,
}));

// Logga alla requests
app.use(async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url.pathname}`);
  await next();
});

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("Server error:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Routes
app.use(shiftRoutes.routes());
app.use(shiftRoutes.allowedMethods());

// Health check endpoint
app.use(async (ctx, next) => {
  if (ctx.request.url.pathname === "/health") {
    ctx.response.body = { 
      status: "ok", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    };
    return;
  }
  await next();
});

// 404 handler
app.use((ctx) => {
  ctx.response.status = 404;
  ctx.response.body = { error: "Not found" };
});

// Start server
console.log(`🚀 Server starting on port ${port}`);
console.log(`📱 Health check: http://localhost:${port}/health`);
console.log(`🔗 API Base URL: http://localhost:${port}/api`);

await app.listen({ port });
import { authMiddleware } from "better-convex/auth/http";
import { HttpRouterWithHono } from "better-convex/server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { getAuth } from "./generated/auth";

const app = new Hono();

// CORS for API routes
app.use(
  "/api/*",
  cors({
    origin: process.env.SITE_URL || "http://localhost:3000",
    allowHeaders: ["Content-Type", "Authorization", "Better-Auth-Cookie"],
    exposeHeaders: ["Set-Better-Auth-Cookie"],
    credentials: true,
  }),
);

// Better Auth middleware
app.use(authMiddleware(getAuth));

export default new HttpRouterWithHono(app);

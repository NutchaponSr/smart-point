import type { AuthConfig } from "convex/server";
import { getAuthConfigProvider } from "better-convex/auth/config";

export default {
  providers: [getAuthConfigProvider()]
} satisfies AuthConfig;
import type { Auth } from "@convex/auth-shared";
import {
  customSessionClient,
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { convexClient } from "better-convex/auth/client";
import { createAuthMutations } from "better-convex/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  plugins: [
    inferAdditionalFields<Auth>(),
    customSessionClient<Auth>(),
    convexClient(),
    usernameClient(),
  ],
});

export const {
  useSignInMutationOptions,
  useSignUpMutationOptions,
  useSignInSocialMutationOptions,
  useSignOutMutationOptions,
} = createAuthMutations(authClient);

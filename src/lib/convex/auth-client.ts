import { createAuthClient } from "better-auth/react";
import { convexClient } from "better-convex/auth/client";
import { createAuthMutations } from "better-convex/react";
import { inferAdditionalFields, organizationClient } from "better-auth/client/plugins";

import type { Auth } from "@convex/auth-shared";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL!,
  plugins: [
    inferAdditionalFields<Auth>(), 
    convexClient(),
    organizationClient(),
  ],
});

export const {
  useSignInMutationOptions,
  useSignUpMutationOptions,
  useSignInSocialMutationOptions,
  useSignOutMutationOptions
} = createAuthMutations(authClient);
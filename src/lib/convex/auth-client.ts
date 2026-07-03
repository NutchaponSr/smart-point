import { createAuthClient } from "better-auth/react";
import { convexClient } from "better-convex/auth/client";
import { createAuthMutations } from "better-convex/react";
import {
  customSessionClient,
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";

import type { Auth } from "@convex/auth-shared";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL!,
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
  useSignOutMutationOptions
} = createAuthMutations(authClient);
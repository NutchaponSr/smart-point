import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";

import { username } from "better-auth/plugins";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { createClient, GenericCtx } from "@convex-dev/better-auth";

import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { v } from "convex/values";

const siteUrl = process.env.SITE_URL!;

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
    verbose: false,
  },
);

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 5,
    },
    plugins: [
      convex({ authConfig }),
      username(),
    ],
  } satisfies BetterAuthOptions;
}

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  }
})

const serializeUserForConvex = (user: any) => {
  if (!user) return user;

  return {
    ...user,
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.getTime()
        : user.createdAt,
    updatedAt:
      user.updatedAt instanceof Date
        ? user.updatedAt.getTime()
        : user.updatedAt,
  };
};

export const signUp = mutation({
  args: {},
  handler: async (ctx, args) => {
    const result = await createAuth(ctx).api.signUpEmail({
      body: {
        name: "Nutchapon",
        email: "example@somboon.co.th",
        password: "12345",
        username: "12613",
      },
    });

    return {
      ...result,
      user: serializeUserForConvex(result.user),
    };
  }
});
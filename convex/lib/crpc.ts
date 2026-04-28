import { CRPCError } from "better-convex/server";
import { initCRPC } from "../functions/generated/server";
import { getSessionUser } from "./auth-helper";
import { getAuth } from "../functions/generated/auth";
import { getHeaders } from "better-convex/auth";
import { createUserCaller } from "../functions/generated/user.runtime";

const c = initCRPC
  .meta<{
    auth?: "optional" | "required";
    ratelimit?: string;
    dev?: boolean;
  }>()
  .create();

export const publicQuery = c.query;
export const publicMutation = c.mutation;

export const privateMutation = c.mutation.internal();
export const privateAction = c.action.internal();

function requireAuth<T>(user: T | null): T {
  if (!user) {
    throw new CRPCError({
      code: "UNAUTHORIZED",
      message: "Not Unauthorized",
    });
  }
  return user;
}

export const authQuery = c.query
  .meta({ auth: "required" })
  .use(async ({ ctx, next }) => {
    const user = requireAuth(await getSessionUser(ctx));

    return next({
      ctx: {
        ...ctx,
        auth: {
          ...ctx.auth,
          ...getAuth(ctx),
          headers: await getHeaders(ctx, user.session),
        },
        user,
        userId: user.id,
      }
    })
  })

export const authMutation = c.mutation
  .meta({ auth: "required" })
  .use(async ({ ctx, next }) => {
    const user = requireAuth(await getSessionUser(ctx));

    return next({
      ctx: {
        ...ctx,
        auth: {
          ...ctx.auth,
          ...getAuth(ctx),
          headers: await getHeaders(ctx, user.session),
        },
        user,
        userId: user.id,
      },
    });
  });

/** No login required; still merges `getAuth(ctx)` and session headers when present. */
export const optionalAuthQuery = c.query
  .meta({ auth: "optional" })
  .use(async ({ ctx, next }) => {
    const user = await getSessionUser(ctx);

    return next({
      ctx: {
        ...ctx,
        auth: {
          ...ctx.auth,
          ...getAuth(ctx),
          headers: await getHeaders(ctx, user?.session ?? null),
        },
        user,
        userId: user?.id,
      },
    });
  });

export const optionalAuthMutation = c.mutation
  .meta({ auth: "optional" })
  .use(async ({ ctx, next }) => {
    const user = await getSessionUser(ctx);

    return next({
      ctx: {
        ...ctx,
        auth: {
          ...ctx.auth,
          ...getAuth(ctx),
          headers: await getHeaders(ctx, user?.session ?? null),
        },
        user,
        userId: user?.id,
      },
    });
  });

/** Actions have no `db`/ORM; merge `getAuth(ctx)` and empty headers for unauthenticated `ctx.auth.api` (avoids `setTimeout` inside mutations). */
export const optionalAuthAction = c.action
  .meta({ auth: "optional" })
  .use(async ({ ctx, next }) => {
    return next({
      ctx: {
        ...ctx,
        auth: {
          ...ctx.auth,
          ...getAuth(ctx),
          headers: new Headers(),
        },
      },
    });
  });

/** Internal action that still needs auth helpers on `ctx.auth.api`. */
export const privateAuthAction = c.action
  .internal()
  .use(async ({ ctx, next }) => {
    return next({
      ctx: {
        ...ctx,
        auth: {
          ...ctx.auth,
          ...getAuth(ctx),
          headers: new Headers(),
        },
      },
    });
  });

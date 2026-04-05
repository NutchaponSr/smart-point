import { authQuery } from "../lib/crpc";

export const getCurrentUser = authQuery
  .query(async ({ ctx }) => {

    return {
      id: ctx.userId,
      name: ctx.user.name,
      email: ctx.user.email,
      image: ctx.user.image,
    }
  })
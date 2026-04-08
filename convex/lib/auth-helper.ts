import { SessionUser } from "../shared/auth-shared";
import type { QueryCtx } from "../functions/generated/server";
import { getSession } from "better-convex/auth";
import { Id } from "../functions/_generated/dataModel";

export const getSessionData = async (ctx: QueryCtx) => {
  const session = await getSession(ctx);

  if (!session) return null;

  const user = await ctx.orm.query.user.findFirst({
    where: {
      id: session.userId,
    },
  });

  if (!user) return null;

  const employee = await ctx.orm.query.employee.findFirst({
    where: {
      id: user.employeeId,
    },
  });

  if (!employee) return null;


  return {
    session,
    user,
    employee,
  };
}

export const getSessionUser = async (ctx: QueryCtx): Promise<SessionUser | null> => {
  const data = await getSessionData(ctx);

  if (!data) return null;

  const {
    user,
    session,
    employee,
  } = data;

  return {
    ...user,
    employee,
    session,
  };
}
import { authQuery } from "../lib/crpc";
import { coerceLocalized } from "../lib/localized";
import { canSendUnlimitedPoints } from "../lib/point-send-privileges";
import type { Id } from "./_generated/dataModel";

export const getCurrentUser = authQuery.query(async ({ ctx }) => {
  return {
    id: ctx.userId,
    employeeId: ctx.user.employee.id as Id<"employee">,
    name: coerceLocalized(ctx.user.employee.name),
    email: ctx.user.email,
    image: ctx.user.image,
    department: ctx.user.employee.department,
    canSendUnlimitedPoints: canSendUnlimitedPoints(
      ctx.user.employee.employeeId,
    ),
  };
});

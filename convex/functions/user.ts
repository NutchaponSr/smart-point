import { authQuery } from "../lib/crpc";
import { coerceLocalized } from "../lib/localized";
import { canSendUnlimitedPoints } from "../lib/point-send-privileges";

export const getCurrentUser = authQuery
  .query(async ({ ctx }) => {
    return {
      id: ctx.userId,
      name: coerceLocalized(ctx.user.employee.name),
      email: ctx.user.email,
      image: ctx.user.image,
      department: ctx.user.employee.department,
      canSendUnlimitedPoints: canSendUnlimitedPoints(
        ctx.user.employee.employeeId,
      ),
    };
  });

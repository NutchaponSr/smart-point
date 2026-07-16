import { authQuery } from "../lib/crpc";
import { canSendUnlimitedPoints } from "../lib/point-send-privileges";

export const getCurrentUser = authQuery
  .query(async ({ ctx }) => {
    return {
      id: ctx.userId,
      name: ctx.user.name,
      email: ctx.user.email,
      image: ctx.user.image,
      department: ctx.user.employee.department,
      canSendUnlimitedPoints: canSendUnlimitedPoints(
        ctx.user.employee.employeeId,
      ),
    };
  });
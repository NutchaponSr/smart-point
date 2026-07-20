import bcrypt from "bcryptjs";
import authConfig from "./auth.config";

import { convex } from "better-convex/auth";
import { username } from "better-auth/plugins";

import { isAllowedAvatarPath } from "../shared/avatars";
import { defineAuth } from "./generated/auth";

const normalizeEmail = (email: string) => {
  if (email === "example@somboon.co.th") return undefined;

  return email;
}

const assertAllowedAvatar = (image: string | null | undefined) => {
  if (image === undefined || image === null) return;
  if (!isAllowedAvatarPath(image)) {
    throw new Error("Invalid avatar");
  }
};

export default defineAuth((ctx) => {
  return {
    baseURL: process.env.SITE_URL!,
    trustedOrigins: [process.env.SITE_URL || "http://localhost:3000"],
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24 * 15,
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      requireEmailVerification: false,
      minPasswordLength: 5,
      maxPasswordLength: 20,
      password: {
        hash: async (password) => {
          const salt = await bcrypt.genSalt(12);

          return await bcrypt.hash(password, salt);
        },
        verify: async ({ password, hash }) => {
          return await bcrypt.compare(password, hash);
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            assertAllowedAvatar(user.image);
            return {
              data: {
                ...user,
                email: normalizeEmail(user.email),
              },
            };
          },
        },
        update: {
          before: async (user) => {
            assertAllowedAvatar(user.image);
            return { data: user };
          },
        },
      },
    },
    user: {
      additionalFields: {
        employeeId: {
          type: "string",
          required: true,
        },
        role: {
          type: "string",
          required: true,
        }
      },
    },
    plugins: [
      convex({ authConfig }),
      username({
        minUsernameLength: 1,
      }),
    ],
  }
});
import bcrypt from "bcryptjs";
import authConfig from "./auth.config";

import { convex } from "better-convex/auth";

import { defineAuth } from "./generated/auth";

export default defineAuth((ctx) => {
  return {
    baseURL: process.env.SITE_URL!,
    trustedOrigins: [process.env.SITE_URL || "http://localhost:3000"],
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24 * 15,
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
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
    plugins: [
      convex({ authConfig })
    ]
  }
})
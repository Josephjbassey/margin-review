import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

const isDbAvailable = Boolean(process.env.DATABASE_URL);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "margin-clocked-challenge-secret-key-32chars",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ...(isDbAvailable
    ? {
        database: drizzleAdapter(db, {
          provider: "pg",
          schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
          },
        }),
      }
    : {}),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "lecturer",
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

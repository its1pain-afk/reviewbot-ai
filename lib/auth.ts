// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/business.manage",
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account && account.provider === "google" && user.id) {
        const googleTokens = JSON.stringify({
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expiry_date: account.expires_at ? account.expires_at * 1000 : null,
        });

        // Save tokens - retry a few times since PrismaAdapter may still be creating the user
        let saved = false;
        for (let attempt = 0; attempt < 5 && !saved; attempt++) {
          try {
            if (attempt > 0) {
              await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
            }
            await prisma.user.update({
              where: { id: user.id },
              data: { googleTokens },
            });
            saved = true;
          } catch (e) {
            // User may not exist yet, retry
          }
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "database",
  },
};

import { NextAuthConfig } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import NextAuth from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const config: NextAuthConfig = {
    secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!, // 修正
      clientSecret: process.env.GITHUB_CLIENT_SECRET!, // 修正
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!, // 修正
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // 修正
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        const providerAccountId = account.providerAccountId;
        const existingUser = await prisma.user.findUnique({
          where: { user_id: providerAccountId },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              user_id: providerAccountId,
              nickname: user.name || "",
              profile_image: user.image || "",
            },
          });
        } else {
          await prisma.user.update({
            where: { user_id: providerAccountId },
            data: {
              nickname: user.name || "",
              profile_image: user.image || "",
            },
          });
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.sub!,
      };
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);

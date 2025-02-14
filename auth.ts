// auth.ts
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
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // JWT セッション戦略を利用
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account) {
        console.error("signIn callback: account is null");
        return false;
      }
      const providerAccountId = account.providerAccountId;
      try {
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
    // JWT コールバックを明示的に実装
    async jwt({ token, user }) {
      token = token || {};
      if (user) {
        // user.id が存在しない場合、user.email を代替として利用（必要に応じて調整してください）
        token.sub = user.id ? user.id.toString() : user.email || token.sub || "";
        token.name = user.name || "";
        token.email = user.email || "";
        token.picture = user.image || "";
      }
      return token;
    },
    async session({ session, token }) {
        session.user = {
          ...session.user,
          id: token.sub ?? "",
          name: token.name ?? "",
          email: token.email ?? "",
          image: token.picture ?? "",
        };
        return session;
      },
    async redirect({ baseUrl }: { url: string; baseUrl: string }): Promise<string> {
      return baseUrl;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);

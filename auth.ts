// auth.ts
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

// NEXTAUTH_URL 環境変数からドメイン部分を抽出（例："https://with-hook.vercel.app" → "with-hook.vercel.app"）
const prodDomain =
  process.env.NODE_ENV === "production" && process.env.NEXTAUTH_URL
    ? process.env.NEXTAUTH_URL.replace(/^https?:\/\//, "")
    : undefined;

const prisma = new PrismaClient();

export const { auth, handlers, signIn, signOut } = NextAuth({
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
  session: {
    strategy: "jwt",
  },
  // Cookie 設定において、production なら domain を prodDomain に設定
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: prodDomain,
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.csrf-token"
          : "authjs.csrf-token",
      options: {
        // CSRF トークンはクライアントから参照できる必要があるので httpOnly: false
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: prodDomain,
      },
    },
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
          where: { providerAccountId },
        });
        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              providerAccountId,
              nickname: user.name || "",
              profile_image: user.image || "",
            },
          });
          user.id = newUser.user_id;
        } else {
          await prisma.user.update({
            where: { providerAccountId },
            data: {
              nickname: user.name || "",
              profile_image: user.image || "",
            },
          });
          user.id = existingUser.user_id;
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id ? user.id.toString() : token.sub;
        token.name = user.name || "";
        token.email = user.email || "";
        token.picture = user.image || "";
      }
      if (account && account.providerAccountId) {
        token.sub = account.providerAccountId;
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
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },
});

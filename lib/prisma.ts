// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// PrismaClientのオプション
const prismaClientOptions = {
  log: process.env.NODE_ENV === "development" 
    ? ["query", "error", "warn"] 
    : ["error"],
    
  // 開発環境では接続タイムアウトを設定
  ...(process.env.NODE_ENV === "development" && {
    // 接続タイムアウトの設定
    connectionTimeout: 10000, // 10秒
  })
};

// グローバルインスタンスの型定義
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 既存のインスタンスがあれば再利用、なければ新規作成
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(prismaClientOptions);

// 開発環境でのみグローバルに保存（Hot Reloadingの問題を回避）
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
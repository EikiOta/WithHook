import { auth } from "@/auth";
import ManageTabs from "./ManageTabs";
import { PrismaClient } from "@prisma/client";

/**
 * 「意味・記憶hook管理」ページ
 * ログイン中のユーザが登録した「意味」「記憶hook」を、各レコードに join した英単語情報とともに取得して一覧表示する
 */
const prisma = new PrismaClient();

export default async function ManagePage() {
  // ユーザー認証
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return <p>エラー：ユーザー情報を取得できません。ログインしてください。</p>;
  }
  const userId = session.user.id;

  // ログイン中ユーザが登録した「意味」一覧を取得 (wordも join)
  const userMeanings = await prisma.meaning.findMany({
    where: {
      user_id: userId,
      is_deleted: false,
    },
    orderBy: { meaning_id: "asc" },
    include: {
      word: true,
    },
  });

  // ログイン中ユーザが登録した「記憶hook」一覧を取得 (wordも join)
  const userMemoryHooks = await prisma.memoryHook.findMany({
    where: {
      user_id: userId,
      is_deleted: false,
    },
    orderBy: { memory_hook_id: "asc" },
    include: {
      word: true,
    },
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">登録した意味・記憶hook</h1>
      <ManageTabs
        initialMeanings={userMeanings}
        initialMemoryHooks={userMemoryHooks}
      />
    </div>
  );
}

// words/[word]/page.tsx
import {PrismaClient } from "@prisma/client";
import type { Meaning, MemoryHook } from "@prisma/client";
import WordDetailTabs from "./WordDetailTabs";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ word: string }>;
}) {
  // ユーザー認証
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return <p>エラー：ユーザー情報を取得できません。ログインしてください。</p>;
  }
  const userId = session.user.id;

  // ユーザー存在を保証（存在しなければ作成）
  let userRec = await prisma.user.findUnique({ where: { user_id: userId } });
  if (!userRec) {
    userRec = await prisma.user.create({
      data: {
        user_id: userId,
        nickname: session.user.name || "",
        profile_image: session.user.image || "",
      },
    });
  }

  const { word: wordParam } = await params;

  // SSR時は単語レコードを検索（存在しなければ null）
  const wordRecord = await prisma.word.findUnique({
    where: { word: wordParam },
  });

  let meanings: Meaning[] = [];
  let memoryHooks: MemoryHook[] = [];

  if (wordRecord) {
    meanings = await prisma.meaning.findMany({
      where: {
        word_id: wordRecord.word_id,
        deleted_at: null, // 削除されていないもの
        OR: [{ user_id: userId }, { is_public: true }],
      },
      include: { user: true },
      orderBy: { meaning_id: "asc" },
    });

    memoryHooks = await prisma.memoryHook.findMany({
      where: {
        word_id: wordRecord.word_id,
        deleted_at: null, // 削除されていないもの
        OR: [{ user_id: userId }, { is_public: true }],
      },
      include: { user: true },
      orderBy: { memory_hook_id: "asc" },
    });
  }

  // My単語帳(user_words)への登録済みレコードを取得（あれば）
  let myWordRecord = null;
  if (wordRecord) {
    myWordRecord = await prisma.userWord.findFirst({
      where: {
        user_id: userId,
        word_id: wordRecord.word_id,
        deleted_at: null, // 削除されていないもの
      },
    });
  }

  // 初期選択値は、user情報を持つ型にキャストして渡す
  const initialSelectedMeaning =
    myWordRecord && meanings.length > 0
      ? (meanings.find((m) => m.meaning_id === myWordRecord.meaning_id) as Meaning & {
          user: { profile_image: string | null; nickname: string | null };
        }) || (meanings[0] as Meaning & { user: { profile_image: string | null; nickname: string | null } })
      : meanings.length > 0
      ? (meanings[0] as Meaning & { user: { profile_image: string | null; nickname: string | null } })
      : null;

  const initialSelectedMemoryHook =
    myWordRecord && myWordRecord.memory_hook_id && memoryHooks.length > 0
      ? (memoryHooks.find((h) => h.memory_hook_id === myWordRecord.memory_hook_id) as MemoryHook & {
          user: { profile_image: string | null; nickname: string | null };
        }) || null
      : null;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">単語詳細ページ</h1>
      <WordDetailTabs
        wordParam={wordParam}
        initialMeanings={
          meanings as (Meaning & { user: { profile_image: string | null; nickname: string | null } })[]
        }
        initialMemoryHooks={
          memoryHooks as (MemoryHook & { user: { profile_image: string | null; nickname: string | null } })[]
        }
        isMyWordSaved={Boolean(myWordRecord)}
        initialSelectedMeaning={initialSelectedMeaning}
        initialSelectedMemoryHook={initialSelectedMemoryHook}
        userId={userId}
      />
      {!wordRecord && <p>「{wordParam}」はまだ登録されていません。</p>}
    </div>
  );
}
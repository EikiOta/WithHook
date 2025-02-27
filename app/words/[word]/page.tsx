// words/[word]/page.tsx
import { Prisma, PrismaClient } from "@prisma/client";
import type { Meaning, MemoryHook, Word, UserWord } from "@prisma/client";
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
  let myWordRecord: UserWord | null = null;
  if (wordRecord) {
    myWordRecord = await prisma.userWord.findFirst({
      where: {
        user_id: userId,
        word_id: wordRecord.word_id,
        deleted_at: null, // 削除されていないもの
      },
    });
  }

  async function saveToMyWordsAction(
    meaning_id: number,
    memory_hook_id: number | null
  ): Promise<void> {
    "use server";
    const foundWord = await prisma.word.upsert({
      where: { word: wordParam },
      update: {},
      create: { word: wordParam },
    });

    const existingUserWord = await prisma.userWord.findFirst({
      where: {
        user_id: userId,
        word_id: foundWord.word_id,
        deleted_at: null,
      },
    });

    if (existingUserWord) {
      await prisma.userWord.update({
        where: { user_words_id: existingUserWord.user_words_id },
        data: { meaning_id, memory_hook_id },
      });
    } else {
      await prisma.userWord.create({
        data: {
          user_id: userId,
          word_id: foundWord.word_id,
          meaning_id,
          memory_hook_id,
        } as Prisma.UserWordUncheckedCreateInput,
      });
    }
  }

  async function createMeaningAction(
    wordInput: string,
    meaningText: string,
    isPublic: boolean,
    userId: string
  ): Promise<{
    newMeaning: Meaning & { user: { profile_image: string | null; nickname: string | null } };
    wordRec: Word;
  }> {
    "use server";
    let wordRec = await prisma.word.findUnique({ where: { word: wordInput } });
    if (!wordRec) {
      wordRec = await prisma.word.create({ data: { word: wordInput } });
    }
    const existing = await prisma.meaning.findFirst({
      where: { word_id: wordRec.word_id, user_id: userId, deleted_at: null },
    });
    if (existing) {
      throw new Error("既にあなたはこの単語の意味を登録済みです。");
    }
    await prisma.meaning.create({
      data: {
        word_id: wordRec.word_id,
        user_id: userId,
        meaning: meaningText,
        is_public: isPublic,
      },
    });
    const newMeaning = await prisma.meaning.findFirst({
      where: { word_id: wordRec.word_id, user_id: userId, meaning: meaningText },
      include: { user: true },
    });
    return { newMeaning: newMeaning! as Meaning & { user: { profile_image: string | null; nickname: string | null } }, wordRec };
  }

  async function createMemoryHookAction(
    wordInput: string,
    hookText: string,
    isPublic: boolean,
    userId: string
  ): Promise<{
    newMemoryHook: MemoryHook & { user: { profile_image: string | null; nickname: string | null } };
    wordRec: Word;
  }> {
    "use server";
    let wordRec = await prisma.word.findUnique({ where: { word: wordInput } });
    if (!wordRec) {
      wordRec = await prisma.word.create({ data: { word: wordInput } });
    }
    await prisma.memoryHook.create({
      data: {
        word_id: wordRec.word_id,
        user_id: userId,
        memory_hook: hookText,
        is_public: isPublic,
      },
    });
    const newMemoryHook = await prisma.memoryHook.findFirst({
      where: { word_id: wordRec.word_id, user_id: userId, memory_hook: hookText },
      include: { user: true },
    });
    return { newMemoryHook: newMemoryHook! as MemoryHook & { user: { profile_image: string | null; nickname: string | null } }, wordRec };
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
        createMeaning={createMeaningAction}
        createMemoryHook={createMemoryHookAction}
        saveToMyWords={saveToMyWordsAction}
        isMyWordSaved={Boolean(myWordRecord)}
        initialSelectedMeaning={initialSelectedMeaning}
        initialSelectedMemoryHook={initialSelectedMemoryHook}
        userId={userId}
      />
      {!wordRecord && <p>「{wordParam}」はまだ登録されていません。</p>}
    </div>
  );
}

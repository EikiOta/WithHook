// app/word/page.tsx
import { PrismaClient } from "@prisma/client";
import type { Meaning, MemoryHook, Word } from "@prisma/client";
import WordDetailTabs from "./WordDetailTabs";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ word: string }>;
}) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return <p>エラー：ユーザー情報を取得できません。ログインしてください。</p>;
  }
  const userId = session.user.id;

  // ユーザの存在を保証
  let userRec = await prisma.user.findUnique({ where: { user_id: userId } });
  if (!userRec) {
    userRec = await prisma.user.create({
      data: { user_id: userId, nickname: "Dummy User", profile_image: "" },
    });
  }

  const { word: wordParam } = await params;

  // 該当英単語のレコードを検索
  const wordRecord = await prisma.word.findUnique({
    where: { word: wordParam },
  });

  let meanings: Meaning[] = [];
  let memoryHooks: MemoryHook[] = [];

  if (wordRecord) {
    // 意味一覧: 「自分が作成した」または「他ユーザだが公開」かつ is_deleted=false
    meanings = await prisma.meaning.findMany({
      where: {
        word_id: wordRecord.word_id,
        is_deleted: false,
        OR: [{ user_id: userId }, { is_public: true }],
      },
      orderBy: { meaning_id: "asc" },
    });

    // 記憶hook一覧: 同様にフィルタリング
    memoryHooks = await prisma.memoryHook.findMany({
      where: {
        word_id: wordRecord.word_id,
        is_deleted: false,
        OR: [{ user_id: userId }, { is_public: true }],
      },
      orderBy: { memory_hook_id: "asc" },
    });
  }

  // --- サーバーアクション ---
  async function createMeaningAction(
    wordInput: string,
    meaningText: string,
    isPublic: boolean,
    userId: string
  ): Promise<{ newMeaning: Meaning; wordRec: Word }> {
    "use server";
    let userRec = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!userRec) {
      userRec = await prisma.user.create({
        data: { user_id: userId, nickname: "Dummy User", profile_image: "" },
      });
    }
    let wordRec = await prisma.word.findUnique({ where: { word: wordInput } });
    if (!wordRec) {
      wordRec = await prisma.word.create({ data: { word: wordInput } });
    }
    const existing = await prisma.meaning.findFirst({
      where: { word_id: wordRec.word_id, user_id: userId, is_deleted: false },
    });
    if (existing) {
      throw new Error("既にあなたはこの単語の意味を登録済みです。");
    }
    const newMeaning = await prisma.meaning.create({
      data: {
        word_id: wordRec.word_id,
        user_id: userId,
        meaning: meaningText,
        is_public: isPublic,
      },
    });
    return { newMeaning, wordRec };
  }

  async function createMemoryHookAction(
    wordInput: string,
    hookText: string,
    isPublic: boolean,
    userId: string
  ): Promise<{ newMemoryHook: MemoryHook; wordRec: Word }> {
    "use server";
    let userRec = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!userRec) {
      userRec = await prisma.user.create({
        data: { user_id: userId, nickname: "Dummy User", profile_image: "" },
      });
    }
    let wordRec = await prisma.word.findUnique({ where: { word: wordInput } });
    if (!wordRec) {
      wordRec = await prisma.word.create({ data: { word: wordInput } });
    }
    const newMemoryHook = await prisma.memoryHook.create({
      data: {
        word_id: wordRec.word_id,
        user_id: userId,
        memory_hook: hookText,
        is_public: isPublic,
      },
    });
    return { newMemoryHook, wordRec };
  }

  async function updateMeaningAction(
    meaningId: number,
    meaningText: string,
    isPublic: boolean
  ): Promise<Meaning> {
    "use server";
    return await prisma.meaning.update({
      where: { meaning_id: meaningId },
      data: { meaning: meaningText, is_public: isPublic },
    });
  }

  async function updateMemoryHookAction(
    memoryHookId: number,
    hookText: string,
    isPublic: boolean
  ): Promise<MemoryHook> {
    "use server";
    return await prisma.memoryHook.update({
      where: { memory_hook_id: memoryHookId },
      data: { memory_hook: hookText, is_public: isPublic },
    });
  }

  async function deleteMeaningAction(meaningId: number): Promise<Meaning> {
    "use server";
    return await prisma.meaning.update({
      where: { meaning_id: meaningId },
      data: { is_deleted: true },
    });
  }

  async function deleteMemoryHookAction(memoryHookId: number): Promise<MemoryHook> {
    "use server";
    return await prisma.memoryHook.update({
      where: { memory_hook_id: memoryHookId },
      data: { is_deleted: true },
    });
  }

  // 新規追加：My単語帳に追加するサーバーアクション
  async function addToMyWordsAction(
    word_id: number,
    meaning_id: number,
    memory_hook_id: number | null
  ): Promise<void> {
    "use server";
    await prisma.userWord.create({
      data: {
        user: { connect: { user_id: userId } },
        word: { connect: { word_id: word_id } },
        meaning: { connect: { meaning_id: meaning_id } },
        memoryHook: memory_hook_id ? { connect: { memory_hook_id: memory_hook_id } } : undefined,
      },
    });
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">単語詳細ページ</h1>
      <WordDetailTabs
        wordParam={wordParam}
        wordRecord={wordRecord}
        initialMeanings={meanings}
        initialMemoryHooks={memoryHooks}
        createMeaning={createMeaningAction}
        createMemoryHook={createMemoryHookAction}
        updateMeaning={updateMeaningAction}
        updateMemoryHook={updateMemoryHookAction}
        deleteMeaning={deleteMeaningAction}
        deleteMemoryHook={deleteMemoryHookAction}
        addToMyWords={addToMyWordsAction}
        userId={userId}
      />
      {!wordRecord && <p>「{wordParam}」はまだ登録されていません。</p>}
    </div>
  );
}

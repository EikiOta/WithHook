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
        is_deleted: false,
        OR: [{ user_id: userId }, { is_public: true }],
      },
      orderBy: { meaning_id: "asc" },
    });

    memoryHooks = await prisma.memoryHook.findMany({
      where: {
        word_id: wordRecord.word_id,
        is_deleted: false,
        OR: [{ user_id: userId }, { is_public: true }],
      },
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
        is_deleted: false,
      },
    });
  }

  /**
   * saveToMyWordsAction:
   * 既存なら更新、なければ新規作成するサーバーアクション
   * ※wordParam は外側スコープの変数を使用し、upsert によって単語レコードを必ず取得／作成する
   */
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
        is_deleted: false,
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

  // createMeaningAction: 単語が存在しなければ作成し、意味を登録する
  async function createMeaningAction(
    wordInput: string,
    meaningText: string,
    isPublic: boolean,
    userId: string
  ): Promise<{ newMeaning: Meaning; wordRec: Word }> {
    "use server";
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

  // createMemoryHookAction
  async function createMemoryHookAction(
    wordInput: string,
    hookText: string,
    isPublic: boolean,
    userId: string
  ): Promise<{ newMemoryHook: MemoryHook; wordRec: Word }> {
    "use server";
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

  // updateMeaningAction
  async function updateMeaningAction(
    meaningId: number,
    meaningText: string,
    isPublic: boolean
  ): Promise<Meaning> {
    "use server";
    return prisma.meaning.update({
      where: { meaning_id: meaningId },
      data: { meaning: meaningText, is_public: isPublic },
    });
  }

  // updateMemoryHookAction
  async function updateMemoryHookAction(
    memoryHookId: number,
    hookText: string,
    isPublic: boolean
  ): Promise<MemoryHook> {
    "use server";
    return prisma.memoryHook.update({
      where: { memory_hook_id: memoryHookId },
      data: { memory_hook: hookText, is_public: isPublic },
    });
  }

  // deleteMeaningAction
  async function deleteMeaningAction(meaningId: number): Promise<Meaning> {
    "use server";
    return prisma.meaning.update({
      where: { meaning_id: meaningId },
      data: { is_deleted: true },
    });
  }

  // deleteMemoryHookAction
  async function deleteMemoryHookAction(memoryHookId: number): Promise<MemoryHook> {
    "use server";
    return prisma.memoryHook.update({
      where: { memory_hook_id: memoryHookId },
      data: { is_deleted: true },
    });
  }

  const initialSelectedMeaning =
    myWordRecord && meanings.length > 0
      ? meanings.find((m) => m.meaning_id === myWordRecord.meaning_id) || meanings[0]
      : meanings.length > 0
      ? meanings[0]
      : null;

  const initialSelectedMemoryHook =
    myWordRecord && myWordRecord.memory_hook_id && memoryHooks.length > 0
      ? memoryHooks.find((h) => h.memory_hook_id === myWordRecord.memory_hook_id) || null
      : null;

  const isMyWordSaved = Boolean(myWordRecord);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">単語詳細ページ</h1>
      <WordDetailTabs
        wordParam={wordParam}
        initialMeanings={meanings}
        initialMemoryHooks={memoryHooks}
        createMeaning={createMeaningAction}
        createMemoryHook={createMemoryHookAction}
        updateMeaning={updateMeaningAction}
        updateMemoryHook={updateMemoryHookAction}
        deleteMeaning={deleteMeaningAction}
        deleteMemoryHook={deleteMemoryHookAction}
        saveToMyWords={saveToMyWordsAction}
        isMyWordSaved={isMyWordSaved}
        initialSelectedMeaning={initialSelectedMeaning}
        initialSelectedMemoryHook={initialSelectedMemoryHook}
        userId={userId}
      />
      {!wordRecord && <p>「{wordParam}」はまだ登録されていません。</p>}
    </div>
  );
}

import { PrismaClient } from "@prisma/client";
import type { Meaning, MemoryHook, Word } from "@prisma/client";
import WordDetailTabs from "./WordDetailTabs";

const prisma = new PrismaClient();
const DUMMY_USER_ID = "dummy-user";

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ word: string }>;
}) {
  const { word: wordParam } = await params;

  // ※ ログインユーザ（ここではダミー）の存在を保証する
  let userRec = await prisma.user.findUnique({ where: { user_id: DUMMY_USER_ID } });
  if (!userRec) {
    userRec = await prisma.user.create({
      data: { user_id: DUMMY_USER_ID, nickname: "Dummy User", profile_image: "" },
    });
  }

  // 該当英単語のレコードを検索
  const wordRecord = await prisma.word.findUnique({
    where: { word: wordParam },
  });

  let meanings: Meaning[] = [];
  let memoryHooks: MemoryHook[] = [];

  if (wordRecord) {
    meanings = await prisma.meaning.findMany({
      where: {
        word_id: wordRecord.word_id,
        OR: [{ user_id: DUMMY_USER_ID }, { is_public: true }],
      },
      orderBy: { meaning_id: "asc" },
    });
    memoryHooks = await prisma.memoryHook.findMany({
      where: {
        word_id: wordRecord.word_id,
        OR: [{ user_id: DUMMY_USER_ID }, { is_public: true }],
      },
      orderBy: { memory_hook_id: "asc" },
    });
  }

  // サーバーアクション: 意味新規作成
  async function createMeaningAction(
    wordInput: string,
    meaningText: string,
    isPublic: boolean,
    userId: string
  ): Promise<{ newMeaning: Meaning; wordRec: Word }> {
    "use server";

    // ユーザの存在を保証
    let userRec = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!userRec) {
      userRec = await prisma.user.create({
        data: { user_id: userId, nickname: "Dummy User", profile_image: "" },
      });
    }

    // 該当単語が存在しなければ作成
    let wordRec = await prisma.word.findUnique({ where: { word: wordInput } });
    if (!wordRec) {
      wordRec = await prisma.word.create({ data: { word: wordInput } });
    }

    // 1ユーザ1意味の制約チェック
    const existing = await prisma.meaning.findFirst({
      where: { word_id: wordRec.word_id, user_id: userId, is_deleted: false },
    });
    if (existing) {
      throw new Error("既にあなたはこの単語の意味を登録済みです。");
    }

    // 新規意味作成
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

  // サーバーアクション: 記憶hook新規作成
  async function createMemoryHookAction(
    wordInput: string,
    hookText: string,
    isPublic: boolean,
    userId: string
  ): Promise<{ newMemoryHook: MemoryHook; wordRec: Word }> {
    "use server";

    // ユーザの存在を保証
    let userRec = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!userRec) {
      userRec = await prisma.user.create({
        data: { user_id: userId, nickname: "Dummy User", profile_image: "" },
      });
    }

    // 該当単語が存在しなければ作成
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
        userId={DUMMY_USER_ID}
      />
      {!wordRecord && <p>「{wordParam}」はまだ登録されていません。</p>}
    </div>
  );
}

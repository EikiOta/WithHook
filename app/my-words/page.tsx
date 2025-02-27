// my-words/page.tsx
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import MyWordsTable from "./MyWordsTable"; // クライアントコンポーネント

const prisma = new PrismaClient();

export default async function MyWordsPage() {
  // 1. ログイン中のユーザを取得
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return <p>エラー：ユーザー情報を取得できません。ログインしてください。</p>;
  }
  const userId = session.user.id;

  // 2. user_wordsテーブルから「ログイン中のユーザID & deleted_at が null のデータ」を取得
  //    併せて Word (英単語)、Meaning と、ユーザの MemoryHook をリレーションで取得
  const userWords = await prisma.userWord.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
    },
    include: {
      word: true,
      meaning: true, // 直接関連する Meaning を取得
      memoryHook: true,
    },
  });

  // 3. クライアント側で扱いやすい形に整形
  //    MyWordsTable が受け取る { id, word, meaning, memoryHook } の形にする
  const data = userWords.map((uw) => ({
    id: uw.user_words_id,
    word: uw.word.word,
    meaning: uw.meaning ? uw.meaning.meaning : "",
    memoryHook: uw.memoryHook ? uw.memoryHook.memory_hook : "",
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My単語帳</h1>
      {/* クライアントコンポーネントへデータを渡す */}
      <MyWordsTable initialData={data} />
    </div>
  );
}

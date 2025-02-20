import { prisma } from "@/lib/prisma"; 
import MyWordsTable from "./MyWordsTable"; // クライアントコンポーネント
import { auth } from "@/auth";

export default async function MyWordsPage() {
  // 1. ログイン中のユーザを取得
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return <p>エラー：ユーザー情報を取得できません。ログインしてください。</p>;
  }
  const userId = session.user.id;

  // 2. user_wordsテーブルから「ログイン中のユーザID & is_deleted=false」のデータを取得
  //    併せて Word (英単語) と、ユーザの memoryHook をリレーションで取得
  //    さらに、ユーザの Meaning も1件だけ取得（例: 先頭1件）
  const userWords = await prisma.userWord.findMany({
    where: {
      user_id: userId,
      is_deleted: false,
    },
    include: {
      word: {
        include: {
          // ここで "meanings" のうち user_id が自分 & is_deleted=false を1件だけ取得
          meanings: {
            where: {
              user_id: userId,
              is_deleted: false,
            },
            take: 1,
          },
        },
      },
      memoryHook: true, // memoryHook があれば取得
    },
  });

  // 3. クライアント側で扱いやすい形に整形
  //    例: MyWordsTable が受け取る { id, word, meaning, memoryHook } の形にする
  const data = userWords.map((uw) => ({
    id: uw.user_words_id,
    word: uw.word.word, // Wordモデルの英単語
    meaning: uw.word.meanings?.[0]?.meaning ?? "", // 先頭1件のmeaningを表示
    memoryHook: uw.memoryHook?.memory_hook ?? "",   // userWord.memoryHook があれば表示
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My単語帳</h1>
      {/* 4. クライアントコンポーネントへデータを渡す */}
      <MyWordsTable initialData={data} />
    </div>
  );
}

// app/manage/page.tsx
import { auth } from "@/auth";
import ManageTabs from "./ManageTabs";
import prisma from "@/lib/prisma"; // シングルトンインスタンスを使用

export const dynamic = "force-dynamic"; // セッションを正しく取得するために動的レンダリングを強制

export default async function ManagePage() {
  try {
    // ユーザー認証
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">認証エラー</h1>
          <p>ユーザー情報を取得できません。ログインしてください。</p>
        </div>
      );
    }
    
    const userId = session.user.id;
    console.log("Managing content for user:", userId);

    // ログイン中ユーザが登録した「意味」一覧を取得 (wordも join)
    const userMeanings = await prisma.meaning.findMany({
      where: {
        user_id: userId,
        deleted_at: null,  // 削除されていないもののみ
      },
      orderBy: { meaning_id: "asc" },
      include: {
        word: true,
      },
    }).catch(error => {
      console.error("Failed to fetch meanings:", error);
      return [];
    });

    // ログイン中ユーザが登録した「記憶hook」一覧を取得 (wordも join)
    const userMemoryHooks = await prisma.memoryHook.findMany({
      where: {
        user_id: userId,
        deleted_at: null,  // 削除されていないもののみ
      },
      orderBy: { memory_hook_id: "asc" },
      include: {
        word: true,
      },
    }).catch(error => {
      console.error("Failed to fetch memory hooks:", error);
      return [];
    });

    // クライアントコンポーネントに渡すデータを安全に処理
    const serializedMeanings = userMeanings.map(meaning => ({
      ...meaning,
      created_at: meaning.created_at ? meaning.created_at.toISOString() : null,
      updated_at: meaning.updated_at ? meaning.updated_at.toISOString() : null,
      deleted_at: meaning.deleted_at ? meaning.deleted_at.toISOString() : null,
    }));

    const serializedMemoryHooks = userMemoryHooks.map(hook => ({
      ...hook,
      created_at: hook.created_at ? hook.created_at.toISOString() : null,
      updated_at: hook.updated_at ? hook.updated_at.toISOString() : null,
      deleted_at: hook.deleted_at ? hook.deleted_at.toISOString() : null,
    }));

    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">登録した意味・記憶hook</h1>
        <ManageTabs
          initialMeanings={serializedMeanings}
          initialMemoryHooks={serializedMemoryHooks}
        />
      </div>
    );
  } catch (error) {
    console.error("Error in ManagePage:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
        <p>データの取得中にエラーが発生しました。しばらく経ってからもう一度お試しください。</p>
        <p className="text-sm mt-2 text-red-600">
          エラー内容: {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }
}
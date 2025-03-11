// app/manage/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ManageTabs from "./ManageTabs";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function ManagePage() {
  try {
    // セッションを取得
    const session = await auth();
    
    if (!session?.user?.id) {
      // セッションがない場合はログインページへリダイレクト
      redirect("/login");
    }
    
    const userId = session.user.id;
    
    // データベース接続処理
    try {
      const prisma = new PrismaClient();
      
      // ユーザーが存在するか確認
      const userExists = await prisma.user.findUnique({
        where: { user_id: userId }
      });
      
      if (!userExists) {
        await prisma.$disconnect();
        return (
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">ユーザーエラー</h1>
            <p>ユーザー情報がデータベースに見つかりません。ログインし直してください。</p>
          </div>
        );
      }

      // ログイン中ユーザが登録した「意味」一覧を取得
      const userMeanings = await prisma.meaning.findMany({
        where: {
          user_id: userId,
          deleted_at: null,
        },
        orderBy: { meaning_id: "asc" },
        include: { word: true },
      });

      // ログイン中ユーザが登録した「記憶hook」一覧を取得
      const userMemoryHooks = await prisma.memoryHook.findMany({
        where: {
          user_id: userId,
          deleted_at: null,
        },
        orderBy: { memory_hook_id: "asc" },
        include: { word: true },
      });

      // クライアントコンポーネントに渡すためにシリアライズ
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

      // データベース接続を閉じる
      await prisma.$disconnect();
      
      return (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">登録した意味・記憶hook</h1>
          <div className="mb-4 text-sm text-gray-600">
            ユーザーID: {userId}
          </div>
          <ManageTabs
            initialMeanings={serializedMeanings}
            initialMemoryHooks={serializedMemoryHooks}
          />
        </div>
      );
    } catch (dbError) {
      console.error("データベース操作エラー:", dbError);
      return (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">データベースエラー</h1>
          <p>データの取得中にエラーが発生しました。</p>
          <p className="text-sm mt-2 text-red-600">
            {dbError instanceof Error ? dbError.message : String(dbError)}
          </p>
        </div>
      );
    }
  } catch (authError) {
    console.error("認証エラー:", authError);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">認証エラー</h1>
        <p>認証情報の取得中にエラーが発生しました。ログインし直してください。</p>
      </div>
    );
  }
}
import { auth } from "@/auth";

/**
 * 「設定」画面
 * アカウント削除ボタンを置くだけのシンプルな画面
 */
export default async function SettingsPage() {
  const session = await auth();
  if (!session || !session.user) {
    return <p>エラー：ログインしてください。</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">設定</h1>
      {/* ここではガワだけなので、実際のアカウント削除処理は未実装 */}
      <button className="px-4 py-2 bg-red-500 text-white rounded">
        アカウント削除
      </button>
    </div>
  );
}

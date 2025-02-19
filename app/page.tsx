"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">トップ</h1>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* 英単語検索カード */}
        <div className="w-full max-w-sm bg-white rounded shadow p-6 flex flex-col items-center">
          <div className="text-3xl mb-2">🔍</div>
          <h2 className="text-xl font-semibold mb-2">英単語検索</h2>
          <p className="text-gray-600 text-center mb-4">
            英単語を検索して詳細確認や
            <br />
            My単語帳へ追加ができます
          </p>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => router.push("/word-search")}
          >
            検索する
          </button>
        </div>

        {/* My単語帳カード */}
        <div className="w-full max-w-sm bg-white rounded shadow p-6 flex flex-col items-center">
          <div className="text-3xl mb-2">📚</div>
          <h2 className="text-xl font-semibold mb-2">My単語帳</h2>
          <p className="text-gray-600 text-center mb-4">
            登録した単語を確認して
            <br />
            学習を進めましょう
          </p>
          <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            単語帳を開く
          </button>
        </div>
      </div>
    </div>
  );
}

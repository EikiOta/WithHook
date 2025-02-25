"use client";

import { signIn } from "next-auth/react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h1 className="mb-8 text-2xl font-bold">with-hook</h1>
      <div className="w-full max-w-sm bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">アカウント作成</h2>
        <p className="mb-4 text-gray-600">
          革新的なWeb英単語帳
          <br />
          ・記憶hook
          <br />
          ・4択クイズ
          <br />
          ・AI長文生成
        </p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-2 mb-3 py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded"
        >
          Googleで登録
        </button>
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-2 mb-3 py-2 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded"
        >
          GitHubで登録
        </button>
      </div>
    </div>
  );
}

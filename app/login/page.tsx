"use client";

import { signIn } from "next-auth/react";



export const dynamic = "force-dynamic"; // ここで動的レンダリングを強制

export default function LoginPage() {



    
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      {/* ヘッダーなど全画面共通にしない場合、ここで簡易ロゴを表示 */}
      <h1 className="mb-8 text-2xl font-bold">with-hook</h1>

      <div className="w-full max-w-sm bg-white rounded shadow p-6">
        {/* タイトル */}
        <h2 className="text-xl font-semibold mb-4">アカウント作成</h2>

        {/* 説明など */}
        <p className="mb-4 text-gray-600">
          革新的なWeb英単語帳
          <br />
          ・記憶hook
          <br />
          ・4択クイズ
          <br />
          ・AI長文生成
        </p>

        {/* Google で登録 */}
        <button
          onClick={() => signIn("google")}
          className="w-full flex items-center justify-center gap-2 mb-3 py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded"
        >
          Googleで登録
        </button>

        {/* GitHub で登録 */}
        <button
          onClick={() => signIn("github")}
          className="w-full flex items-center justify-center gap-2 mb-3 py-2 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded"
        >
          GitHubで登録
        </button>

        {/* すでにアカウントを持っている場合 */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">アカウントをお持ちの場合</p>
          <button
            onClick={() => signIn()} // デフォルトのサインイン画面へ
            className="mt-2 w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded"
          >
            ログイン
          </button>
        </div>
      </div>
    </div>
  );
}

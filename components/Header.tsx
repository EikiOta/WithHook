// components/Header.tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white shadow">
      <div className="text-lg font-bold">with-hook</div>

      <div>
        {status === "loading" ? (
          <div className="text-gray-500">読み込み中...</div>
        ) : session?.user ? (
          // ログイン済みの場合
          <div className="flex items-center space-x-4">
            <img
              src={session.user.image || "/default-avatar.png"}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span>{session.user.name || "No Name"}</span>
            <button
              onClick={() => signOut()}
              className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
            >
              ログアウト
            </button>
          </div>
        ) : (
          // 未ログインの場合
          <button
            onClick={() => signIn()}
            className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            ログイン
          </button>
        )}
      </div>
    </header>
  );
}

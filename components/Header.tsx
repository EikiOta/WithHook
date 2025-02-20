"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleTitleClick = () => {
    // ログイン中ならトップ、未ログインならログインページへ遷移
    router.push(session?.user ? "/" : "/login");
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white shadow">
      <div 
        className="cursor-pointer text-lg font-bold"
        onClick={handleTitleClick}
      >
        with-hook
      </div>

      <div>
        {status === "loading" ? (
          <div className="text-gray-500">読み込み中...</div>
        ) : session?.user ? (
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

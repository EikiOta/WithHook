"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import DropdownMenu from "./DropdownMenu";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleTitleClick = () => {
    router.push(session?.user ? "/" : "/login");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white shadow relative">
      <div 
        className="cursor-pointer text-lg font-bold"
        onClick={handleTitleClick}
      >
        with-hook
      </div>

      <div className="relative" ref={dropdownRef}>
        {status === "loading" ? (
          <div className="text-gray-500">読み込み中...</div>
        ) : session?.user ? (
          <div
            className="flex items-center space-x-4 cursor-pointer"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <img
              src={session.user.image || "/default-avatar.png"}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span>{session.user.name || "No Name"}</span>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            ログイン
          </button>
        )}
        {dropdownOpen && <DropdownMenu onClose={() => setDropdownOpen(false)} />}
      </div>
    </header>
  );
}

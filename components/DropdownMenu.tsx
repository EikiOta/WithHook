"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type DropdownMenuProps = {
  onClose: () => void;
};

export default function DropdownMenu({ onClose }: DropdownMenuProps) {
  const router = useRouter();

  const handleManage = () => {
    router.push("/manage");
    onClose();
  };

  const handleSettings = () => {
    router.push("/settings");
    onClose();
  };

  const handleLogout = () => {
    // ログアウト後に "/login" へリダイレクトする
    signOut({ callbackUrl: "/login", redirect: true });
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
      <ul>
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={handleManage}
        >
          意味・記憶hook管理
        </li>
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={handleSettings}
        >
          設定
        </li>
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={handleLogout}
        >
          ログアウト
        </li>
      </ul>
    </div>
  );
}

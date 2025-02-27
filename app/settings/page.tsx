// app/settings/page.tsx
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import DeleteModal from "@/components/DeleteModal";

export default function SettingsPage() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccountConfirm = async () => {
    setIsDeleting(true);
    try {
      // 論理削除APIエンドポイントを呼び出す
      const res = await fetch("/api/user/delete", { method: "POST" });
      if (res.ok) {
        alert("アカウント削除が完了しました。");
        // ログアウトして /login へリダイレクト
        signOut({ callbackUrl: "/login" });
      } else {
        const data = await res.json();
        alert(data.error || "アカウント削除に失敗しました。");
      }
    } catch (error) {
      console.error("削除エラー:", error);
      alert("アカウント削除中にエラーが発生しました。");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">設定</h1>
      <button
        onClick={() => setShowDeleteModal(true)}
        className="px-4 py-2 bg-red-500 text-white rounded"
        disabled={isDeleting}
      >
        {isDeleting ? "削除中..." : "アカウント削除"}
      </button>

      {/* DeleteModal を流用 */}
      {showDeleteModal && (
        <DeleteModal
          message="本当にアカウントを削除しますか？\n30日以内なら復旧可能です。"
          onConfirm={handleDeleteAccountConfirm}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import DeleteModal from "@/components/DeleteModal";

export default function SettingsPage() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDeleteAccountConfirm = async () => {
    setIsDeleting(true);
    setErrorMessage("");
    
    try {
      const res = await fetch("/api/user/delete", { 
        method: "POST",
        headers: {
          "Accept": "application/json"
        }
      });
      
      if (res.ok) {
        alert("アカウント削除が完了しました。");
        signOut({ callbackUrl: "/login" });
        return;
      }
      
      const data = await res.json();
      setErrorMessage(data.error || data.message || "不明なエラーが発生しました");
    } catch (error) {
      setErrorMessage(`API呼び出しエラー: ${error instanceof Error ? error.message : "不明なエラー"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">設定</h1>
      
      {errorMessage && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">
          <h3 className="font-bold">エラー:</h3>
          <p>{errorMessage}</p>
        </div>
      )}
      
      <button
        onClick={() => setShowDeleteModal(true)}
        className="px-4 py-2 bg-red-500 text-white rounded"
        disabled={isDeleting}
      >
        {isDeleting ? "削除中..." : "アカウント削除"}
      </button>

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
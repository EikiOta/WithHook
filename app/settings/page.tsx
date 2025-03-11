// app/settings/page.tsx
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import DeleteModal from "@/components/DeleteModal";

export default function SettingsPage() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);

// app/settings/page.tsx（変更部分のみ）
const handleDeleteAccountConfirm = async () => {
  setIsDeleting(true);
  setErrorMessage("");
  setDebugInfo(null);
  
  console.log("Starting account deletion...");
  
  try {
    // 簡易版APIを試す（テスト用）
    // エラーが発生する場合はこちらを使ってデバッグ
    // const url = "/api/user/delete/simple";
    const url = "/api/user/delete";
    
    console.log(`Sending DELETE request to ${url}`);
    const res = await fetch(url, { 
      method: "POST",
      headers: {
        // 明示的にJSONを要求
        "Accept": "application/json"
      }
    });
    
    console.log("Response received:", {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries([...res.headers.entries()])
    });
    
    let responseText;
    try {
      responseText = await res.text();
      console.log("Raw response text:", responseText);
      
      // JSONとしてパースを試みる
      try {
        const data = JSON.parse(responseText);
        console.log("Parsed JSON response:", data);
        setDebugInfo({ parsedData: data });
        
        if (res.ok) {
          alert("アカウント削除が完了しました。");
          signOut({ callbackUrl: "/login" });
          return;
        }
        
        setErrorMessage(data.error || data.message || "不明なエラーが発生しました");
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        setErrorMessage(`JSONの解析に失敗: ${responseText}`);
      }
    } catch (textError) {
      console.error("Error reading response text:", textError);
      setErrorMessage("レスポンス読み取りエラー");
    }
  } catch (fetchError) {
    console.error("Fetch error:", fetchError);
    setErrorMessage(`API呼び出しエラー: ${fetchError instanceof Error ? fetchError.message : "不明なエラー"}`);
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
      
      {debugInfo && (
        <div className="p-3 mb-4 bg-gray-100 rounded">
          <h3 className="font-bold">デバッグ情報:</h3>
          <pre className="overflow-auto text-xs mt-2 p-2 bg-gray-800 text-white rounded">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
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
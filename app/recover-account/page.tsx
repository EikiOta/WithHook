"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";

export default function RecoverAccountPage() {
  const [isRecovering, setIsRecovering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // 成功時のカウントダウンとリダイレクト
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      // カウントダウン完了後にトップページへリダイレクト
      window.location.replace("/");
    }
  }, [success, countdown]);

  const handleRecoverAccount = async () => {
    setIsRecovering(true);
    try {
      const res = await fetch("/api/user/recover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setSuccess(true);
        toast.success("アカウントを復旧しました！");
      } else {
        const data = await res.json();
        toast.error(data.error || "アカウント復旧に失敗しました");
      }
    } catch (error) {
      toast.error("アカウント復旧処理中にエラーが発生しました");
    } finally {
      setIsRecovering(false);
    }
  };

  const handleCancelRecover = () => {
    // ログアウトして復旧せずにログイン画面に戻る
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Toaster />
      <div className="w-full max-w-md bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">アカウント復旧</h1>
        
        {success ? (
          <div className="text-center">
            <div className="mb-4 text-green-600 text-lg">
              アカウントの復旧が完了しました！
            </div>
            <p className="mb-4 text-gray-600">
              {countdown}秒後にトップページに移動します...
            </p>
            <button 
              onClick={() => window.location.replace("/")}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              今すぐトップページへ
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
              <p>このアカウントは削除済みの状態です。</p>
              <p>アカウントを復旧して再度利用するには「アカウントを復旧する」を押してください。</p>
            </div>
            
            <p className="mb-6 text-gray-600">
              復旧すると、あなたの単語や記憶hookなどのデータも全て復活します。
            </p>

            <div className="space-y-4">
              <button
                onClick={handleRecoverAccount}
                disabled={isRecovering}
                className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded transition duration-200"
              >
                {isRecovering ? "復旧処理中..." : "アカウントを復旧する"}
              </button>
              <button
                onClick={handleCancelRecover}
                disabled={isRecovering}
                className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded transition duration-200"
              >
                キャンセル（新規アカウント作成）
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
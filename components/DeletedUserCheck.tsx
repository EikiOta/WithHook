// components/DeletedUserCheck.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DeletedUserCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // ログイン済みかつ復旧ページではない場合のみチェック
    if (status === "authenticated" && pathname !== "/recover-account" && !isChecked) {
      console.log("削除状態をチェック中...");
      
      const checkDeletedStatus = async () => {
        try {
          const res = await fetch("/api/user/delete/check-deleted");
          const data = await res.json();
          
          if (data.deleted === true) {
            console.log("削除済みアカウントを検出: 復旧ページへリダイレクト");
            router.push("/recover-account");
          }
        } catch (error) {
          console.error("削除状態チェックエラー:", error);
        } finally {
          setIsChecked(true);
        }
      };
      
      checkDeletedStatus();
    }
    // components/DeletedUserCheck.tsx の useEffect 内に追加


  }, [status, pathname, router, isChecked]);

  // 何もレンダリングしない
  return null;
}
// components/DeletedUserCheck.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DeletedUserCheck() {
  // session 変数は現在使用していないがステータスのために必要
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // ページが変わるたびにチェックを許可する（同じページ内では1回だけ）
    if (pathname !== "/recover-account") {
      hasCheckedRef.current = false;
    }
  }, [pathname]);

  useEffect(() => {
    // 既にチェック済み、または認証中、またはログアウト状態、または復旧ページでない場合はスキップ
    if (
      hasCheckedRef.current || 
      status !== "authenticated" || 
      pathname === "/recover-account"
    ) {
      return;
    }

    const checkDeletedStatus = async () => {
      // 二重実行防止のフラグを立てる
      hasCheckedRef.current = true;
      
      try {
        const res = await fetch("/api/user/delete/check-deleted");
        
        if (!res.ok) {
          console.error("[DeletedUserCheck] API エラー:", res.status);
          return;
        }
        
        const data = await res.json();
        
        if (data.deleted === true) {
          console.log("[DeletedUserCheck] 削除済みアカウントを検出: 復旧ページへリダイレクト");
          router.push("/recover-account");
        }
      } catch (error) {
        console.error("[DeletedUserCheck] 削除状態チェックエラー:", error);
      }
    };
    
    checkDeletedStatus();
  }, [status, pathname, router]);

  // 何もレンダリングしない
  return null;
}
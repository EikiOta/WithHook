"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import DeleteModal from "@/components/DeleteModal";
import OperationButtons from "@/components/OperationButtons";

// テーブル表示用の型定義
type MyWordItem = {
  id: number;
  word: string;
  meaning: string;
  memoryHook: string;
};

export default function MyWordsTable({
  initialData,
}: {
  initialData: MyWordItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<MyWordItem[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<MyWordItem | null>(null);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  // 編集ボタン押下時は、対象の英単語詳細ページへ遷移
  const handleEdit = (word: string) => {
    router.push(`/words/${word}`);
  };

  // 削除処理（API経由で論理削除し、状態を更新）
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch("/api/myword/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        throw new Error("削除に失敗しました");
      }
      // 削除成功時、状態から該当アイテムを除去
      setData((prev) => prev.filter((item) => item.id !== id));
      toast.success("削除しました！");
    } catch (error) {
      console.error(error);
      toast.error("削除に失敗しました");
    }
  };

  // クエリパラメータ "saved" があればトースト表示し、パラメータを除去
  useEffect(() => {
    if (searchParams.get("saved") === "1") {
      toast.success("保存しました！");
      router.replace("/my-words");
    }
  }, [searchParams, router]);

  return (
    <div className="bg-white shadow-md rounded p-4 overflow-x-auto">
      <Toaster />
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2 w-16">No</th>
            <th className="border p-2">英単語</th>
            <th className="border p-2">意味</th>
            <th className="border p-2">記憶hook</th>
            <th className="border p-2 w-24">操作</th>
          </tr>
        </thead>
        <tbody>
          {currentData.length === 0 ? (
            <tr>
              <td className="border p-2 text-center" colSpan={5}>
                データがありません
              </td>
            </tr>
          ) : (
            currentData.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="border p-2 text-center">
                  {(currentPage - 1) * itemsPerPage + (index + 1)}
                </td>
                <td className="border p-2">{item.word}</td>
                <td className="border p-2">
                  {item.meaning.startsWith("この意味はユーザによって削除されました") ? (
                    <span className="text-red-600">{item.meaning}</span>
                  ) : (
                    item.meaning
                  )}
                </td>
                <td className="border p-2">
                  {item.memoryHook.startsWith("この記憶hookはユーザによって削除されました") ? (
                    <span className="text-red-600">{item.memoryHook}</span>
                  ) : (
                    item.memoryHook
                  )}
                </td>
                <td className="border p-2 text-center">
                  <OperationButtons
                    onEdit={() => handleEdit(item.word)}
                    onDelete={() => setDeleteTarget(item)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ページネーション */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <div className="space-x-2">
          <button
            onClick={handlePrev}
            disabled={currentPage <= 1}
            className={`px-3 py-1 border rounded ${
              currentPage <= 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            前へ
          </button>
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            className={`px-3 py-1 border rounded ${
              currentPage >= totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            次へ
          </button>
        </div>
      </div>

      {/* 削除用モーダル */}
      {deleteTarget && (
        <DeleteModal
          message={`本当に「${deleteTarget.word}」を削除しますか？\n作成した意味・記憶hookは削除されません。`}
          onConfirm={async () => {
            await handleDelete(deleteTarget.id);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
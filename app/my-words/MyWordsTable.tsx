"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [data] = useState<MyWordItem[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);

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

  return (
    <div className="bg-white shadow-md rounded p-4 overflow-x-auto">
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
                <td className="border p-2">{item.meaning}</td>
                <td className="border p-2">{item.memoryHook}</td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => handleEdit(item.word)}
                    className="px-2 py-1 bg-yellow-300 rounded mr-2"
                  >
                    編集
                  </button>
                  <button className="px-2 py-1 bg-red-300 rounded">
                    削除
                  </button>
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
    </div>
  );
}

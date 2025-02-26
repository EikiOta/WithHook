"use client";

import { useState } from "react";
import TextFormModal from "@/components/TextFormModal";
import DeleteModal from "@/components/DeleteModal";
import toast, { Toaster } from "react-hot-toast";
import OperationButtons from "@/components/OperationButtons";

/**
 * 「意味一覧」「記憶hook一覧」タブを切り替えて表示するクライアントコンポーネント
 * 各テーブルには「No / 英単語 / 意味または記憶hook / 公開? / 操作」列を表示し、
 * 編集ボタン押下で TextFormModal を開いて API 経由で更新処理を行い、トースト通知を表示する。
 * 削除ボタン押下時は、削除前にチェックして、My単語帳で使用中の場合は削除をブロックする。
 */

// 型定義（DBから取得したレコードを想定）
type Word = {
  word_id: number;
  word: string;
};

export type Meaning = {
  meaning_id: number;
  meaning: string;
  is_public: boolean;
  user_id: string;
  word: Word | null;
};

export type MemoryHook = {
  memory_hook_id: number;
  memory_hook: string;
  is_public: boolean;
  user_id: string;
  word: Word | null;
};

type Props = {
  initialMeanings: Meaning[];
  initialMemoryHooks: MemoryHook[];
};

export default function ManageTabs({
  initialMeanings,
  initialMemoryHooks,
}: Props) {
  const [activeTab, setActiveTab] = useState<"meanings" | "memoryHooks">("meanings");

  const [meanings, setMeanings] = useState<Meaning[]>(initialMeanings);
  const [memoryHooks, setMemoryHooks] = useState<MemoryHook[]>(initialMemoryHooks);

  const [editMeaning, setEditMeaning] = useState<Meaning | null>(null);
  const [editMemoryHook, setEditMemoryHook] = useState<MemoryHook | null>(null);

  const [deleteMeaningTarget, setDeleteMeaningTarget] = useState<Meaning | null>(null);
  const [deleteMemoryHookTarget, setDeleteMemoryHookTarget] = useState<MemoryHook | null>(null);

  // 更新処理: 意味の更新を API 経由で実施
  const updateMeaning = async (
    meaningId: number,
    newText: string,
    newIsPublic: boolean
  ): Promise<Meaning> => {
    const res = await fetch("/api/manage/updateMeaning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meaning_id: meaningId, meaningText: newText, isPublic: newIsPublic }),
    });
    if (!res.ok) {
      throw new Error("意味の更新に失敗しました");
    }
    const data = await res.json();
    return data.updated;
  };

  // 更新処理: 記憶hook の更新を API 経由で実施
  const updateMemoryHook = async (
    memoryHookId: number,
    newText: string,
    newIsPublic: boolean
  ): Promise<MemoryHook> => {
    const res = await fetch("/api/manage/updateMemoryHook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory_hook_id: memoryHookId, hookText: newText, isPublic: newIsPublic }),
    });
    if (!res.ok) {
      throw new Error("記憶hookの更新に失敗しました");
    }
    const data = await res.json();
    return data.updated;
  };

  // 編集完了後の処理 (意味)
  const handleMeaningUpdate = async (text: string, isPublic: boolean) => {
    if (!editMeaning) return;
    const updated = await updateMeaning(editMeaning.meaning_id, text, isPublic);
    setMeanings((prev) =>
      prev.map((m) => (m.meaning_id === updated.meaning_id ? { ...m, ...updated } : m))
    );
    toast.success("編集しました！");
    setEditMeaning(null);
  };

  // 編集完了後の処理 (記憶hook)
  const handleMemoryHookUpdate = async (text: string, isPublic: boolean) => {
    if (!editMemoryHook) return;
    const updated = await updateMemoryHook(editMemoryHook.memory_hook_id, text, isPublic);
    setMemoryHooks((prev) =>
      prev.map((h) =>
        h.memory_hook_id === updated.memory_hook_id ? { ...h, ...updated } : h
      )
    );
    toast.success("編集しました！");
    setEditMemoryHook(null);
  };

  // 削除処理 (意味)
  const handleDeleteMeaning = async (meaning_id: number) => {
    const res = await fetch("/api/manage/deleteMeaning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meaning_id }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "意味の削除に失敗しました");
    }
    setMeanings((prev) => prev.filter((m) => m.meaning_id !== meaning_id));
    toast.success("削除しました！");
  };

  // 削除処理 (記憶hook)
  const handleDeleteMemoryHook = async (memory_hook_id: number) => {
    const res = await fetch("/api/manage/deleteMemoryHook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory_hook_id }),
    });
    if (!res.ok) {
      throw new Error("記憶hookの削除に失敗しました");
    }
    setMemoryHooks((prev) => prev.filter((h) => h.memory_hook_id !== memory_hook_id));
    toast.success("削除しました！");
  };

  return (
    <div className="mt-4">
      <Toaster />
      {/* タブ切り替えボタン */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 border rounded ${activeTab === "meanings" ? "bg-blue-200" : ""}`}
          onClick={() => setActiveTab("meanings")}
        >
          意味一覧
        </button>
        <button
          className={`px-4 py-2 border rounded ${activeTab === "memoryHooks" ? "bg-blue-200" : ""}`}
          onClick={() => setActiveTab("memoryHooks")}
        >
          記憶hook一覧
        </button>
      </div>

      {/* ─────────── 意味一覧 ─────────── */}
      {activeTab === "meanings" && (
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-lg font-bold mb-2">意味一覧</h2>
          {meanings.length === 0 ? (
            <p>まだ意味が登録されていません。</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 w-16">No</th>
                  <th className="border p-2">英単語</th>
                  <th className="border p-2">意味</th>
                  <th className="border p-2 w-24">公開?</th>
                  <th className="border p-2 w-32">操作</th>
                </tr>
              </thead>
              <tbody>
                {meanings.map((m, idx) => (
                  <tr key={m.meaning_id} className="hover:bg-gray-50">
                    <td className="border p-2 text-center">{idx + 1}</td>
                    <td className="border p-2">
                      {m.word ? m.word.word : "(紐づく単語なし)"}
                    </td>
                    <td className="border p-2">{m.meaning}</td>
                    <td className="border p-2 text-center">
                      {m.is_public ? "公開" : "非公開"}
                    </td>
                    <td className="border p-2 text-center">
                      <OperationButtons
                        onEdit={() => setEditMeaning(m)}
                        onDelete={() => setDeleteMeaningTarget(m)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─────────── 記憶hook一覧 ─────────── */}
      {activeTab === "memoryHooks" && (
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-lg font-bold mb-2">記憶hook一覧</h2>
          {memoryHooks.length === 0 ? (
            <p>まだ記憶hookが登録されていません。</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 w-16">No</th>
                  <th className="border p-2">英単語</th>
                  <th className="border p-2">記憶hook</th>
                  <th className="border p-2 w-24">公開?</th>
                  <th className="border p-2 w-32">操作</th>
                </tr>
              </thead>
              <tbody>
                {memoryHooks.map((h, idx) => (
                  <tr key={h.memory_hook_id} className="hover:bg-gray-50">
                    <td className="border p-2 text-center">{idx + 1}</td>
                    <td className="border p-2">
                      {h.word ? h.word.word : "(紐づく単語なし)"}
                    </td>
                    <td className="border p-2">{h.memory_hook}</td>
                    <td className="border p-2 text-center">
                      {h.is_public ? "公開" : "非公開"}
                    </td>
                    <td className="border p-2 text-center">
                      <OperationButtons
                        onEdit={() => setEditMemoryHook(h)}
                        onDelete={() => setDeleteMemoryHookTarget(h)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 編集用モーダル (意味) */}
      {editMeaning && (
        <TextFormModal
          title="意味を編集"
          word={editMeaning.word ? editMeaning.word.word : ""}
          initialText={editMeaning.meaning}
          placeholder="意味を入力"
          initialIsPublic={editMeaning.is_public}
          onSave={handleMeaningUpdate}
          onClose={() => setEditMeaning(null)}
        />
      )}

      {/* 編集用モーダル (記憶hook) */}
      {editMemoryHook && (
        <TextFormModal
          title="記憶hookを編集"
          word={editMemoryHook.word ? editMemoryHook.word.word : ""}
          initialText={editMemoryHook.memory_hook}
          placeholder="記憶hookを入力"
          initialIsPublic={editMemoryHook.is_public}
          onSave={handleMemoryHookUpdate}
          onClose={() => setEditMemoryHook(null)}
        />
      )}

      {/* 削除用モーダル (意味) */}
      {deleteMeaningTarget && (
        <DeleteModal
          message={`本当に「${deleteMeaningTarget.word ? deleteMeaningTarget.word.word : ""}」の意味を削除しますか？`}
          onConfirm={async () => {
            try {
              await handleDeleteMeaning(deleteMeaningTarget.meaning_id);
            } catch (error) {
              console.log(error);
              toast.error(error instanceof Error ? error.message : "削除に失敗しました");
            }
          }}
          onClose={() => setDeleteMeaningTarget(null)}
        />
      )}

      {/* 削除用モーダル (記憶hook) */}
      {deleteMemoryHookTarget && (
        <DeleteModal
          message={`本当に「${deleteMemoryHookTarget.word ? deleteMemoryHookTarget.word.word : ""}」の記憶hookを削除しますか？`}
          onConfirm={async () => {
            try {
              await handleDeleteMemoryHook(deleteMemoryHookTarget.memory_hook_id);
            } catch (error) {
              console.log(error);
              toast.error("削除に失敗しました");
            }
          }}
          onClose={() => setDeleteMemoryHookTarget(null)}
        />
      )}
    </div>
  );
}

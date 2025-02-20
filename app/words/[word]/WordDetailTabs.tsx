"use client";

import { useState } from "react";
import type { Word, Meaning, MemoryHook } from "@prisma/client";
import TextFormModal from "@/components/TextFormModal";

// --- 自分の投稿を先に表示するためのソート関数 ---
function sortOwnFirst<T extends { user_id: string }>(
  items: T[],
  userId: string,
  idKey: keyof T
): T[] {
  return items.slice().sort((a, b) => {
    const aOwn = a.user_id === userId ? 0 : 1;
    const bOwn = b.user_id === userId ? 0 : 1;
    if (aOwn !== bOwn) return aOwn - bOwn;
    return Number(a[idKey]) - Number(b[idKey]);
  });
}

type Props = {
  wordParam: string;
  initialMeanings: Meaning[];
  initialMemoryHooks: MemoryHook[];
  createMeaning: (
    wordInput: string,
    meaningText: string,
    isPublic: boolean,
    userId: string
  ) => Promise<{ newMeaning: Meaning; wordRec: Word }>;
  createMemoryHook: (
    wordInput: string,
    hookText: string,
    isPublic: boolean,
    userId: string
  ) => Promise<{ newMemoryHook: MemoryHook; wordRec: Word }>;
  updateMeaning: (
    meaningId: number,
    meaningText: string,
    isPublic: boolean
  ) => Promise<Meaning>;
  updateMemoryHook: (
    memoryHookId: number,
    hookText: string,
    isPublic: boolean
  ) => Promise<MemoryHook>;
  deleteMeaning: (meaningId: number) => Promise<Meaning>;
  deleteMemoryHook: (memoryHookId: number) => Promise<MemoryHook>;
  saveToMyWords: (
    meaning_id: number,
    memory_hook_id: number | null
  ) => Promise<void>;
  isMyWordSaved: boolean;
  initialSelectedMeaning: Meaning | null;
  initialSelectedMemoryHook: MemoryHook | null;
  userId: string;
};

// 削除確認用モーダル
function ConfirmModal({
  message,
  onConfirm,
  onClose,
}: {
  message: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-4">{message}</p>
        <button
          onClick={async () => {
            await onConfirm();
            onClose();
          }}
          className="px-4 py-2 bg-red-500 text-white rounded mr-2"
        >
          はい
        </button>
        <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
          キャンセル
        </button>
      </div>
    </div>
  );
}

export default function WordDetailTabs({
  wordParam,
  initialMeanings,
  initialMemoryHooks,
  createMeaning,
  createMemoryHook,
  updateMeaning,
  updateMemoryHook,
  deleteMeaning,
  deleteMemoryHook,
  saveToMyWords,
  isMyWordSaved,
  initialSelectedMeaning,
  initialSelectedMemoryHook,
  userId,
}: Props) {
  const [activeTab, setActiveTab] = useState<"wordSetting" | "meanings" | "memoryHooks">(
    "wordSetting"
  );

  const [meanings, setMeanings] = useState<Meaning[]>(() =>
    sortOwnFirst(initialMeanings, userId, "meaning_id")
  );
  const [memoryHooks, setMemoryHooks] = useState<MemoryHook[]>(() =>
    sortOwnFirst(initialMemoryHooks, userId, "memory_hook_id")
  );

  const [selectedMeaning, setSelectedMeaning] = useState<Meaning | null>(
    initialSelectedMeaning
  );
  const [selectedMemoryHook, setSelectedMemoryHook] = useState<MemoryHook | null>(
    initialSelectedMemoryHook
  );

  const [showCreateMeaningModal, setShowCreateMeaningModal] = useState(false);
  const [showCreateMemoryHookModal, setShowCreateMemoryHookModal] = useState(false);
  const [editMeaning, setEditMeaning] = useState<Meaning | null>(null);
  const [editMemoryHook, setEditMemoryHook] = useState<MemoryHook | null>(null);
  const [deleteMeaningTarget, setDeleteMeaningTarget] = useState<Meaning | null>(null);
  const [deleteMemoryHookTarget, setDeleteMemoryHookTarget] = useState<MemoryHook | null>(null);

  const [addMessage, setAddMessage] = useState("");

  // 「My単語帳に追加」ボタン押下
  const handleSaveToMyWords = async () => {
    if (!selectedMeaning) return;
    try {
      await saveToMyWords(
        selectedMeaning.meaning_id,
        selectedMemoryHook ? selectedMemoryHook.memory_hook_id : null
      );
      setAddMessage("保存しました！");
      setTimeout(() => setAddMessage(""), 3000);
    } catch (err) {
      console.error(err);
      alert(String(err));
    }
  };

  return (
    <div className="mt-4">
      {/* タブ切り替え */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 border rounded ${activeTab === "wordSetting" ? "bg-blue-200" : ""}`}
          onClick={() => setActiveTab("wordSetting")}
        >
          単語設定
        </button>
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

      {/* タブ内容：単語設定 */}
      {activeTab === "wordSetting" && (
        <WordSettingTab
          wordParam={wordParam}
          selectedMeaning={selectedMeaning}
          selectedMemoryHook={selectedMemoryHook}
          onClearMemoryHook={() => setSelectedMemoryHook(null)}
          onAddToMyWords={handleSaveToMyWords}
          addMessage={addMessage}
          isMyWordSaved={isMyWordSaved}
        />
      )}

      {/* タブ内容：意味一覧 */}
      {activeTab === "meanings" && (
        <div className="border p-4">
          <h2 className="text-lg font-bold mb-2">意味一覧</h2>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
            onClick={() => setShowCreateMeaningModal(true)}
          >
            意味の新規作成
          </button>

          {showCreateMeaningModal && (
            <TextFormModal
              title="意味を新規作成"
              word={wordParam}
              placeholder="意味を入力"
              initialIsPublic={true}
              onSave={async (text, isPublic) => {
                const { newMeaning } = await createMeaning(wordParam, text, isPublic, userId);
                setMeanings((prev) =>
                  sortOwnFirst([...prev, newMeaning], userId, "meaning_id")
                );
                setSelectedMeaning(newMeaning);
              }}
              onClose={() => setShowCreateMeaningModal(false)}
            />
          )}

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-16">No</th>
                <th className="border p-2">意味</th>
                <th className="border p-2 w-24">公開?</th>
                <th className="border p-2 w-24">編集</th>
                <th className="border p-2 w-24">削除</th>
              </tr>
            </thead>
            <tbody>
              {meanings.map((m, idx) => {
                const isSelected = selectedMeaning?.meaning_id === m.meaning_id;
                return (
                  <tr
                    key={m.meaning_id}
                    className={`cursor-pointer ${isSelected ? "bg-blue-100" : "hover:bg-gray-50"}`}
                    onClick={() => setSelectedMeaning(m)}
                  >
                    <td className="border p-2 text-center">{idx + 1}</td>
                    <td className="border p-2">
                      {m.meaning}
                      {m.user_id === userId && <span className="text-red-500 ml-1">★</span>}
                    </td>
                    <td className="border p-2 text-center">{m.is_public ? "公開" : "非公開"}</td>
                    <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button className="px-2 py-1 bg-yellow-300 rounded" onClick={() => setEditMeaning(m)}>
                        編集
                      </button>
                    </td>
                    <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="px-2 py-1 bg-red-300 rounded"
                        onClick={() => {
                          setDeleteMeaningTarget(m);
                          if (selectedMeaning?.meaning_id === m.meaning_id) {
                            setSelectedMeaning(null);
                          }
                        }}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* タブ内容：記憶hook一覧 */}
      {activeTab === "memoryHooks" && (
        <div className="border p-4">
          <h2 className="text-lg font-bold mb-2">記憶hook一覧</h2>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
            onClick={() => setShowCreateMemoryHookModal(true)}
          >
            記憶hookの新規作成
          </button>

          {showCreateMemoryHookModal && (
            <TextFormModal
              title="記憶hookを新規作成"
              word={wordParam}
              placeholder="記憶hookを入力"
              initialIsPublic={true}
              onSave={async (text, isPublic) => {
                const { newMemoryHook } = await createMemoryHook(wordParam, text, isPublic, userId);
                setMemoryHooks((prev) =>
                  sortOwnFirst([...prev, newMemoryHook], userId, "memory_hook_id")
                );
                setSelectedMemoryHook(newMemoryHook);
              }}
              onClose={() => setShowCreateMemoryHookModal(false)}
            />
          )}

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-16">No</th>
                <th className="border p-2">記憶hook</th>
                <th className="border p-2 w-24">公開?</th>
                <th className="border p-2 w-24">編集</th>
                <th className="border p-2 w-24">削除</th>
              </tr>
            </thead>
            <tbody>
              {memoryHooks.map((h, idx) => {
                const isSelected = selectedMemoryHook?.memory_hook_id === h.memory_hook_id;
                return (
                  <tr
                    key={h.memory_hook_id}
                    className={`cursor-pointer ${isSelected ? "bg-blue-100" : "hover:bg-gray-50"}`}
                    onClick={() => setSelectedMemoryHook(h)}
                  >
                    <td className="border p-2 text-center">{idx + 1}</td>
                    <td className="border p-2">
                      {h.memory_hook}
                      {h.user_id === userId && <span className="text-red-500 ml-1">★</span>}
                    </td>
                    <td className="border p-2 text-center">{h.is_public ? "公開" : "非公開"}</td>
                    <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button className="px-2 py-1 bg-yellow-300 rounded" onClick={() => setEditMemoryHook(h)}>
                        編集
                      </button>
                    </td>
                    <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="px-2 py-1 bg-red-300 rounded"
                        onClick={() => {
                          setDeleteMemoryHookTarget(h);
                          if (selectedMemoryHook?.memory_hook_id === h.memory_hook_id) {
                            setSelectedMemoryHook(null);
                          }
                        }}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 編集／削除用モーダル */}
      {editMeaning && (
        <TextFormModal
          title="意味を編集"
          word={wordParam}
          initialText={editMeaning.meaning}
          placeholder="意味を入力"
          initialIsPublic={editMeaning.is_public}
          onSave={async (text, isPublic) => {
            const updated = await updateMeaning(editMeaning.meaning_id, text, isPublic);
            setMeanings((prev) =>
              prev.map((m) => (m.meaning_id === updated.meaning_id ? updated : m))
            );
          }}
          onClose={() => setEditMeaning(null)}
        />
      )}
      {deleteMeaningTarget && (
        <ConfirmModal
          message={`「${wordParam}」の意味を削除しますか？`}
          onConfirm={async () => {
            await deleteMeaning(deleteMeaningTarget.meaning_id);
            setMeanings((prev) =>
              prev.filter((m) => m.meaning_id !== deleteMeaningTarget.meaning_id)
            );
          }}
          onClose={() => setDeleteMeaningTarget(null)}
        />
      )}
      {editMemoryHook && (
        <TextFormModal
          title="記憶hookを編集"
          word={wordParam}
          initialText={editMemoryHook.memory_hook}
          placeholder="記憶hookを入力"
          initialIsPublic={editMemoryHook.is_public}
          onSave={async (text, isPublic) => {
            const updated = await updateMemoryHook(editMemoryHook.memory_hook_id, text, isPublic);
            setMemoryHooks((prev) =>
              prev.map((h) => (h.memory_hook_id === updated.memory_hook_id ? updated : h))
            );
          }}
          onClose={() => setEditMemoryHook(null)}
        />
      )}
      {deleteMemoryHookTarget && (
        <ConfirmModal
          message={`「${wordParam}」の記憶hookを削除しますか？`}
          onConfirm={async () => {
            await deleteMemoryHook(deleteMemoryHookTarget.memory_hook_id);
            setMemoryHooks((prev) =>
              prev.filter((h) => h.memory_hook_id !== deleteMemoryHookTarget.memory_hook_id)
            );
          }}
          onClose={() => setDeleteMemoryHookTarget(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// WordSettingTab コンポーネント
// ─────────────────────────────────────────────────────
function WordSettingTab({
  wordParam,
  selectedMeaning,
  selectedMemoryHook,
  onClearMemoryHook,
  onAddToMyWords,
  addMessage,
  isMyWordSaved,
}: {
  wordParam: string;
  selectedMeaning: Meaning | null;
  selectedMemoryHook: MemoryHook | null;
  onClearMemoryHook: () => void;
  onAddToMyWords: () => Promise<void>;
  addMessage: string;
  isMyWordSaved: boolean;
}) {
  return (
    <div className="bg-white shadow-md rounded p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">単語設定</h2>
      <div className="mb-4">
        <span className="font-semibold">単語:</span> {wordParam}
      </div>
      <div className="mb-4">
        <span className="font-semibold">意味:</span>{" "}
        {selectedMeaning ? selectedMeaning.meaning : "なし"}
      </div>
      <div className="mb-4 flex items-center">
        <span className="font-semibold">記憶hook:</span>
        {selectedMemoryHook ? (
          <div className="ml-2 flex items-center">
            <span>{selectedMemoryHook.memory_hook}</span>
            <button
              onClick={onClearMemoryHook}
              className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
            >
              解除
            </button>
          </div>
        ) : (
          <span className="ml-2">なし</span>
        )}
      </div>
      <button
        onClick={onAddToMyWords}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
      >
        {isMyWordSaved ? "更新する" : "My単語帳に追加"}
      </button>
      {addMessage && <p className="mt-2 text-green-600">{addMessage}</p>}
      <p className="text-gray-500 mt-2 text-sm">
        ※意味が選択されていないと押せない仕様（将来実装予定）
      </p>
    </div>
  );
}

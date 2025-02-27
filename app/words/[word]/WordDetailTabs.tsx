"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Word, Meaning, MemoryHook } from "@prisma/client";
import TextFormModal from "@/components/TextFormModal";
import DeleteModal from "@/components/DeleteModal";
import OperationButtons from "@/components/OperationButtons";
import toast from "react-hot-toast";

// 拡張型：作成者情報を含む Meaning と MemoryHook の型
type MeaningWithUser = Meaning & {
  user: {
    profile_image: string | null;
    nickname: string | null;
  };
};

type MemoryHookWithUser = MemoryHook & {
  user: {
    profile_image: string | null;
    nickname: string | null;
  };
};

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
  initialMeanings: MeaningWithUser[];
  initialMemoryHooks: MemoryHookWithUser[];
  createMeaning: (
    wordInput: string,
    meaningText: string,
    isPublic: boolean,
    userId: string
  ) => Promise<{ newMeaning: MeaningWithUser; wordRec: Word }>;
  createMemoryHook: (
    wordInput: string,
    hookText: string,
    isPublic: boolean,
    userId: string
  ) => Promise<{ newMemoryHook: MemoryHookWithUser; wordRec: Word }>;
  saveToMyWords: (
    meaning_id: number,
    memory_hook_id: number | null
  ) => Promise<void>;
  isMyWordSaved: boolean;
  initialSelectedMeaning: MeaningWithUser | null;
  initialSelectedMemoryHook: MemoryHookWithUser | null;
  userId: string;
};

export default function WordDetailTabs({
  wordParam,
  initialMeanings,
  initialMemoryHooks,
  createMeaning,
  createMemoryHook,
  saveToMyWords,
  isMyWordSaved,
  initialSelectedMeaning,
  initialSelectedMemoryHook,
  userId,
}: Props) {
  const router = useRouter();

  const [editMessage, setEditMessage] = useState("");

  const [activeTab, setActiveTab] = useState<"wordSetting" | "meanings" | "memoryHooks">("wordSetting");

  const [meanings, setMeanings] = useState<MeaningWithUser[]>(() =>
    sortOwnFirst(initialMeanings, userId, "meaning_id")
  );
  const [memoryHooks, setMemoryHooks] = useState<MemoryHookWithUser[]>(() =>
    sortOwnFirst(initialMemoryHooks, userId, "memory_hook_id")
  );

  const [selectedMeaning, setSelectedMeaning] = useState<MeaningWithUser | null>(
    initialSelectedMeaning
  );
  const [selectedMemoryHook, setSelectedMemoryHook] = useState<MemoryHookWithUser | null>(
    initialSelectedMemoryHook
  );

  const [showCreateMeaningModal, setShowCreateMeaningModal] = useState(false);
  const [showCreateMemoryHookModal, setShowCreateMemoryHookModal] = useState(false);
  const [editMeaning, setEditMeaning] = useState<MeaningWithUser | null>(null);
  const [editMemoryHook, setEditMemoryHook] = useState<MemoryHookWithUser | null>(null);

  const [deleteMeaningTarget, setDeleteMeaningTarget] = useState<MeaningWithUser | null>(null);
  const [deleteMemoryHookTarget, setDeleteMemoryHookTarget] = useState<MemoryHookWithUser | null>(null);

  const handleSaveToMyWords = async () => {
    if (!selectedMeaning) return;
    try {
      await saveToMyWords(
        selectedMeaning.meaning_id,
        selectedMemoryHook ? selectedMemoryHook.memory_hook_id : null
      );
      router.push("/my-words?saved=1");
    } catch (err) {
      console.error(err);
      alert(String(err));
    }
  };

  // 更新処理：API経由
  const handleMeaningUpdate = async (text: string, isPublic: boolean) => {
    const res = await fetch("/api/meaning/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meaning_id: editMeaning?.meaning_id, meaningText: text, isPublic }),
    });
    if (!res.ok) {
      throw new Error("意味の更新に失敗しました");
    }
    const data = await res.json();
    setMeanings((prev) =>
      prev.map((m) =>
        m.meaning_id === data.updated.meaning_id ? { ...m, ...data.updated } : m
      )
    );
    toast.success("編集しました！");
    setEditMeaning(null);
  };

  const handleMemoryHookUpdate = async (text: string, isPublic: boolean) => {
    const res = await fetch("/api/memoryHook/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory_hook_id: editMemoryHook?.memory_hook_id, hookText: text, isPublic }),
    });
    if (!res.ok) {
      throw new Error("記憶hookの更新に失敗しました");
    }
    const data = await res.json();
    setMemoryHooks((prev) =>
      prev.map((h) =>
        h.memory_hook_id === data.updated.memory_hook_id ? { ...h, ...data.updated } : h
      )
    );
    toast.success("編集しました！");
    setEditMemoryHook(null);
  };

  // 削除処理：API経由
  const handleDeleteMeaning = async (meaningId: number) => {
    const res = await fetch("/api/meaning/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meaning_id: meaningId }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "意味の削除に失敗しました");
    }
    setMeanings((prev) => prev.filter((m) => m.meaning_id !== meaningId));
    toast.success("削除しました！");
  };

  const handleDeleteMemoryHook = async (memoryHookId: number) => {
    const res = await fetch("/api/memoryHook/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory_hook_id: memoryHookId }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "記憶hookの削除に失敗しました");
    }
    setMemoryHooks((prev) => prev.filter((h) => h.memory_hook_id !== memoryHookId));
    toast.success("削除しました！");
  };

  return (
    <div className="mt-4">
      {editMessage && (
        <div className="mb-4 p-2 bg-green-200 text-green-800 rounded">
          {editMessage}
        </div>
      )}
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

      {activeTab === "wordSetting" && (
        <WordSettingTab
          wordParam={wordParam}
          selectedMeaning={selectedMeaning}
          selectedMemoryHook={selectedMemoryHook}
          onClearMemoryHook={() => setSelectedMemoryHook(null)}
          onAddToMyWords={handleSaveToMyWords}
          addMessage={""}
          isMyWordSaved={isMyWordSaved}
        />
      )}

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
                setMeanings((prev) => sortOwnFirst([...prev, newMeaning], userId, "meaning_id"));
                setSelectedMeaning(newMeaning);
              }}
              onClose={() => setShowCreateMeaningModal(false)}
            />
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-16">No</th>
                <th className="border p-2 w-32">作成者</th>
                <th className="border p-2">意味</th>
                <th className="border p-2 w-24">公開?</th>
                <th className="border p-2 w-24">操作</th>
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
                      {m.user && (
                        <div className="flex items-center gap-1">
                          <span className="text-red-500">{m.user_id === userId ? "★" : ""}</span>
                          <img
                            src={m.user.profile_image || "/default-avatar.png"}
                            alt="User Icon"
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{m.user.nickname || "No Name"}</span>
                        </div>
                      )}
                    </td>
                    <td className="border p-2">{m.meaning}</td>
                    <td className="border p-2 text-center">{m.is_public ? "公開" : "非公開"}</td>
                    <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      {m.user_id === userId && (
                        <OperationButtons
                          onEdit={() => setEditMeaning(m)}
                          onDelete={() => {
                            setDeleteMeaningTarget(m);
                            if (selectedMeaning?.meaning_id === m.meaning_id) {
                              setSelectedMeaning(null);
                            }
                          }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "memoryHooks" && (
        <div className="border p-4">
          <h2 className="text-lg font-bold mb-2">記憶hook一覧</h2>
          <div className="flex items-center gap-2 mb-4">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => setShowCreateMemoryHookModal(true)}
            >
              記憶hookの新規作成
            </button>
            <button
              className="px-4 py-2 bg-gray-300 text-black rounded"
              onClick={() => setSelectedMemoryHook(null)}
            >
              解除
            </button>
          </div>
          {showCreateMemoryHookModal && (
            <TextFormModal
              title="記憶hookを新規作成"
              word={wordParam}
              placeholder="記憶hookを入力"
              initialIsPublic={true}
              onSave={async (text, isPublic) => {
                const { newMemoryHook } = await createMemoryHook(wordParam, text, isPublic, userId);
                setMemoryHooks((prev) => sortOwnFirst([...prev, newMemoryHook], userId, "memory_hook_id"));
                setSelectedMemoryHook(newMemoryHook);
              }}
              onClose={() => setShowCreateMemoryHookModal(false)}
            />
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-16">No</th>
                <th className="border p-2 w-32">作成者</th>
                <th className="border p-2">記憶hook</th>
                <th className="border p-2 w-24">公開?</th>
                <th className="border p-2 w-24">操作</th>
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
                      {h.user && (
                        <div className="flex items-center gap-1">
                          <span className="text-red-500">{h.user_id === userId ? "★" : ""}</span>
                          <img
                            src={h.user.profile_image || "/default-avatar.png"}
                            alt="User Icon"
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{h.user.nickname || "No Name"}</span>
                        </div>
                      )}
                    </td>
                    <td className="border p-2">{h.memory_hook}</td>
                    <td className="border p-2 text-center">{h.is_public ? "公開" : "非公開"}</td>
                    <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      {h.user_id === userId && (
                        <OperationButtons
                          onEdit={() => setEditMemoryHook(h)}
                          onDelete={() => {
                            setDeleteMemoryHookTarget(h);
                            if (selectedMemoryHook?.memory_hook_id === h.memory_hook_id) {
                              setSelectedMemoryHook(null);
                            }
                          }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editMeaning && (
        <TextFormModal
          title="意味を編集"
          word={wordParam}
          initialText={editMeaning.meaning}
          placeholder="意味を入力"
          initialIsPublic={editMeaning.is_public}
          onSave={handleMeaningUpdate}
          onClose={() => setEditMeaning(null)}
        />
      )}
      {deleteMeaningTarget && (
        <DeleteModal
          message={`本当に「${wordParam}」の意味を削除しますか？`}
          onConfirm={async () => {
            try {
              await handleDeleteMeaning(deleteMeaningTarget.meaning_id);
              setMeanings((prev) =>
                prev.filter((m) => m.meaning_id !== deleteMeaningTarget.meaning_id)
              );
            } catch (error) {
              console.log(error);
              toast.error(error instanceof Error ? error.message : "削除に失敗しました");
            }
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
          onSave={handleMemoryHookUpdate}
          onClose={() => setEditMemoryHook(null)}
        />
      )}
      {deleteMemoryHookTarget && (
        <DeleteModal
          message={`本当に「${wordParam}」の記憶hookを削除しますか？`}
          onConfirm={async () => {
            try {
              await handleDeleteMemoryHook(deleteMemoryHookTarget.memory_hook_id);
              setMemoryHooks((prev) =>
                prev.filter((h) => h.memory_hook_id !== deleteMemoryHookTarget.memory_hook_id)
              );
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
        {isMyWordSaved ? "My単語帳へ更新" : "My単語帳に追加"}
      </button>
      {addMessage && <p className="mt-2 text-green-600">{addMessage}</p>}
      <p className="text-gray-500 mt-2 text-sm">
        ※意味が選択されていないと押せない仕様（将来実装予定）
      </p>
    </div>
  );
}

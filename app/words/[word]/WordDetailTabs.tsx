"use client";

import { useState } from "react";
import type { Word, Meaning, MemoryHook } from "@prisma/client";

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
  wordRecord: Word | null;
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
    isPublic: boolean,
    userId: string
  ) => Promise<Meaning>;
  updateMemoryHook: (
    memoryHookId: number,
    hookText: string,
    isPublic: boolean,
    userId: string
  ) => Promise<MemoryHook>;
  deleteMeaning: (meaningId: number, userId: string) => Promise<Meaning>;
  deleteMemoryHook: (memoryHookId: number, userId: string) => Promise<MemoryHook>;
  userId: string;
};

// ────────────── モーダルベース ──────────────
function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  const handleBackdropClick = () => onClose();
  const handleModalContentClick = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-4 rounded shadow-md" onClick={handleModalContentClick}>
        {children}
      </div>
    </div>
  );
}

// ────────────── 意味新規作成フォーム ──────────────
function MeaningModalForm({
  onClose,
  onCreateMeaning,
  wordParam,
}: {
  onClose: () => void;
  onCreateMeaning: (meaningText: string, isPublic: boolean) => Promise<void>;
  wordParam: string;
}) {
  const [meaningText, setMeaningText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async () => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      await onCreateMeaning(meaningText, isPublic);
      setSuccessMsg("作成しました！");
      setTimeout(() => onClose(), 800);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message || "DBエラーが発生しました。" : "不明なエラーが発生しました。");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">意味を新規作成 (単語: {wordParam})</h2>
      {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
      {successMsg && <p className="text-green-500 mb-2">{successMsg}</p>}
      <textarea
        className="border w-full p-2 mb-2"
        rows={3}
        value={meaningText}
        onChange={(e) => setMeaningText(e.target.value)}
        placeholder="意味を入力"
      />
      <div className="mb-2">
        <label className="mr-2">公開設定:</label>
        <select
          value={isPublic ? "public" : "private"}
          onChange={(e) => setIsPublic(e.target.value === "public")}
        >
          <option value="public">公開</option>
          <option value="private">非公開</option>
        </select>
      </div>
      <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded mr-2">
        保存
      </button>
      <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
        キャンセル
      </button>
    </div>
  );
}

/** 意味編集フォーム */
function MeaningEditModalForm({
  onClose,
  onUpdateMeaning,
  initialMeaning,
  wordParam,
}: {
  onClose: () => void;
  onUpdateMeaning: (meaningText: string, isPublic: boolean) => Promise<void>;
  initialMeaning: Meaning;
  wordParam: string;
}) {
  const [meaningText, setMeaningText] = useState(initialMeaning.meaning);
  const [isPublic, setIsPublic] = useState(initialMeaning.is_public);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async () => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      await onUpdateMeaning(meaningText, isPublic);
      setSuccessMsg("更新しました！");
      setTimeout(() => onClose(), 800);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message || "DBエラーが発生しました。" : "不明なエラーが発生しました。");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">意味を編集 (単語: {wordParam})</h2>
      {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
      {successMsg && <p className="text-green-500 mb-2">{successMsg}</p>}
      <textarea
        className="border w-full p-2 mb-2"
        rows={3}
        value={meaningText}
        onChange={(e) => setMeaningText(e.target.value)}
      />
      <div className="mb-2">
        <label className="mr-2">公開設定:</label>
        <select
          value={isPublic ? "public" : "private"}
          onChange={(e) => setIsPublic(e.target.value === "public")}
        >
          <option value="public">公開</option>
          <option value="private">非公開</option>
        </select>
      </div>
      <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded mr-2">
        保存
      </button>
      <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
        キャンセル
      </button>
    </div>
  );
}

/** 意味削除モーダル */
function MeaningDeleteModal({
  onClose,
  onDelete,
  wordParam,
}: {
  onClose: () => void;
  onDelete: () => Promise<void>;
  wordParam: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-2">「{wordParam}」の意味を削除しますか？</h2>
      <button
        onClick={async () => {
          await onDelete();
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
  );
}

/** 記憶hook新規作成フォーム */
function MemoryHookModalForm({
  onClose,
  onCreateHook,
  wordParam,
}: {
  onClose: () => void;
  onCreateHook: (hookText: string, isPublic: boolean) => Promise<void>;
  wordParam: string;
}) {
  const [hookText, setHookText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async () => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      await onCreateHook(hookText, isPublic);
      setSuccessMsg("作成しました！");
      setTimeout(() => onClose(), 800);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message || "DBエラーが発生しました。" : "不明なエラーが発生しました。");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">記憶hookを新規作成 (単語: {wordParam})</h2>
      {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
      {successMsg && <p className="text-green-500 mb-2">{successMsg}</p>}
      <textarea
        className="border w-full p-2 mb-2"
        rows={3}
        value={hookText}
        onChange={(e) => setHookText(e.target.value)}
        placeholder="記憶hookを入力"
      />
      <div className="mb-2">
        <label className="mr-2">公開設定:</label>
        <select
          value={isPublic ? "public" : "private"}
          onChange={(e) => setIsPublic(e.target.value === "public")}
        >
          <option value="public">公開</option>
          <option value="private">非公開</option>
        </select>
      </div>
      <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded mr-2">
        保存
      </button>
      <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
        キャンセル
      </button>
    </div>
  );
}

/** 記憶hook編集フォーム */
function MemoryHookEditModalForm({
  onClose,
  onUpdateHook,
  initialHook,
  wordParam,
}: {
  onClose: () => void;
  onUpdateHook: (hookText: string, isPublic: boolean) => Promise<void>;
  initialHook: MemoryHook;
  wordParam: string;
}) {
  const [hookText, setHookText] = useState(initialHook.memory_hook);
  const [isPublic, setIsPublic] = useState(initialHook.is_public);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async () => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      await onUpdateHook(hookText, isPublic);
      setSuccessMsg("更新しました！");
      setTimeout(() => onClose(), 800);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message || "DBエラーが発生しました。" : "不明なエラーが発生しました。");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">記憶hookを編集 (単語: {wordParam})</h2>
      {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
      {successMsg && <p className="text-green-500 mb-2">{successMsg}</p>}
      <textarea
        className="border w-full p-2 mb-2"
        rows={3}
        value={hookText}
        onChange={(e) => setHookText(e.target.value)}
      />
      <div className="mb-2">
        <label className="mr-2">公開設定:</label>
        <select
          value={isPublic ? "public" : "private"}
          onChange={(e) => setIsPublic(e.target.value === "public")}
        >
          <option value="public">公開</option>
          <option value="private">非公開</option>
        </select>
      </div>
      <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded mr-2">
        保存
      </button>
      <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
        キャンセル
      </button>
    </div>
  );
}

/** 記憶hook削除モーダル */
function MemoryHookDeleteModal({
  onClose,
  onDelete,
  wordParam,
}: {
  onClose: () => void;
  onDelete: () => Promise<void>;
  wordParam: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-2">「{wordParam}」の記憶hookを削除しますか？</h2>
      <button
        onClick={async () => {
          await onDelete();
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
  );
}

/** 単語設定タブ（選択結果表示・記憶hook解除ボタン付き・デザイン改善） */
function WordSettingTab({
  wordRecord,
  selectedMeaning,
  selectedMemoryHook,
  onClearMemoryHook,
}: {
  wordRecord: Word | null;
  selectedMeaning: Meaning | null;
  selectedMemoryHook: MemoryHook | null;
  onClearMemoryHook: () => void;
}) {
  const displayedWord = wordRecord?.word ?? "(未登録)";
  return (
    <div className="bg-white shadow-md rounded p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">単語設定</h2>
      <div className="mb-4">
        <span className="font-semibold">単語:</span> {displayedWord}
      </div>
      <div className="mb-4">
        <span className="font-semibold">意味:</span> {selectedMeaning ? selectedMeaning.meaning : "なし"}
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
      <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded opacity-50 cursor-not-allowed" disabled>
        My単語帳に追加
      </button>
      <p className="text-gray-500 mt-2 text-sm">
        ※意味が選択されていないと押せない仕様（将来実装予定）
      </p>
    </div>
  );
}

/** 意味一覧タブ */
function MeaningsTab({
  wordParam,
  meanings,
  setMeanings,
  createMeaning,
  userId,
  onEditMeaning,
  onDeleteMeaning,
  onSelectMeaning,
  selectedMeaning,
}: {
  wordParam: string;
  meanings: Meaning[];
  setMeanings: React.Dispatch<React.SetStateAction<Meaning[]>>;
  createMeaning: (
    wordInput: string,
    meaningText: string,
    isPublic: boolean,
    userId: string
  ) => Promise<{ newMeaning: Meaning; wordRec: Word }>;
  userId: string;
  onEditMeaning: (m: Meaning) => void;
  onDeleteMeaning: (m: Meaning) => void;
  onSelectMeaning: (m: Meaning | null) => void;
  selectedMeaning: Meaning | null;
}) {
  const [showModal, setShowModal] = useState(false);

  const handleCreateMeaning = async (meaningText: string, isPublic: boolean) => {
    const { newMeaning } = await createMeaning(wordParam, meaningText, isPublic, userId);
    setMeanings((prev) => {
      const next = [...prev, newMeaning];
      return sortOwnFirst(next, userId, "meaning_id");
    });
  };

  return (
    <div className="border p-4">
      <h2 className="text-lg font-bold mb-2">意味一覧</h2>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
        onClick={() => setShowModal(true)}
      >
        意味の新規作成
      </button>
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <MeaningModalForm onClose={() => setShowModal(false)} onCreateMeaning={handleCreateMeaning} wordParam={wordParam} />
        </Modal>
      )}
      {meanings.length === 0 ? (
        <p>意味がありません</p>
      ) : (
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
              const isMyItem = m.user_id === userId;
              const isSelected = selectedMeaning ? selectedMeaning.meaning_id === m.meaning_id : false;
              return (
                <tr
                  key={m.meaning_id}
                  className={`cursor-pointer ${isSelected ? "bg-blue-100" : "hover:bg-gray-50"}`}
                  onClick={() => onSelectMeaning(isSelected ? null : m)}
                >
                  <td className="border p-2 text-center">{idx + 1}</td>
                  <td className="border p-2">
                    {m.meaning}
                    {isMyItem && <span className="text-red-500 ml-1">★</span>}
                  </td>
                  <td className="border p-2 text-center">{m.is_public ? "公開" : "非公開"}</td>
                  <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
                    {isMyItem && (
                      <button className="px-2 py-1 bg-yellow-300 rounded" onClick={() => onEditMeaning(m)}>
                        編集
                      </button>
                    )}
                  </td>
                  <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
                    {isMyItem && (
                      <button className="px-2 py-1 bg-red-300 rounded" onClick={() => onDeleteMeaning(m)}>
                        削除
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** 記憶hookタブ */
function MemoryHooksTab({
  wordParam,
  memoryHooks,
  setMemoryHooks,
  createMemoryHook,
  userId,
  onEditMemoryHook,
  onDeleteMemoryHook,
  onSelectMemoryHook,
  selectedMemoryHook,
}: {
  wordParam: string;
  memoryHooks: MemoryHook[];
  setMemoryHooks: React.Dispatch<React.SetStateAction<MemoryHook[]>>;
  createMemoryHook: (
    wordInput: string,
    hookText: string,
    isPublic: boolean,
    userId: string
  ) => Promise<{ newMemoryHook: MemoryHook; wordRec: Word }>;
  userId: string;
  onEditMemoryHook: (h: MemoryHook) => void;
  onDeleteMemoryHook: (h: MemoryHook) => void;
  onSelectMemoryHook: (h: MemoryHook | null) => void;
  selectedMemoryHook: MemoryHook | null;
}) {
  const [showModal, setShowModal] = useState(false);

  const handleCreateHook = async (hookText: string, isPublic: boolean) => {
    const { newMemoryHook } = await createMemoryHook(wordParam, hookText, isPublic, userId);
    setMemoryHooks((prev) => {
      const next = [...prev, newMemoryHook];
      return sortOwnFirst(next, userId, "memory_hook_id");
    });
  };

  return (
    <div className="border p-4">
      <h2 className="text-lg font-bold mb-2">記憶hook一覧</h2>
      <button className="px-4 py-2 bg-blue-500 text-white rounded mb-4" onClick={() => setShowModal(true)}>
        記憶hookの新規作成
      </button>
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <MemoryHookModalForm onClose={() => setShowModal(false)} onCreateHook={handleCreateHook} wordParam={wordParam} />
        </Modal>
      )}
      {memoryHooks.length === 0 ? (
        <p>記憶hookがありません</p>
      ) : (
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
              const isMyItem = h.user_id === userId;
              const isSelected = selectedMemoryHook ? selectedMemoryHook.memory_hook_id === h.memory_hook_id : false;
              return (
                <tr
                  key={h.memory_hook_id}
                  className={`cursor-pointer ${isSelected ? "bg-blue-100" : "hover:bg-gray-50"}`}
                  onClick={() => onSelectMemoryHook(isSelected ? null : h)}
                >
                  <td className="border p-2 text-center">{idx + 1}</td>
                  <td className="border p-2">
                    {h.memory_hook}
                    {isMyItem && <span className="text-red-500 ml-1">★</span>}
                  </td>
                  <td className="border p-2 text-center">{h.is_public ? "公開" : "非公開"}</td>
                  <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
                    {isMyItem && (
                      <button className="px-2 py-1 bg-yellow-300 rounded" onClick={() => onEditMemoryHook(h)}>
                        編集
                      </button>
                    )}
                  </td>
                  <td className="border p-2 text-center" onClick={(e) => e.stopPropagation()}>
                    {isMyItem && (
                      <button className="px-2 py-1 bg-red-300 rounded" onClick={() => onDeleteMemoryHook(h)}>
                        削除
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** メインタブコンポーネント */
export default function WordDetailTabs({
  wordParam,
  wordRecord,
  initialMeanings,
  initialMemoryHooks,
  createMeaning,
  createMemoryHook,
  updateMeaning,
  updateMemoryHook,
  deleteMeaning,
  deleteMemoryHook,
  userId,
}: Props) {
  const [activeTab, setActiveTab] = useState<"wordSetting" | "meanings" | "memoryHooks">("wordSetting");

  // --- ロード時に自分の投稿が先頭になるようソート ---
  const [meanings, setMeanings] = useState<Meaning[]>(() =>
    sortOwnFirst(initialMeanings, userId, "meaning_id")
  );
  const [memoryHooks, setMemoryHooks] = useState<MemoryHook[]>(() =>
    sortOwnFirst(initialMemoryHooks, userId, "memory_hook_id")
  );

  // 編集・削除用モーダル表示
  const [editingMeaning, setEditingMeaning] = useState<Meaning | null>(null);
  const [deletingMeaning, setDeletingMeaning] = useState<Meaning | null>(null);
  const [editingMemoryHook, setEditingMemoryHook] = useState<MemoryHook | null>(null);
  const [deletingMemoryHook, setDeletingMemoryHook] = useState<MemoryHook | null>(null);

  // 選択された意味／記憶hook（意味は必須なので初期状態は一覧先頭、記憶hookは null）
  const [selectedMeaning, setSelectedMeaning] = useState<Meaning | null>(() =>
    initialMeanings.length > 0 ? sortOwnFirst(initialMeanings, userId, "meaning_id")[0] : null
  );
  const [selectedMemoryHook, setSelectedMemoryHook] = useState<MemoryHook | null>(null);

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

      {/* タブ内容 */}
      {activeTab === "wordSetting" && (
        <WordSettingTab
          wordRecord={wordRecord}
          selectedMeaning={selectedMeaning}
          selectedMemoryHook={selectedMemoryHook}
          onClearMemoryHook={() => setSelectedMemoryHook(null)}
        />
      )}
      {activeTab === "meanings" && (
        <MeaningsTab
          wordParam={wordParam}
          meanings={meanings}
          setMeanings={setMeanings}
          createMeaning={createMeaning}
          userId={userId}
          onEditMeaning={(m) => setEditingMeaning(m)}
          onDeleteMeaning={(m) => setDeletingMeaning(m)}
          onSelectMeaning={(m) => setSelectedMeaning(m)}
          selectedMeaning={selectedMeaning}
        />
      )}
      {activeTab === "memoryHooks" && (
        <MemoryHooksTab
          wordParam={wordParam}
          memoryHooks={memoryHooks}
          setMemoryHooks={setMemoryHooks}
          createMemoryHook={createMemoryHook}
          userId={userId}
          onEditMemoryHook={(h) => setEditingMemoryHook(h)}
          onDeleteMemoryHook={(h) => setDeletingMemoryHook(h)}
          onSelectMemoryHook={(h) => setSelectedMemoryHook(h)}
          selectedMemoryHook={selectedMemoryHook}
        />
      )}

      {/* 意味 編集モーダル */}
      {editingMeaning && (
        <Modal onClose={() => setEditingMeaning(null)}>
          <MeaningEditModalForm
            onClose={() => setEditingMeaning(null)}
            initialMeaning={editingMeaning}
            wordParam={wordParam}
            onUpdateMeaning={async (meaningText, isPublic) => {
              const updated = await updateMeaning(
                editingMeaning.meaning_id,
                meaningText,
                isPublic,
                userId
              );
              setMeanings((prev) =>
                prev.map((m) => (m.meaning_id === updated.meaning_id ? updated : m))
              );
            }}
          />
        </Modal>
      )}

      {/* 意味 削除モーダル */}
      {deletingMeaning && (
        <Modal onClose={() => setDeletingMeaning(null)}>
          <MeaningDeleteModal
            onClose={() => setDeletingMeaning(null)}
            wordParam={wordParam}
            onDelete={async () => {
              await deleteMeaning(deletingMeaning.meaning_id, userId);
              setMeanings((prev) =>
                prev.filter((m) => m.meaning_id !== deletingMeaning.meaning_id)
              );
            }}
          />
        </Modal>
      )}

      {/* 記憶hook 編集モーダル */}
      {editingMemoryHook && (
        <Modal onClose={() => setEditingMemoryHook(null)}>
          <MemoryHookEditModalForm
            onClose={() => setEditingMemoryHook(null)}
            initialHook={editingMemoryHook}
            wordParam={wordParam}
            onUpdateHook={async (hookText, isPublic) => {
              const updated = await updateMemoryHook(
                editingMemoryHook.memory_hook_id,
                hookText,
                isPublic,
                userId
              );
              setMemoryHooks((prev) =>
                prev.map((h) => (h.memory_hook_id === updated.memory_hook_id ? updated : h))
              );
            }}
          />
        </Modal>
      )}

      {/* 記憶hook 削除モーダル */}
      {deletingMemoryHook && (
        <Modal onClose={() => setDeletingMemoryHook(null)}>
          <MemoryHookDeleteModal
            onClose={() => setDeletingMemoryHook(null)}
            wordParam={wordParam}
            onDelete={async () => {
              await deleteMemoryHook(deletingMemoryHook.memory_hook_id, userId);
              setMemoryHooks((prev) =>
                prev.filter((h) => h.memory_hook_id !== deletingMemoryHook.memory_hook_id)
              );
            }}
          />
        </Modal>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Word, Meaning, MemoryHook } from "@prisma/client";
import { JSX } from 'react';
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
  userId: string;
};

// ────────────── モーダルベース ──────────────
function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}): JSX.Element {
  const handleBackdropClick = () => onClose();
  const handleModalContentClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white p-4 rounded shadow-md"
        onClick={handleModalContentClick}
      >
        {children}
      </div>
    </div>
  );
}

// ────────────── 意味作成用フォーム ──────────────
function MeaningModalForm({
  onClose,
  onCreateMeaning,
  wordParam,
  userId,
}: {
  onClose: () => void;
  onCreateMeaning: (meaningText: string, isPublic: boolean) => Promise<void>;
  wordParam: string;
  userId: string;
}): JSX.Element {
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
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message || "DBエラーが発生しました。");
      } else {
        setErrorMsg("不明なエラーが発生しました。");
      }
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">
        意味を新規作成 (単語: {wordParam})
      </h2>
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
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-green-500 text-white rounded mr-2"
      >
        保存
      </button>
      <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
        キャンセル
      </button>
    </div>
  );
}

// ────────────── 記憶hook作成用フォーム ──────────────
function MemoryHookModalForm({
  onClose,
  onCreateHook,
  wordParam,
  userId,
}: {
  onClose: () => void;
  onCreateHook: (hookText: string, isPublic: boolean) => Promise<void>;
  wordParam: string;
  userId: string;
}): JSX.Element {
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
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message || "DBエラーが発生しました。");
      } else {
        setErrorMsg("不明なエラーが発生しました。");
      }
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">
        記憶hookを新規作成 (単語: {wordParam})
      </h2>
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
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-green-500 text-white rounded mr-2"
      >
        保存
      </button>
      <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
        キャンセル
      </button>
    </div>
  );
}

// ────────────── メインのタブコンポーネント ──────────────
export default function WordDetailTabs({
  wordParam,
  wordRecord,
  initialMeanings,
  initialMemoryHooks,
  createMeaning,
  createMemoryHook,
  userId,
}: Props): JSX.Element {
  const [activeTab, setActiveTab] = useState<"wordSetting" | "meanings" | "memoryHooks">(
    "wordSetting"
  );

  // サーバーから受け取った初期一覧を useState に持つことで部分更新
  const [meanings, setMeanings] = useState<Meaning[]>(initialMeanings);
  const [memoryHooks, setMemoryHooks] = useState<MemoryHook[]>(initialMemoryHooks);

  return (
    <div className="mt-4">
      {/* タブ切り替えボタン */}
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

      {/* タブ内容の切り替え */}
      {activeTab === "wordSetting" && <WordSettingTab wordRecord={wordRecord} />}
      {activeTab === "meanings" && (
        <MeaningsTab
          wordParam={wordParam}
          meanings={meanings}
          setMeanings={setMeanings}
          createMeaning={createMeaning}
          userId={userId}
        />
      )}
      {activeTab === "memoryHooks" && (
        <MemoryHooksTab
          wordParam={wordParam}
          memoryHooks={memoryHooks}
          setMemoryHooks={setMemoryHooks}
          createMemoryHook={createMemoryHook}
          userId={userId}
        />
      )}
    </div>
  );
}

/** 単語設定タブ */
function WordSettingTab({ wordRecord }: { wordRecord: Word | null }): JSX.Element {
  const displayedWord = wordRecord?.word ?? "(未登録)";
  return (
    <div className="border p-4">
      <h2 className="text-lg font-bold mb-2">単語設定タブ</h2>
      <p>現在の単語: {displayedWord}</p>
      <p>選択された意味: まだ未実装（将来的に「意味一覧」で選んだものをここに反映）</p>
      <p className="mt-2">選択された記憶hook: まだ未実装</p>
      <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300" disabled>
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
}): JSX.Element {
  const [showModal, setShowModal] = useState(false);

  const handleCreateMeaning = async (meaningText: string, isPublic: boolean) => {
    const { newMeaning } = await createMeaning(wordParam, meaningText, isPublic, userId);
    setMeanings((prev) => [...prev, newMeaning]);
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
          <MeaningModalForm
            onClose={() => setShowModal(false)}
            onCreateMeaning={handleCreateMeaning}
            wordParam={wordParam}
            userId={userId}
          />
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
            </tr>
          </thead>
          <tbody>
            {meanings.map((m, idx) => (
              <tr key={m.meaning_id}>
                <td className="border p-2 text-center">{idx + 1}</td>
                <td className="border p-2">{m.meaning}</td>
                <td className="border p-2 text-center">
                  {m.is_public ? "公開" : "非公開"}
                </td>
                <td className="border p-2 text-center">
                  <button className="px-2 py-1 bg-yellow-300 rounded">編集</button>
                </td>
              </tr>
            ))}
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
}): JSX.Element {
  const [showModal, setShowModal] = useState(false);

  const handleCreateHook = async (hookText: string, isPublic: boolean) => {
    const { newMemoryHook } = await createMemoryHook(wordParam, hookText, isPublic, userId);
    setMemoryHooks((prev) => [...prev, newMemoryHook]);
  };

  return (
    <div className="border p-4">
      <h2 className="text-lg font-bold mb-2">記憶hook一覧</h2>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
        onClick={() => setShowModal(true)}
      >
        記憶hookの新規作成
      </button>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <MemoryHookModalForm
            onClose={() => setShowModal(false)}
            onCreateHook={handleCreateHook}
            wordParam={wordParam}
            userId={userId}
          />
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
            </tr>
          </thead>
          <tbody>
            {memoryHooks.map((h, idx) => (
              <tr key={h.memory_hook_id}>
                <td className="border p-2 text-center">{idx + 1}</td>
                <td className="border p-2">{h.memory_hook}</td>
                <td className="border p-2 text-center">
                  {h.is_public ? "公開" : "非公開"}
                </td>
                <td className="border p-2 text-center">
                  <button className="px-2 py-1 bg-yellow-300 rounded">編集</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

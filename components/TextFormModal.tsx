"use client";

import { useState } from "react";

export type TextFormModalProps = {
  title: string; // 例：「意味を新規作成」や「記憶hookを編集」
  word: string;  // URL上の単語（例："cat"）
  initialText?: string;
  placeholder: string;
  initialIsPublic: boolean;
  onSave: (text: string, isPublic: boolean) => Promise<void>;
  onClose: () => void;
};

export default function TextFormModal({
  title,
  word,
  initialText = "",
  placeholder,
  initialIsPublic,
  onSave,
  onClose,
}: TextFormModalProps) {
  const [text, setText] = useState(initialText);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async () => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      await onSave(text, isPublic);
      setSuccessMsg("保存しました！");
      // 3秒間成功メッセージを表示してからモーダルを閉じる
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 3000);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message || "DBエラーが発生しました。"
          : "不明なエラーが発生しました。"
      );
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-2">
          {title} (単語: {word})
        </h2>
        {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
        {successMsg && <p className="text-green-500 mb-2">{successMsg}</p>}
        <textarea
          className="border w-full p-2 mb-2"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
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
    </div>
  );
}

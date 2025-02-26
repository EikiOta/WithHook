// components/OperationButtons.tsx
// 一覧表の「操作」をひとまとめにしたコンポーネント
"use client";

type OperationButtonsProps = {
  onEdit: () => void;
  onDelete: () => void;
  editText?: string;
  deleteText?: string;
  disabled?: boolean;
};

export default function OperationButtons({
  onEdit,
  onDelete,
  editText = "編集",
  deleteText = "削除",
  disabled = false,
}: OperationButtonsProps) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <button
        onClick={onEdit}
        disabled={disabled}
        className="px-2 py-1 bg-yellow-300 rounded disabled:opacity-50"
      >
        {editText}
      </button>
      <button
        onClick={onDelete}
        disabled={disabled}
        className="px-2 py-1 bg-red-300 rounded disabled:opacity-50"
      >
        {deleteText}
      </button>
    </div>
  );
}

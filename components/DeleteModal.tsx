"use client";

import React from "react";

type DeleteModalProps = {
  message: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

export default function DeleteModal({ message, onConfirm, onClose }: DeleteModalProps) {
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

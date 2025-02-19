"use client";

import { useState } from "react";

// ▼ 短縮形の品詞マッピング（表示時に [名][動][形][副] のように使う）
const PART_OF_SPEECH_MAP: { [key: string]: string } = {
  n: "名",
  v: "動",
  adj: "形",
  adv: "副",
  noun: "名",
  verb: "動",
  adjective: "形",
  adverb: "副",
};

// Dictionary APIのレスポンス用インターフェース
interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: {
    definition: string;
  }[];
}

interface DictionaryEntry {
  word: string;
  meanings: DictionaryMeaning[];
}

// Datamuse APIのレスポンス用インターフェース
interface DatamuseWord {
  word: string;
  tags?: string[];
}

// ▼ 集約後の型: 1つの英単語に複数の品詞を持たせる
interface AggregatedResult {
  word: string;
  parts: string[]; // 例: ["n", "v", "adj"] など
}

export default function WordSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [aggregatedResults, setAggregatedResults] = useState<AggregatedResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPos, setSelectedPos] = useState<string>(""); // 品詞フィルタ用の状態（空文字の場合は全て）

  const RESULTS_PER_PAGE = 10; // 1ページあたりの表示件数

  // 単語検索処理
  const handleSearch = async () => {
    const query = searchTerm.trim();
    if (!query) {
      setAggregatedResults([]);
      return;
    }

    try {
      // Dictionary APIから完全一致検索を実施
      const dictResults: { word: string; pos: string }[] = [];
      const dictRes = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`
      );
      if (dictRes.ok) {
        const data = (await dictRes.json()) as DictionaryEntry[];
        data.forEach((entry: DictionaryEntry) => {
          if (entry.meanings) {
            entry.meanings.forEach((meaning: DictionaryMeaning) => {
              // Dictionary APIの品詞をコードに変換（例: "noun" → "n"）
              let posCode = meaning.partOfSpeech;
              if (posCode === "noun") posCode = "n";
              else if (posCode === "verb") posCode = "v";
              else if (posCode === "adjective") posCode = "adj";
              else if (posCode === "adverb") posCode = "adv";
              // 定義済みの品詞のみを対象とする
              if (PART_OF_SPEECH_MAP[posCode]) {
                const word = entry.word || query;
                // 同じ単語と品詞の重複を回避
                if (!dictResults.some((r) => r.word === word && r.pos === posCode)) {
                  dictResults.push({ word, pos: posCode });
                }
              }
            });
          }
        });
      }

      // Datamuse APIから前方一致の単語候補を取得（検索語で始まる単語）
      const suggestionResults: { word: string; pos: string }[] = [];
      const dmRes = await fetch(
        `https://api.datamuse.com/words?sp=${encodeURIComponent(query)}*&md=p`
      );
      if (dmRes.ok) {
        const data = (await dmRes.json()) as DatamuseWord[];
        data.forEach((item: DatamuseWord) => {
          const word = item.word;
          if (item.tags) {
            // item.tagsには複数の品詞コードが含まれる可能性がある
            item.tags.forEach((tag: string) => {
              if (tag === "n" || tag === "v" || tag === "adj" || tag === "adv") {
                // 定義済みの品詞のみを対象とする
                if (!suggestionResults.some((r) => r.word === word && r.pos === tag)) {
                  suggestionResults.push({ word, pos: tag });
                }
              }
            });
          }
        });
      }

      // Dictionary APIの結果とDatamuse APIの結果を統合（重複を避ける）
      const combinedResults: { word: string; pos: string }[] = [...dictResults];
      suggestionResults.forEach((s) => {
        if (!combinedResults.some((r) => r.word === s.word && r.pos === s.pos)) {
          combinedResults.push(s);
        }
      });

      // ▼ 同じ英単語に複数の品詞がある場合、まとめる
      const map = new Map<string, Set<string>>();
      combinedResults.forEach(({ word, pos }) => {
        if (!map.has(word)) {
          map.set(word, new Set());
        }
        map.get(word)?.add(pos);
      });

      // ▼ Mapから配列に変換: { word, parts: [ 'n', 'v', ... ] } の形式に
      const finalAggregatedResults: AggregatedResult[] = [];
      map.forEach((posSet, word) => {
        finalAggregatedResults.push({
          word,
          parts: Array.from(posSet), // Set → 配列
        });
      });

      // ▼ 結果を状態に保存し、ページをリセット
      setAggregatedResults(finalAggregatedResults);
      setCurrentPage(1);
    } catch (error) {
      console.error("データ取得中のエラー:", error);
      setAggregatedResults([]);
    }
  };

  // フォーム送信時の処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  // ▼ 品詞フィルタの適用
  // まとめられた品詞配列に対して、選択した品詞が含まれているかをチェック
  const filteredResults = selectedPos
    ? aggregatedResults.filter((item) => item.parts.includes(selectedPos))
    : aggregatedResults;

  // ページネーション：現在のページの結果を取得
  const indexOfLast = currentPage * RESULTS_PER_PAGE;
  const indexOfFirst = indexOfLast - RESULTS_PER_PAGE;
  const currentResults = filteredResults.slice(indexOfFirst, indexOfLast);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* タイトル */}
      <h1 className="text-2xl font-bold mb-4">英単語検索</h1>

      {/* 検索フォームと品詞フィルタをまとめてフォームにする */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="単語を入力"
          className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          検索
        </button>

        {/* 品詞フィルタ */}
        <select
          id="posFilter"
          value={selectedPos}
          onChange={(e) => {
            setSelectedPos(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value="">すべて</option>
          <option value="n">名詞</option>
          <option value="v">動詞</option>
          <option value="adj">形容詞</option>
          <option value="adv">副詞</option>
        </select>
      </form>

      {/* 総検索結果の表示 */}
      <div className="mb-6">
        <p className="text-gray-600">総検索結果: {filteredResults.length} 件</p>
      </div>

      {/* テーブル表示 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 w-16">No</th>
              <th className="border p-2 w-64">品詞</th>
              <th className="border p-2">英単語</th>
            </tr>
          </thead>
          <tbody>
            {currentResults.length === 0 ? (
              <tr>
                <td colSpan={3} className="border p-4 text-center text-gray-500">
                  検索結果が見つかりません。
                </td>
              </tr>
            ) : (
              currentResults.map((item, index) => (
                <tr key={item.word} className="hover:bg-blue-50">
                  <td className="border p-2 text-center">
                    {indexOfFirst + index + 1}
                  </td>
                  <td className="border p-2 whitespace-nowrap">
                    {/* 例: [名][動][形] のようにまとめて表示 */}
                    {item.parts
                      .map((pos) => `[${PART_OF_SPEECH_MAP[pos] ?? pos}]`)
                      .join("")}
                  </td>
                  <td className="border p-2">{item.word}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {filteredResults.length > RESULTS_PER_PAGE && (
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            前へ
          </button>
          <span>
            Page {currentPage} of {Math.ceil(filteredResults.length / RESULTS_PER_PAGE)}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, Math.ceil(filteredResults.length / RESULTS_PER_PAGE))
              )
            }
            disabled={currentPage === Math.ceil(filteredResults.length / RESULTS_PER_PAGE)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}

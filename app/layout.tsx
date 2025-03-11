// app/layout.tsx
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/Header";
import DeletedUserCheck from "@/components/DeletedUserCheck";

export const metadata = {
  title: "with-hook",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          {/* 削除状態チェックコンポーネント */}
          <DeletedUserCheck />
          {/* ヘッダー */}
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
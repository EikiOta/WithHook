// app/layout.tsx
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/Header";

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
          {/* ヘッダーもこの中に置く */}
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}

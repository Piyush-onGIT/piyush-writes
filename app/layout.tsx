import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Side Notes — Minimal Blog",
  description:
    "A sleek, file-backed blog that renders Markdown posts from the local content folder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${jetbrains.variable} antialiased`}>
        <div className="bg-gradient">
          <div className="bg-grid">{children}</div>
        </div>
      </body>
    </html>
  );
}

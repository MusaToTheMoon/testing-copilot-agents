import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EssayAI - AI-Powered Essay Writing",
  description: "Write better academic essays with AI assistance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}

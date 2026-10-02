import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Follow — Meeting action tracker",
  description: "Keep every meeting moving forward."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

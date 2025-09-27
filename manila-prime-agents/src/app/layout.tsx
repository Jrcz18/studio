
import type { Metadata } from "next";
import "./globals.css";
import { AppAuthProvider } from "@/hooks/use-auth";

export const metadata: Metadata = {
  title: "Manila Prime Agents",
  description: "Agent Portal for Manila Prime",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppAuthProvider>{children}</AppAuthProvider>
      </body>
    </html>
  );
}

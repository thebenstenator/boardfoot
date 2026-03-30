import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BoardFoot",
  description: "Woodworking project cost and BOM planner",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BoardFoot",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}

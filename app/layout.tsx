import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Springs Maintenance",
  description: "Work orders, schedules, assets and parts for The Springs Church",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Maintenance", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#1f7a73", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

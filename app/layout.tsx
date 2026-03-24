import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Camp Rotary Wi-Fi",
  description: "Guest Wi-Fi captive portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

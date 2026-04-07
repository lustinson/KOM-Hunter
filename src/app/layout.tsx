import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "KOM Hunter",
  description: "Analyze nearby Strava segments, estimate KOM power, and compare it against your recent power curve.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

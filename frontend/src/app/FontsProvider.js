'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function FontsProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <style jsx global>{`
      :root {
        ${geistSans.variable}: ${geistSans.style.fontFamily};
        ${geistMono.variable}: ${geistMono.style.fontFamily};
      }
      body {
        font-family: var(${geistSans.variable}), sans-serif;
      }
    `}</style>
  );
}

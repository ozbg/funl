import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import { css } from '@/styled-system/css'

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "FunL - QR Code Funnels",
  description: "Create and manage QR code funnels for your business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={css({
          fontFamily: 'var(--font-roboto-mono), monospace',
          bg: 'bg.default',
          color: 'fg.default',
          fontSmoothing: 'antialiased',
        })}
        style={{
          fontVariationSettings: robotoMono.style?.fontVariationSettings,
        }}
      >
        {children}
      </body>
    </html>
  );
}
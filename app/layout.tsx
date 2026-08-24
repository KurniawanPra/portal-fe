import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "InTes — PT Industri Nabati Lestari",
    template: "%s — InTes Portal",
  },
  description: "InTes (Integrated Enterprise System) Portal Single Sign-On PT Industri Nabati Lestari",
  icons: {
    icon: "/img/logo.png",
    shortcut: "/img/logo.png",
    apple: "/img/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brandRgb = process.env.NEXT_PUBLIC_BRAND_RGB || "245, 158, 11";
  const brandHoverRgb = process.env.NEXT_PUBLIC_BRAND_HOVER_RGB || "217, 119, 6";
  const brandDarkRgb = process.env.NEXT_PUBLIC_BRAND_DARK_RGB || "251, 191, 36";

  return (
    <html lang="id" className={cn("font-sans", inter.variable)}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --brand-rgb: ${brandRgb};
            --brand-hover-rgb: ${brandHoverRgb};
            --brand-dark-rgb: ${brandDarkRgb};
          }
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

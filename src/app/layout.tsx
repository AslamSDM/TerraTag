import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TerraTag | Blockchain Land Ownership",
  description:
    "Claim and manage virtual land parcels on the blockchain with TerraTag",
  icons: {
    icon: "/favicon.ico",
  },
  keywords: [
    "blockchain",
    "land",
    "nft",
    "what3words",
    "ownership",
    "virtual land",
    "metaverse",
  ],
  openGraph: {
    title: "TerraTag",
    description: "Claim and manage virtual land parcels on the blockchain",
    images: [
      {
        url: "/terratag-og.png",
        width: 1200,
        height: 630,
        alt: "TerraTag",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

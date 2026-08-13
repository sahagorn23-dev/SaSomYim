import type { Metadata } from "next";
import { Kanit, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-kanit",
  display: "swap",
});

const ibm = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SaSomYim | สหกรณ์",
  description: "ระบบสะสมแต้มสหกรณ์มหาวิทยาลัย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${kanit.variable} ${ibm.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

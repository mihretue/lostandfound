import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lost & Found Matcher",
  description: "University Lost and Found Matcher",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col`}>
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-blue-700">
              Lost & Found
            </Link>
            <NavLinks />
          </div>
        </header>
        
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
          {children}
        </main>

        <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
          <p>University Lost & Found Assessment</p>
        </footer>
      </body>
    </html>
  );
}

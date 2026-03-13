// app/layout.tsx
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "ReviewBot AI — ردود تلقائية على تقييمات Google",
  description: "بوت ذكاء اصطناعي يرد على تقييمات Google Maps باللهجة السعودية تلقائياً",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className={`${cairo.className} bg-gray-950 text-white antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#1a1a2e",
                color: "#fff",
                border: "1px solid #2d2d4e",
                fontFamily: "var(--font-cairo)",
                direction: "rtl",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

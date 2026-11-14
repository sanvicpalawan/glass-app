import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { StoreProvider } from "@/lib/store";
import { BrandedHeader } from "@/components/BrandedHeader";
import { BrandedFooter } from "@/components/BrandedFooter";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Fenestra — window & door software",
  description: "Configure, quote, and produce windows and doors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fenestra-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <StoreProvider>
          <BrandedHeader />
          <Nav />
          {children}
          <BrandedFooter />
        </StoreProvider>
      </body>
    </html>
  );
}

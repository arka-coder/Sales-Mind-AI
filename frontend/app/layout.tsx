import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "SalesMind AI — Intelligent Sales Copilot",
  description:
    "AI-powered sales automation platform. Analyze leads, handle objections, generate follow-ups, and close more deals with SalesMind AI.",
  keywords: "AI sales, sales automation, lead scoring, sales copilot, CRM AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans text-[var(--text-primary)] antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fafafa',
              border: '1px solid #27272a',
              borderRadius: '10px',
              fontSize: '13px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}

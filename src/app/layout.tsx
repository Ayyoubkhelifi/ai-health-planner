import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AI Health Planner — Personalized Nutrition & Fitness",
  description:
    "Generate AI-powered personalized health plans based on your profile, goals, and dietary preferences. Powered by AI AI.",
  keywords: ["health planner", "AI nutrition", "fitness plan", "diet planner"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#111827",
              border: "1px solid #1e2d42",
              color: "#f0f4ff",
            },
          }}
        />
      </body>
    </html>
  );
}

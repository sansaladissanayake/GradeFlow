import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "GradeFlow | GPA & CGPA Tracker",
  description: "Personalized GPA & CGPA Calculator and Academic Progress Tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try { if (localStorage.getItem('gradeflow_theme') === 'light') document.documentElement.classList.remove('dark'); else document.documentElement.classList.add('dark'); } catch {}` }} />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

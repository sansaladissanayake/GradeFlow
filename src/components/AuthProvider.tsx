"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const userId = localStorage.getItem("gradeflow_user_id");
      
      if (!userId && pathname !== "/login") {
        router.push("/login");
      } else if (userId) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Don't render children until auth is checked, unless on login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex-1 flex justify-center items-center h-screen bg-background">
        <div className="animate-pulse w-12 h-12 bg-primary-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-16">
      {children}
      <BottomNav />
    </div>
  );
}

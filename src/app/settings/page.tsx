"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("grading");

  const handleLogout = () => {
    localStorage.removeItem("gradeflow_user_id");
    localStorage.removeItem("gradeflow_user_name");
    router.push("/login");
  };

  return (
    <main className="flex-1 p-6 relative overflow-x-hidden min-h-screen pb-24">
      {/* Decorative background elements */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[20%] rounded-full bg-accent-500/10 blur-3xl" />
      
      <header className="mb-6 relative z-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure your grading system</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl relative z-10">
        <button 
          onClick={() => setActiveTab("grading")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "grading" 
              ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400" 
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Grading Scale
        </button>
        <button 
          onClick={() => setActiveTab("class")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "class" 
              ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400" 
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Class Boundaries
        </button>
      </div>

      <section className="relative z-10">
        {activeTab === "grading" && (
          <div className="glass-card p-5 rounded-3xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Custom Scale</h2>
              <button className="text-sm font-semibold text-primary-600 hover:text-primary-500">
                + Add Grade
              </button>
            </div>
            
            <div className="space-y-2 mb-4">
              {[
                { grade: "A+", gpa: "4.00" },
                { grade: "A", gpa: "4.00" },
                { grade: "A-", gpa: "3.70" },
                { grade: "B+", gpa: "3.30" },
                { grade: "B", gpa: "3.00" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-slate-800 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm">
                      {item.grade}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.gpa}</span>
                    <button className="text-slate-400 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Reset to Standard 4.0
            </button>
          </div>
        )}

        {activeTab === "class" && (
          <div className="glass-card p-5 rounded-3xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Class Boundaries</h2>
              <button className="text-sm font-semibold text-accent-500 hover:text-accent-400">
                + Add Class
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              {[
                { name: "First Class", min: "3.70", max: "4.00" },
                { name: "Second Upper", min: "3.30", max: "3.69" },
                { name: "Second Lower", min: "3.00", max: "3.29" },
                { name: "Pass", min: "2.00", max: "2.99" },
              ].map((item, i) => (
                <div key={i} className="glass-panel p-3 rounded-2xl flex justify-between items-center shadow-sm">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.name}</h4>
                  <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-2 text-xs font-bold shadow-inner">
                    <span className="text-accent-500">{item.min}</span>
                    <span className="text-slate-400">-</span>
                    <span className="text-slate-600 dark:text-slate-400">{item.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Account Section */}
      <section className="mt-8 relative z-10">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">Account</h2>
        <div className="glass-card rounded-3xl overflow-hidden">
          <button onClick={handleLogout} className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-red-500 font-medium">
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}

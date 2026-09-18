"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    const name = localStorage.getItem("gradeflow_user_name");
    if (name) setUserName(name);
  }, []);

  return (
    <main className="flex-1 p-6 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[20%] rounded-full bg-accent-500/10 blur-3xl" />
      <div className="absolute top-[20%] left-[-10%] w-[40%] h-[30%] rounded-full bg-primary-500/10 blur-3xl" />

      <header className="mb-8 relative z-10 flex justify-between items-center mt-4">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Welcome back,</p>
          <h1 className="text-2xl font-bold text-foreground truncate max-w-[200px]">{userName}</h1>
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary-600 to-accent-500 shadow-md shadow-primary-500/20 p-[2px]">
          <div className="h-full w-full rounded-full bg-white dark:bg-slate-900 border-2 border-transparent flex items-center justify-center">
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary-600 to-accent-500">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Main CGPA Card */}
      <section className="mb-6 relative z-10">
        <div className="glass-card rounded-3xl p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-500/20 to-transparent rounded-bl-full" />
          
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm tracking-wider uppercase mb-1">Overall CGPA</p>
          <h2 className="text-5xl font-black text-foreground mb-4">3.48</h2>
          
          <div className="flex justify-between items-center text-sm">
            <div className="bg-primary-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl">
              <span className="text-primary-600 dark:text-primary-400 font-semibold">60</span>
              <span className="text-slate-500 dark:text-slate-400 ml-1">Credits</span>
            </div>
            <div className="bg-accent-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl">
              <span className="text-accent-500 font-semibold">Second Upper</span>
            </div>
          </div>
        </div>
      </section>

      {/* Next Class Goal Card */}
      <section className="mb-6 relative z-10">
        <div className="glass-card rounded-3xl p-5 border-l-4 border-l-accent-500">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span>🎯</span> Target: First Class
            </h3>
            <span className="text-sm font-semibold text-accent-500">3.70</span>
          </div>
          
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
            <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full" style={{ width: '80%' }}></div>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You need a <strong className="text-foreground">0.22</strong> CGPA increase to reach your goal.
          </p>
        </div>
      </section>

      {/* Recent Semesters Quick View */}
      <section className="relative z-10 pb-6">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-foreground">Recent Semesters</h3>
          <Link href="/semesters" className="text-sm font-semibold text-primary-600 hover:text-primary-500">
            View All
          </Link>
        </div>
        
        <div className="space-y-3">
          {[
            { name: "Year 2 - Semester 1", gpa: "3.72", credits: 15 },
            { name: "Year 1 - Semester 2", gpa: "3.55", credits: 16 }
          ].map((sem, i) => (
            <div key={i} className="glass-panel p-4 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">{sem.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{sem.credits} Credits</p>
              </div>
              <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <span className="font-bold text-primary-600 dark:text-primary-400">{sem.gpa}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

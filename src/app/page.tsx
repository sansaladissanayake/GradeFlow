"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSemesters, getSubjects } from "@/lib/api";

export default function Dashboard() {
  const [userName, setUserName] = useState("Student");
  
  const [overallGpa, setOverallGpa] = useState("0.00");
  const [totalCredits, setTotalCredits] = useState(0);
  const [currentClass, setCurrentClass] = useState("Unclassified");
  const [recentSemesters, setRecentSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const name = localStorage.getItem("gradeflow_user_name");
    if (name) setUserName(name);
    
    const fetchData = async () => {
      const userId = localStorage.getItem("gradeflow_user_id");
      if (!userId) { 
        setLoading(false); 
        return; 
      }
      
      try {
        const [semRes, subRes] = await Promise.all([
          getSemesters(userId),
          getSubjects(userId)
        ]);
        
        let semesters = [];
        let subjects = [];
        
        if (semRes.status === "success" && semRes.data) semesters = semRes.data;
        if (subRes.status === "success" && subRes.data) subjects = subRes.data;
        
        // Calculate overall stats
        let tCredits = 0;
        let tPoints = 0;
        
        subjects.forEach((s: any) => {
          tCredits += Number(s.credits);
          tPoints += Number(s.credits) * Number(s.gradePoint);
        });
        
        const cgpa = tCredits > 0 ? (tPoints / tCredits).toFixed(2) : "0.00";
        setTotalCredits(tCredits);
        setOverallGpa(cgpa);
        
        // Determine Academic Class (Basic Logic)
        const cgpaNum = parseFloat(cgpa);
        if (tCredits === 0) setCurrentClass("Unclassified");
        else if (cgpaNum >= 3.7) setCurrentClass("First Class");
        else if (cgpaNum >= 3.3) setCurrentClass("Second Upper");
        else if (cgpaNum >= 3.0) setCurrentClass("Second Lower");
        else if (cgpaNum >= 2.0) setCurrentClass("Pass");
        else setCurrentClass("Fail");
        
        // Calculate per-semester stats for "Recent Semesters"
        const semStats = semesters.map((sem: any) => {
          const semSubs = subjects.filter((s: any) => s.semester_id === sem.id);
          let sCredits = 0;
          let sPoints = 0;
          semSubs.forEach((s: any) => {
            sCredits += Number(s.credits);
            sPoints += Number(s.credits) * Number(s.gradePoint);
          });
          return {
            id: sem.id,
            name: `${sem.academic_year} - ${sem.name}`,
            credits: sCredits,
            gpa: sCredits > 0 ? (sPoints / sCredits).toFixed(2) : "0.00"
          };
        });
        
        // Sort newest first (using ID which is a timestamp) and take top 2
        semStats.sort((a: any, b: any) => b.id.localeCompare(a.id));
        setRecentSemesters(semStats.slice(0, 2));
        
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
      setLoading(false);
    };
    
    fetchData();
  }, []);

  return (
    <main className="flex-1 p-6 relative overflow-x-hidden pb-24">
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
          {loading ? (
            <div className="h-12 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg mx-auto mb-4" />
          ) : (
            <h2 className="text-5xl font-black text-foreground mb-4">{overallGpa}</h2>
          )}
          
          <div className="flex justify-between items-center text-sm">
            <div className="bg-primary-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl flex items-center gap-1">
              <span className="text-primary-600 dark:text-primary-400 font-semibold">{totalCredits}</span>
              <span className="text-slate-500 dark:text-slate-400">Credits</span>
            </div>
            <div className="bg-accent-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl">
              <span className="text-accent-500 font-semibold">{currentClass}</span>
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
            <div 
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full" 
              style={{ width: `${Math.min((parseFloat(overallGpa) / 3.7) * 100, 100)}%` }}
            ></div>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {parseFloat(overallGpa) >= 3.7 ? (
              <span className="text-primary-600">You've reached your goal! 🎉</span>
            ) : (
              <span>You need a <strong className="text-foreground">{(3.70 - parseFloat(overallGpa)).toFixed(2)}</strong> CGPA increase to reach your goal.</span>
            )}
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
          {loading ? (
             <div className="glass-panel p-4 rounded-2xl animate-pulse h-16" />
          ) : recentSemesters.length === 0 ? (
            <div className="glass-panel p-6 rounded-2xl text-center text-sm text-slate-500">
              No semesters added yet.
            </div>
          ) : (
            recentSemesters.map((sem, i) => (
              <Link href={`/semesters/${sem.id}`} key={i} className="block">
                <div className="glass-panel p-4 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{sem.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{sem.credits} Credits</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <span className="font-bold text-primary-600 dark:text-primary-400">{sem.gpa}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { swrFetcher } from "@/lib/api";

const DEFAULT_CLASS_BOUNDARIES = [
  { name: "First Class", min: "3.70", max: "4.00" },
  { name: "Second Upper", min: "3.30", max: "3.69" },
  { name: "Second Lower", min: "3.00", max: "3.29" },
  { name: "Pass", min: "2.00", max: "2.99" },
];

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Student");
  const [gpaMode, setGpaMode] = useState<"normal" | "weighted">("normal");

  useEffect(() => {
    setUserId(localStorage.getItem("gradeflow_user_id"));
    const name = localStorage.getItem("gradeflow_user_name");
    if (name) setUserName(name);
    setGpaMode(localStorage.getItem("gradeflow_gpa_mode") === "weighted" ? "weighted" : "normal");
  }, []);

  const { data: semesters = [], isLoading: semLoading } = useSWR(userId ? ["getSemesters", userId] : null, swrFetcher);
  const { data: subjects = [], isLoading: subLoading } = useSWR(userId ? ["getSubjects", userId] : null, swrFetcher);
  const { data: settings, isLoading: setLoading } = useSWR(userId ? ["getSettings", userId] : null, swrFetcher);

  const loading = !userId || semLoading || subLoading || setLoading;

  // Process data if loaded
  let boundaries = DEFAULT_CLASS_BOUNDARIES;
  if (settings?.class_boundaries) {
    boundaries = JSON.parse(settings.class_boundaries);
  }

  let tCredits = 0;
  let tPoints = 0;
  const yearCredits = new Map<number, number>();
  const yearPoints = new Map<number, number>();

  subjects.forEach((s: any) => {
    if (s.grade !== "Pending") {
      tCredits += Number(s.credits);
      tPoints += Number(s.credits) * Number(s.gradePoint);
      const semester = semesters.find((sem: any) => String(sem.id) === String(s.semester_id));
      const yearLabel = String(semester?.academic_year ?? "");
      const match = yearLabel.match(/\d+/);
      const year = match ? Number(match[0]) : NaN;
      if (year >= 1 && year <= 4) {
        yearCredits.set(year, (yearCredits.get(year) ?? 0) + Number(s.credits));
        yearPoints.set(year, (yearPoints.get(year) ?? 0) + Number(s.credits) * Number(s.gradePoint));
      }
    }
  });

  const yearWeights = [0, 0.2, 0.2, 0.3, 0.3];
  const yearlyGpa = (year: number) => (yearCredits.get(year) ?? 0) > 0 ? (yearPoints.get(year) ?? 0) / (yearCredits.get(year) ?? 1) : 0;
  const weightedGpa = [1, 2, 3, 4].reduce((sum, year) => sum + yearWeights[year] * yearlyGpa(year), 0);
  const overallGpa = (gpaMode === "weighted" ? weightedGpa : tCredits > 0 ? tPoints / tCredits : 0).toFixed(2);
  const cgpaNum = parseFloat(overallGpa);

  const sortedBoundaries = [...boundaries].sort((a, b) => parseFloat(b.max) - parseFloat(a.max));

  let currentClass = "Unclassified";
  if (tCredits > 0) {
    currentClass = "Fail";
    for (const b of sortedBoundaries) {
      if (cgpaNum >= parseFloat(b.min)) {
        currentClass = b.name;
        break;
      }
    }
  }

  let targetClass = sortedBoundaries.length > 0 ? sortedBoundaries[0].name : "First Class";
  let targetGpa = sortedBoundaries.length > 0 ? parseFloat(sortedBoundaries[0].min) : 3.70;
  if (sortedBoundaries.length > 0) {
    for (let i = sortedBoundaries.length - 1; i >= 0; i--) {
      if (cgpaNum < parseFloat(sortedBoundaries[i].min)) {
        targetClass = sortedBoundaries[i].name;
        targetGpa = parseFloat(sortedBoundaries[i].min);
        break;
      }
    }
  }

  const semStats = semesters.map((sem: any) => {
    const semSubs = subjects.filter((s: any) => String(s.semester_id) === String(sem.id));
    let sCredits = 0;
    let sPoints = 0;
    semSubs.forEach((s: any) => {
      if (s.grade !== "Pending") {
        sCredits += Number(s.credits);
        sPoints += Number(s.credits) * Number(s.gradePoint);
      }
    });
    return {
      id: sem.id,
      name: `${sem.academic_year} - ${sem.name}`,
      credits: sCredits,
      gpa: sCredits > 0 ? (sPoints / sCredits).toFixed(2) : "0.00"
    };
  }).sort((a: any, b: any) => String(b.id).localeCompare(String(a.id)));

  const recentSemesters = semStats.slice(0, 2);

  const firstClassBoundary = boundaries.find((boundary: any) => /first/i.test(boundary.name)) ?? boundaries[0];
  const firstClassTarget = firstClassBoundary ? Number(firstClassBoundary.min) : 3.7;

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
        <div className="flex justify-end mb-3">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1" role="group" aria-label="GPA calculation mode">
            {(["normal", "weighted"] as const).map((mode) => <button key={mode} onClick={() => { setGpaMode(mode); localStorage.setItem("gradeflow_gpa_mode", mode); }} aria-pressed={gpaMode === mode} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${gpaMode === mode ? "bg-white dark:bg-slate-700 text-primary-600 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}>{mode}</button>)}
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-500/20 to-transparent rounded-bl-full" />
          
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm tracking-wider uppercase mb-1">{gpaMode === "weighted" ? "Weighted GPA" : "Overall GPA"}</p>
          {loading ? (
            <div className="h-12 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg mx-auto mb-4" />
          ) : (
            <h2 className="text-5xl font-black text-foreground mb-4">{overallGpa}</h2>
          )}
          
          <div className="flex justify-between items-center text-sm">
            <div className="bg-primary-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl flex items-center gap-1">
              <span className="text-primary-600 dark:text-primary-400 font-semibold">{tCredits}</span>
              <span className="text-slate-500 dark:text-slate-400">Credits</span>
            </div>
            <div className="bg-accent-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl">
              <span className="text-accent-500 font-semibold">{currentClass}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 grid grid-cols-2 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Quality points</p>
          <p className="text-2xl font-bold text-foreground mt-1">{tPoints.toFixed(1)}</p>
          <p className="text-xs text-slate-500 mt-1">Across graded courses</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Completed credits</p>
          <p className="text-2xl font-bold text-foreground mt-1">{tCredits}</p>
          <p className="text-xs text-slate-500 mt-1">{subjects.filter((s: any) => s.grade !== "Pending").length} graded courses</p>
        </div>
      </section>

      {/* Next Class Goal Card */}
      <section className="mb-6 relative z-10">
        <div className="glass-card rounded-3xl p-5 border-l-4 border-l-accent-500">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span>🎯</span> Target: {targetClass}
            </h3>
            <span className="text-sm font-semibold text-accent-500">{targetGpa.toFixed(2)}</span>
          </div>
          
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full" 
              style={{ width: `${Math.min((parseFloat(overallGpa) / targetGpa) * 100, 100)}%` }}
            ></div>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {parseFloat(overallGpa) >= targetGpa ? (
              <span className="text-primary-600">You've reached your highest goal! 🎉</span>
            ) : (
              <span>You need a <strong className="text-foreground">{(targetGpa - parseFloat(overallGpa)).toFixed(2)}</strong> CGPA increase to reach your goal.</span>
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
            recentSemesters.map((sem: any, i: number) => (
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

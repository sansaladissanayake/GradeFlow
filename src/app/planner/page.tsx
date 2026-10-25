"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { swrFetcher } from "@/lib/api";

type PlannedCourse = { id: string; name: string; credits: number };
type PlannedSemester = { id: string; year: number; name: string; courses: PlannedCourse[] };
type GradeOption = { grade: string; gpa: number | string };
type ClassBoundary = { name: string; min: number | string; max: number | string };
type AcademicSemester = { id: string; academic_year: string };
type AcademicSubject = { semester_id: string; grade: string; credits: number; gradePoint: number };
type PlannerSettings = { grading_scale?: string; class_boundaries?: string };

const DEFAULT_SCALE = [
  { grade: "A+", gpa: 4 }, { grade: "A", gpa: 4 }, { grade: "A-", gpa: 3.7 },
  { grade: "B+", gpa: 3.3 }, { grade: "B", gpa: 3 }, { grade: "B-", gpa: 2.7 },
  { grade: "C+", gpa: 2.3 }, { grade: "C", gpa: 2 }, { grade: "C-", gpa: 1.7 },
  { grade: "D+", gpa: 1.3 }, { grade: "D", gpa: 1 }, { grade: "E", gpa: 0 },
];
const YEAR_WEIGHTS = [0, 0.2, 0.2, 0.3, 0.3];
const DEFAULT_BOUNDARIES = [
  { name: "First Class", min: "3.70", max: "4.00" },
  { name: "Second Class (Upper Division)", min: "3.30", max: "3.69" },
  { name: "Second Class (Lower Division)", min: "2.70", max: "3.29" },
  { name: "Pass", min: "2.00", max: "2.69" },
];

function emptySemester(year = 1): PlannedSemester {
  return { id: crypto.randomUUID(), year, name: "Semester 1", courses: [] };
}

export default function PlannerPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlannedSemester[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Browser-only data is restored after hydration to avoid server/client mismatches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserId(localStorage.getItem("gradeflow_user_id"));
    try {
      const stored = localStorage.getItem("gradeflow_planned_semesters");
      if (stored) setPlans(JSON.parse(stored));
    } catch { /* Ignore invalid local plan data. */ }
    setReady(true);
  }, []);

  const { data: semesters = [] } = useSWR<AcademicSemester[]>(userId ? ["getSemesters", userId] : null, swrFetcher);
  const { data: subjects = [] } = useSWR<AcademicSubject[]>(userId ? ["getSubjects", userId] : null, swrFetcher);
  const { data: settings } = useSWR<PlannerSettings>(userId ? ["getSettings", userId] : null, swrFetcher);

  const gradingScale: GradeOption[] = useMemo(() => {
    try { return settings?.grading_scale ? JSON.parse(settings.grading_scale) as GradeOption[] : DEFAULT_SCALE; }
    catch { return DEFAULT_SCALE; }
  }, [settings]);
  const classBoundaries: ClassBoundary[] = useMemo(() => {
    try { return settings?.class_boundaries ? JSON.parse(settings.class_boundaries) as ClassBoundary[] : DEFAULT_BOUNDARIES; }
    catch { return DEFAULT_BOUNDARIES; }
  }, [settings]);

  const updatePlans = (next: PlannedSemester[]) => {
    setPlans(next);
    localStorage.setItem("gradeflow_planned_semesters", JSON.stringify(next));
  };
  const addSemester = () => updatePlans([...plans, emptySemester(plans.at(-1)?.year ?? 1)]);
  const removeSemester = (id: string) => updatePlans(plans.filter((semester) => semester.id !== id));
  const updateSemester = (id: string, patch: Partial<PlannedSemester>) => updatePlans(plans.map((semester) => semester.id === id ? { ...semester, ...patch } : semester));
  const addCourse = (semester: PlannedSemester) => updateSemester(semester.id, { courses: [...semester.courses, { id: crypto.randomUUID(), name: "", credits: 3 }] });
  const updateCourse = (semester: PlannedSemester, courseId: string, patch: Partial<PlannedCourse>) => updateSemester(semester.id, { courses: semester.courses.map((course) => course.id === courseId ? { ...course, ...patch } : course) });
  const removeCourse = (semester: PlannedSemester, courseId: string) => updateSemester(semester.id, { courses: semester.courses.filter((course) => course.id !== courseId) });

  const actualTotals = [1, 2, 3, 4].map((year) => {
    let credits = 0;
    let points = 0;
    semesters.forEach((semester) => {
      const semesterYear = Number(String(semester.academic_year ?? "").match(/\d+/)?.[0]);
      if (semesterYear !== year) return;
      subjects.filter((subject) => String(subject.semester_id) === String(semester.id) && subject.grade !== "Pending").forEach((subject) => {
        credits += Number(subject.credits) || 0;
        points += (Number(subject.credits) || 0) * (Number(subject.gradePoint) || 0);
      });
    });
    return { year, credits, points, gpa: credits > 0 ? points / credits : 0 };
  });
  const totals = actualTotals.map((actual) => ({ ...actual, plannedCredits: plans.filter((semester) => semester.year === actual.year).reduce((sum, semester) => sum + semester.courses.reduce((courseSum, course) => courseSum + Math.max(0, Number(course.credits) || 0), 0), 0) }));
  const plannedCourseCount = plans.reduce((sum, semester) => sum + semester.courses.length, 0);
  const plannedCredits = plans.reduce((sum, semester) => sum + semester.courses.reduce((courseSum, course) => courseSum + (Number(course.credits) || 0), 0), 0);
  const projectedForGrade = (estimate: number) => totals.reduce((sum, year) => {
    const allCredits = year.credits + year.plannedCredits;
    const allPoints = year.points + year.plannedCredits * estimate;
    return sum + YEAR_WEIGHTS[year.year] * (allCredits > 0 ? allPoints / allCredits : 0);
  }, 0);
  const cutoff = Number((classBoundaries.find((boundary) => /first/i.test(boundary.name)) ?? classBoundaries[0])?.min ?? 3.7);
  const sortedGrades = [...gradingScale].sort((a, b) => Number(a.gpa) - Number(b.gpa));
  const topGrade = sortedGrades.at(-1);
  const requiredGrade = plannedCredits > 0 ? sortedGrades.find((grade) => projectedForGrade(Number(grade.gpa)) >= cutoff) : null;
  const projectedAtRequirement = requiredGrade ? projectedForGrade(Number(requiredGrade.gpa)) : null;
  const bestPossibleFgpa = plannedCredits > 0 && topGrade ? projectedForGrade(Number(topGrade.gpa)) : null;

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 pb-28">
      <header className="flex items-center justify-between mt-3 mb-6">
        <div><p className="text-xs uppercase tracking-[0.18em] text-primary-500 font-bold">What if</p><h1 className="text-3xl font-black text-foreground mt-1">GPA Planner</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Plan semesters and estimate your final GPA.</p></div>
        <button onClick={addSemester} className="rounded-2xl bg-primary-600 text-white px-4 py-3 font-bold shadow-lg shadow-primary-600/20">+ Semester</button>
      </header>

      <section className="glass-card rounded-3xl p-5 mb-5">
        <div className="flex justify-between items-start gap-3"><div><p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">First Class target</p><h2 className="text-5xl font-black text-foreground mt-1">{cutoff.toFixed(2)}</h2></div><div className="text-right"><p className="text-xs text-slate-500 dark:text-slate-400">Minimum grade to aim for</p><span className="text-2xl font-black text-emerald-500">{requiredGrade?.grade ?? (plannedCredits ? "Not reachable" : "Add courses")}</span></div></div>
        {plannedCredits > 0 && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{requiredGrade ? `Aim for at least ${requiredGrade.grade} in every planned course to project a final GPA of ${projectedAtRequirement?.toFixed(2)}.` : `Even ${topGrade?.grade ?? "your highest grade"} in every planned course projects a final GPA of ${bestPossibleFgpa?.toFixed(2)}, below the First Class cutoff.`}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-3"><p className="text-xs text-slate-500 dark:text-slate-400">Planned courses</p><p className="text-xl font-bold mt-1">{plannedCourseCount}</p></div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-3"><p className="text-xs text-slate-500 dark:text-slate-400">Planned credits</p><p className="text-xl font-bold mt-1">{plannedCredits}</p></div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {totals.map((item) => <div key={item.year} className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-2 text-center"><p className="text-[10px] text-slate-500 dark:text-slate-400">Year {item.year} · {YEAR_WEIGHTS[item.year] * 100}%</p><p className="font-bold mt-1">{item.plannedCredits + item.credits > 0 ? (projectedAtRequirement === null ? (item.credits ? item.gpa.toFixed(2) : "—") : ((item.points + item.plannedCredits * Number(requiredGrade?.gpa ?? 0)) / (item.credits + item.plannedCredits)).toFixed(2)) : "—"}</p></div>)}
        </div>
      </section>

      {!ready ? <div className="glass-panel rounded-2xl p-8 text-center text-slate-500">Loading planner…</div> : plans.length === 0 ? (
        <section className="glass-card rounded-3xl p-8 text-center"><p className="text-4xl mb-3">✦</p><h2 className="text-lg font-bold">Start a what-if plan</h2><p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-5">Add your remaining semesters and course credits. GradeFlow will calculate the lowest grade you need to target. Plans stay separate from your academic record.</p><button onClick={addSemester} className="rounded-xl bg-primary-600 text-white px-5 py-3 font-semibold">Add a semester</button></section>
      ) : (
        <section className="space-y-4">
          {plans.map((semester) => <article key={semester.id} className="glass-card rounded-3xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <select value={semester.year} onChange={(event) => updateSemester(semester.id, { year: Number(event.target.value) })} aria-label="Academic year" className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm font-semibold outline-none">{[1, 2, 3, 4].map((year) => <option key={year} value={year}>Year {year}</option>)}</select>
              <input value={semester.name} onChange={(event) => updateSemester(semester.id, { name: event.target.value })} aria-label="Semester name" className="min-w-0 flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm font-semibold outline-none" />
              <button onClick={() => removeSemester(semester.id)} aria-label="Remove semester" className="p-2 text-slate-400 hover:text-rose-500">✕</button>
            </div>
            <div className="space-y-2">
              {semester.courses.map((course) => <div key={course.id} className="grid grid-cols-[minmax(0,1fr)_4.5rem_2rem] sm:grid-cols-[minmax(0,1fr)_5rem_2rem] gap-2 items-center">
                <input value={course.name} onChange={(event) => updateCourse(semester, course.id, { name: event.target.value })} placeholder="Course name" aria-label="Course name" className="min-w-0 rounded-xl bg-slate-50 dark:bg-slate-800/70 px-3 py-2.5 text-sm outline-none" />
                <input type="number" min="0" step="0.5" value={course.credits} onChange={(event) => updateCourse(semester, course.id, { credits: Number(event.target.value) })} aria-label="Course credits" className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/70 px-2 py-2.5 text-sm text-center outline-none" />
                <button onClick={() => removeCourse(semester, course.id)} aria-label="Remove course" className="text-slate-400 hover:text-rose-500">✕</button>
                <p className="col-span-3 -mt-1 px-3 text-xs text-slate-500 dark:text-slate-400">Minimum target: <span className="font-bold text-emerald-500">{plannedCredits > 0 ? requiredGrade?.grade ?? `Above ${topGrade?.grade ?? "scale"} needed` : "Add course credits"}</span></p>
              </div>)}
            </div>
            <button onClick={() => addCourse(semester)} className="mt-3 text-sm font-semibold text-primary-500">+ Add course</button>
          </article>)}
          <button onClick={addSemester} className="w-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-sm font-semibold text-slate-500 hover:text-primary-500">+ Add another semester</button>
          <button onClick={() => updatePlans([])} className="block mx-auto py-2 text-xs text-slate-400 hover:text-rose-500">Clear plan</button>
        </section>
      )}
    </main>
  );
}

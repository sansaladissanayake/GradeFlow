"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSemesters, getSubjects, addSemester } from "@/lib/api";

interface Semester {
  id: string;
  name: string;
  academic_year: string;
  credits?: number;
  gpa?: number;
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newYear, setNewYear] = useState("Year 1");
  const [newSemester, setNewSemester] = useState("Semester 1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("gradeflow_user_id");
      if (!userId) return;
      
      try {
        const [semRes, subRes] = await Promise.all([
          getSemesters(userId),
          getSubjects(userId)
        ]);
        
        let sems: Semester[] = [];
        let subs: any[] = [];
        
        if (semRes.status === "success" && semRes.data) sems = semRes.data;
        if (subRes.status === "success" && subRes.data) subs = subRes.data;
        
        // Calculate credits and gpa per semester
        const semStats = sems.map(sem => {
          const semSubs = subs.filter((s: any) => String(s.semester_id) === String(sem.id));
          let sCredits = 0;
          let sPoints = 0;
          semSubs.forEach((s: any) => {
            sCredits += Number(s.credits);
            sPoints += Number(s.credits) * Number(s.gradePoint);
          });
          
          return {
            ...sem,
            credits: sCredits,
            gpa: sCredits > 0 ? (sPoints / sCredits) : 0
          };
        });
        
        setSemesters(semStats);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    
    fetchData();
  }, []);

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const userId = localStorage.getItem("gradeflow_user_id");
    const newId = Date.now().toString();
    
    const semesterData = {
      id: newId,
      user_id: userId,
      name: newSemester,
      academic_year: newYear
    };
    
    // OPTIMISTIC UPDATE
    setSemesters([...semesters, {
      id: newId,
      name: newSemester,
      academic_year: newYear,
      credits: 0,
      gpa: 0
    }]);
    setShowAddModal(false);
    setIsSubmitting(false);
    
    // Background Sync
    addSemester(semesterData).then(res => {
      if (res.status !== "success") {
        console.error("Error adding semester: ", res.message);
      }
    }).catch(err => console.error("Sync error:", err));
  };

  return (
    <main className="flex-1 p-6 relative overflow-x-hidden min-h-screen pb-24">
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[20%] rounded-full bg-primary-500/10 blur-3xl" />
      
      <header className="mb-6 relative z-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Semesters</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your academic records</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary-600 to-accent-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 hover:scale-105 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </header>

      <section className="space-y-4 relative z-10">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : semesters.length === 0 ? (
          <div className="glass-card p-8 rounded-3xl text-center border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500">No semesters found. Add one to start tracking!</p>
          </div>
        ) : (
          semesters.map((sem) => (
            <Link href={`/semesters/${sem.id}`} key={sem.id} className="block">
              <div className="glass-card p-5 rounded-3xl flex justify-between items-center transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10">
                <div>
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">{sem.academic_year}</p>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{sem.name}</h2>
                  <p className="text-sm text-slate-500 mt-1">{sem.credits || 0} Credits</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-800 dark:to-slate-700 px-4 py-2 rounded-2xl border border-primary-100 dark:border-slate-700">
                    <span className="font-bold text-lg text-primary-700 dark:text-primary-300">
                      {sem.gpa && sem.gpa > 0 ? Number(sem.gpa).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
                    View details
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>

      {/* Add Semester Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Add Semester</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddSemester} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
                <select 
                  value={newYear} 
                  onChange={(e) => setNewYear(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="Year 1">Year 1</option>
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                  <option value="Year 4">Year 4</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Semester Name</label>
                <input 
                  type="text" 
                  value={newSemester} 
                  onChange={(e) => setNewSemester(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="e.g. Semester 1"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-70"
              >
                {isSubmitting ? "Creating..." : "Create Semester"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

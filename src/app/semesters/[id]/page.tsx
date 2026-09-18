"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSubjects, addSubject } from "@/lib/api";

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  grade: string;
  gradePoint: number;
}

export default function SemesterDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newCredits, setNewCredits] = useState("3");
  const [newGrade, setNewGrade] = useState("A");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      const userId = localStorage.getItem("gradeflow_user_id");
      if (!userId) return;
      
      const res = await getSubjects(userId);
      if (res.status === "success" && res.data) {
        // Filter by semester_id
        const semSubjects = res.data.filter((s: any) => s.semester_id === id);
        setSubjects(semSubjects);
      }
      setLoading(false);
    };
    
    fetchSubjects();
  }, [id]);

  const gpa = subjects.length 
    ? (subjects.reduce((acc, sub) => acc + sub.credits * sub.gradePoint, 0) / 
       subjects.reduce((acc, sub) => acc + sub.credits, 0)).toFixed(2)
    : "0.00";

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const userId = localStorage.getItem("gradeflow_user_id");
    
    const gradePoints: Record<string, number> = {
      "A+": 4.0, "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "C-": 1.7, "D": 1.0, "F": 0.0
    };
    
    const newId = Date.now().toString();
    const gPoint = gradePoints[newGrade] || 0;
    
    const subjectData = {
      id: newId,
      semester_id: id,
      user_id: userId,
      code: newSubCode,
      name: newSubName,
      credits: parseInt(newCredits),
      grade: newGrade,
      gradePoint: gPoint
    };
    
    const res = await addSubject(subjectData);
    
    if (res.status === "success") {
      setSubjects([...subjects, subjectData]);
      setShowAddModal(false);
      setNewSubCode("");
      setNewSubName("");
    } else {
      alert("Error adding subject: " + res.message);
    }
    
    setIsSubmitting(false);
  };

  return (
    <main className="flex-1 p-6 relative overflow-x-hidden min-h-screen pb-24">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[30%] rounded-full bg-accent-500/10 blur-3xl" />
      
      <header className="mb-6 relative z-10">
        <Link href="/semesters" className="inline-flex items-center text-sm font-semibold text-primary-600 mb-4 hover:text-primary-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Semesters
        </Link>
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-foreground truncate max-w-[150px]">Semester {id}</h1>
          </div>
          <div className="bg-gradient-to-br from-primary-600 to-accent-500 p-[2px] rounded-2xl shadow-lg shadow-primary-500/20">
            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-[14px]">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">GPA</p>
              <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-br from-primary-600 to-accent-500">{gpa}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Subjects</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-sm font-semibold text-white bg-primary-600 px-4 py-2 rounded-full shadow-md hover:bg-primary-500 transition-colors"
          >
            + Add Subject
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="glass-card p-8 rounded-3xl text-center border border-dashed border-slate-300 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">No subjects yet</h3>
            <p className="text-sm text-slate-500">Add your first subject to calculate GPA</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map((sub) => (
              <div key={sub.id} className="glass-panel p-4 rounded-2xl flex justify-between items-center shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-2 py-0.5 rounded-full">
                      {sub.code}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">{sub.credits} Credits</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{sub.name}</h4>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg text-primary-600 shadow-inner">
                  {sub.grade}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Add Subject</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Code</label>
                  <input 
                    type="text" 
                    value={newSubCode} 
                    onChange={(e) => setNewSubCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="IS1102"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Credits</label>
                  <select 
                    value={newCredits} 
                    onChange={(e) => setNewCredits(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Name</label>
                <input 
                  type="text" 
                  value={newSubName} 
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Intro to Information Systems"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grade</label>
                <select 
                  value={newGrade} 
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-primary-600"
                >
                  {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"].map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-70"
              >
                {isSubmitting ? "Saving..." : "Save Subject"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

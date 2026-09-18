"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSubjects, addSubject, updateSubject, deleteSubject, getSettings } from "@/lib/api";

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  grade: string;
  gradePoint: number;
}

const DEFAULT_GRADING_SCALE = [
  { grade: "A+", gpa: "4.00" },
  { grade: "A", gpa: "4.00" },
  { grade: "A-", gpa: "3.70" },
  { grade: "B+", gpa: "3.30" },
  { grade: "B", gpa: "3.00" },
  { grade: "B-", gpa: "2.70" },
  { grade: "C+", gpa: "2.30" },
  { grade: "C", gpa: "2.00" },
  { grade: "C-", gpa: "1.70" },
  { grade: "D", gpa: "1.00" },
  { grade: "F", gpa: "0.00" }
];

export default function SemesterDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [gradingScale, setGradingScale] = useState(DEFAULT_GRADING_SCALE);
  const [gradePoints, setGradePoints] = useState<Record<string, number>>({});

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newCredits, setNewCredits] = useState("3");
  const [newGrade, setNewGrade] = useState("Pending");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);
  const [editSubCode, setEditSubCode] = useState("");
  const [editSubName, setEditSubName] = useState("");
  const [editCredits, setEditCredits] = useState("3");
  const [editGrade, setEditGrade] = useState("A");
  const [isEditing, setIsEditing] = useState(false);
  
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("gradeflow_user_id");
      if (!userId) return;
      
      try {
        // Fetch Settings for custom grading scale
        const settingsRes = await getSettings(userId);
        let currentScale = DEFAULT_GRADING_SCALE;
        if (settingsRes.status === "success" && settingsRes.data?.grading_scale) {
          currentScale = JSON.parse(settingsRes.data.grading_scale);
          setGradingScale(currentScale);
        }
        
        const gPoints: Record<string, number> = {};
        currentScale.forEach(item => {
          gPoints[item.grade] = parseFloat(item.gpa);
        });
        setGradePoints(gPoints);
        
        // Fetch Subjects
        const res = await getSubjects(userId);
        if (res.status === "success" && res.data) {
          const semSubjects = res.data.filter((s: any) => String(s.semester_id) === String(id));
          setSubjects(semSubjects);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    
    fetchData();
  }, [id]);

  const gradedSubjects = subjects.filter(sub => sub.grade !== "Pending");
  const gpa = gradedSubjects.length 
    ? (gradedSubjects.reduce((acc, sub) => acc + sub.credits * sub.gradePoint, 0) / 
       gradedSubjects.reduce((acc, sub) => acc + sub.credits, 0)).toFixed(2)
    : "0.00";

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const userId = localStorage.getItem("gradeflow_user_id") || "";
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
    
    // OPTIMISTIC UPDATE
    setSubjects([...subjects, subjectData]);
    setShowAddModal(false);
    setNewSubCode("");
    setNewSubName("");
    setIsSubmitting(false);
    
    // Background Sync
    addSubject(subjectData).catch(err => console.error("Sync error:", err));
  };

  const openEditModal = (sub: Subject) => {
    setEditSubjectId(sub.id);
    setEditSubCode(sub.code);
    setEditSubName(sub.name);
    setEditCredits(sub.credits.toString());
    setEditGrade(sub.grade);
    setShowEditModal(true);
  };

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubjectId) return;
    setIsEditing(true);
    
    const userId = localStorage.getItem("gradeflow_user_id") || "";
    const gPoint = gradePoints[editGrade] || 0;
    
    const subjectData = {
      id: editSubjectId,
      semester_id: id,
      user_id: userId,
      code: editSubCode,
      name: editSubName,
      credits: parseInt(editCredits),
      grade: editGrade,
      gradePoint: gPoint
    };
    
    // OPTIMISTIC UPDATE
    setSubjects(subjects.map(s => s.id === editSubjectId ? subjectData : s));
    setShowEditModal(false);
    setIsEditing(false);
    setEditSubjectId(null);
    
    // Background Sync
    updateSubject(subjectData).catch(err => console.error("Update error:", err));
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    
    setIsDeleting(subjectId);
    const userId = localStorage.getItem("gradeflow_user_id") || "";
    
    // OPTIMISTIC UPDATE
    setSubjects(subjects.filter(s => s.id !== subjectId));
    setIsDeleting(null);
    
    // Background Sync
    deleteSubject(subjectId, userId).catch(err => console.error("Delete error:", err));
  };

  return (
    <main className="flex-1 p-6 relative overflow-x-hidden min-h-screen pb-24">
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
              <div key={sub.id} className="glass-panel p-4 rounded-2xl flex justify-between items-center shadow-sm relative group">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-2 py-0.5 rounded-full">
                      {sub.code}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">{sub.credits} Credits</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{sub.name}</h4>
                  
                  {/* Action Buttons (visible on hover or always on mobile) */}
                  <div className="flex gap-3 mt-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(sub)} className="text-xs font-semibold text-primary-600 hover:text-primary-500">Edit</button>
                    <button onClick={() => handleDeleteSubject(sub.id)} disabled={isDeleting === sub.id} className="text-xs font-semibold text-red-500 hover:text-red-400">
                      {isDeleting === sub.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-inner ${sub.grade === "Pending" ? "bg-slate-100 dark:bg-slate-800/50 text-slate-400" : "bg-slate-100 dark:bg-slate-800 text-primary-600"}`}>
                  {sub.grade === "Pending" ? "—" : sub.grade}
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
                  <input type="text" value={newSubCode} onChange={(e) => setNewSubCode(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="IS1102" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Credits</label>
                  <select value={newCredits} onChange={(e) => setNewCredits(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none">
                    {[1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Name</label>
                <input type="text" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Intro to Information Systems" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grade</label>
                <select value={newGrade} onChange={(e) => setNewGrade(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-primary-600">
                  <option value="Pending">Pending (Not Graded)</option>
                  {gradingScale.map(item => <option key={item.grade} value={item.grade}>{item.grade}</option>)}
                </select>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-70">
                {isSubmitting ? "Saving..." : "Save Subject"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Edit Subject</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Code</label>
                  <input type="text" value={editSubCode} onChange={(e) => setEditSubCode(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Credits</label>
                  <select value={editCredits} onChange={(e) => setEditCredits(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none">
                    {[1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Name</label>
                <input type="text" value={editSubName} onChange={(e) => setEditSubName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grade</label>
                <select value={editGrade} onChange={(e) => setEditGrade(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-primary-600">
                  <option value="Pending">Pending (Not Graded)</option>
                  {gradingScale.map(item => <option key={item.grade} value={item.grade}>{item.grade}</option>)}
                </select>
              </div>

              <button type="submit" disabled={isEditing} className="w-full py-3.5 mt-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-70">
                {isEditing ? "Updating..." : "Update Subject"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSettings, saveSettings } from "@/lib/api";

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

const DEFAULT_CLASS_BOUNDARIES = [
  { name: "First Class", min: "3.70", max: "4.00" },
  { name: "Second Upper", min: "3.30", max: "3.69" },
  { name: "Second Lower", min: "3.00", max: "3.29" },
  { name: "Pass", min: "2.00", max: "2.99" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("grading");
  
  const [gradingScale, setGradingScale] = useState(DEFAULT_GRADING_SCALE);
  const [classBoundaries, setClassBoundaries] = useState(DEFAULT_CLASS_BOUNDARIES);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modals state
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [newGradeLabel, setNewGradeLabel] = useState("");
  const [newGradeGpa, setNewGradeGpa] = useState("");
  
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassMin, setNewClassMin] = useState("");
  const [newClassMax, setNewClassMax] = useState("");

  useEffect(() => {
    const fetchUserConfig = async () => {
      const userId = localStorage.getItem("gradeflow_user_id");
      if (!userId) return;
      
      try {
        const res = await getSettings(userId);
        if (res.status === "success" && res.data) {
          if (res.data.grading_scale) setGradingScale(JSON.parse(res.data.grading_scale));
          if (res.data.class_boundaries) setClassBoundaries(JSON.parse(res.data.class_boundaries));
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
      setLoading(false);
    };
    fetchUserConfig();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    const userId = localStorage.getItem("gradeflow_user_id");
    if (!userId) return;
    
    try {
      await saveSettings(userId, JSON.stringify(gradingScale), JSON.stringify(classBoundaries));
      alert("Settings saved successfully!");
    } catch (e) {
      alert("Failed to save settings.");
    }
    setSaving(false);
  };

  const handleDeleteGrade = (index: number) => {
    const updated = [...gradingScale];
    updated.splice(index, 1);
    setGradingScale(updated);
  };

  const handleDeleteClass = (index: number) => {
    const updated = [...classBoundaries];
    updated.splice(index, 1);
    setClassBoundaries(updated);
  };

  const handleAddGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGradingScale([...gradingScale, { grade: newGradeLabel, gpa: parseFloat(newGradeGpa).toFixed(2) }]);
    setShowAddGrade(false);
    setNewGradeLabel("");
    setNewGradeGpa("");
  };

  const handleAddClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClassBoundaries([...classBoundaries, { name: newClassName, min: parseFloat(newClassMin).toFixed(2), max: parseFloat(newClassMax).toFixed(2) }]);
    setShowAddClass(false);
    setNewClassName("");
    setNewClassMin("");
    setNewClassMax("");
  };

  const handleLogout = () => {
    localStorage.removeItem("gradeflow_user_id");
    localStorage.removeItem("gradeflow_user_name");
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="flex-1 p-6 relative flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 relative overflow-x-hidden min-h-screen pb-24">
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[20%] rounded-full bg-accent-500/10 blur-3xl" />
      
      <header className="mb-6 relative z-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure your grading system</p>
        </div>
        <button 
          onClick={handleSaveAll} 
          disabled={saving}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-primary-500 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
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
              <button onClick={() => setShowAddGrade(true)} className="text-sm font-semibold text-primary-600 hover:text-primary-500">
                + Add Grade
              </button>
            </div>
            
            <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-2">
              {gradingScale.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-slate-800 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm">
                      {item.grade}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.gpa}</span>
                    <button onClick={() => handleDeleteGrade(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={() => setGradingScale(DEFAULT_GRADING_SCALE)} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Reset to Standard 4.0
            </button>
          </div>
        )}

        {activeTab === "class" && (
          <div className="glass-card p-5 rounded-3xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Class Boundaries</h2>
              <button onClick={() => setShowAddClass(true)} className="text-sm font-semibold text-accent-500 hover:text-accent-400">
                + Add Class
              </button>
            </div>
            
            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2">
              {classBoundaries.map((item, i) => (
                <div key={i} className="glass-panel p-3 rounded-2xl flex justify-between items-center shadow-sm">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.name}</h4>
                  <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-2 text-xs font-bold shadow-inner">
                      <span className="text-accent-500">{item.min}</span>
                      <span className="text-slate-400">-</span>
                      <span className="text-slate-600 dark:text-slate-400">{item.max}</span>
                    </div>
                    <button onClick={() => handleDeleteClass(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setClassBoundaries(DEFAULT_CLASS_BOUNDARIES)} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Reset to Standard Boundaries
            </button>
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

      {/* Add Grade Modal */}
      {showAddGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Add Custom Grade</h3>
              <button onClick={() => setShowAddGrade(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddGradeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grade Label (e.g. A+)</label>
                <input type="text" value={newGradeLabel} onChange={(e) => setNewGradeLabel(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">GPA Value (e.g. 4.0)</label>
                <input type="number" step="0.01" value={newGradeGpa} onChange={(e) => setNewGradeGpa(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none" required />
              </div>
              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold shadow-lg">
                Add Grade
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Add Class Boundary</h3>
              <button onClick={() => setShowAddClass(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddClassSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class Name (e.g. First Class)</label>
                <input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Min GPA</label>
                  <input type="number" step="0.01" value={newClassMin} onChange={(e) => setNewClassMin(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max GPA</label>
                  <input type="number" step="0.01" value={newClassMax} onChange={(e) => setNewClassMax(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" required />
                </div>
              </div>
              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold shadow-lg">
                Add Class Boundary
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

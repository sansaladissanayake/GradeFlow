// src/lib/api.ts

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

async function localBackend(action: string, data: any) {
  if (typeof window === 'undefined') return { status: "error", message: "SSR" };

  const getDB = (key: string) => {
    const val = localStorage.getItem(`gradeflow_db_${key}`);
    return val ? JSON.parse(val) : [];
  };
  const setDB = (key: string, val: any) => {
    localStorage.setItem(`gradeflow_db_${key}`, JSON.stringify(val));
  };
  const getSettingsDB = () => {
    const val = localStorage.getItem(`gradeflow_db_settings`);
    return val ? JSON.parse(val) : {};
  };

  switch (action) {
    case 'getSemesters': {
      const sems = getDB('semesters').filter((s: any) => s.user_id === data.user_id);
      return { status: "success", data: sems };
    }
    case 'addSemester': {
      const sems = getDB('semesters');
      sems.push(data);
      setDB('semesters', sems);
      return { status: "success", data };
    }
    case 'getSubjects': {
      const subs = getDB('subjects').filter((s: any) => s.user_id === data.user_id);
      return { status: "success", data: subs };
    }
    case 'addSubject': {
      const subs = getDB('subjects');
      subs.push(data);
      setDB('subjects', subs);
      return { status: "success", data };
    }
    case 'updateSubject': {
      let subs = getDB('subjects');
      subs = subs.map((s: any) => s.id === data.id ? { ...s, ...data } : s);
      setDB('subjects', subs);
      return { status: "success", data };
    }
    case 'deleteSubject': {
      let subs = getDB('subjects');
      subs = subs.filter((s: any) => s.id !== data.id);
      setDB('subjects', subs);
      return { status: "success" };
    }
    case 'getSettings': {
      const settings = getSettingsDB()[data.user_id] || {};
      return { status: "success", data: settings };
    }
    case 'saveSettings': {
      const settings = getSettingsDB();
      settings[data.user_id] = {
        grading_scale: data.grading_scale,
        class_boundaries: data.class_boundaries
      };
      localStorage.setItem(`gradeflow_db_settings`, JSON.stringify(settings));
      return { status: "success" };
    }
    case 'getPlanner': {
      const planners = getDB('planner');
      return { status: "success", data: planners[data.user_id] || [], localOnly: true };
    }
    case 'savePlanner': {
      const planners = getDB('planner');
      planners[data.user_id] = JSON.parse(data.plans || '[]');
      localStorage.setItem('gradeflow_db_planner', JSON.stringify(planners));
      return { status: "success", data: planners[data.user_id], localOnly: true };
    }
    default:
      return { status: "error", message: "Unknown action" };
  }
}

export async function fetchFromAPI(action: string, data: Record<string, any> = {}) {
  if (!APPS_SCRIPT_URL) {
    return localBackend(action, data);
  }

  try {
    const payload = { action, data };
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.append("action", action);
    
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", 
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("API Network Error");

    const text = await response.text();
    try {
      const result = JSON.parse(text);
      return result;
    } catch (e) {
      console.warn("API returned invalid JSON (likely 404/Redirect). Falling back to local storage.");
      return localBackend(action, data);
    }
  } catch (error) {
    console.warn("API Fetch Error. Falling back to local storage.", error);
    return localBackend(action, data);
  }
}

// Service functions
export async function getSemesters(userId: string) {
  return fetchFromAPI('getSemesters', { user_id: userId });
}

export async function addSemester(semesterData: any) {
  return fetchFromAPI('addSemester', semesterData);
}

export async function getSubjects(userId: string) {
  return fetchFromAPI('getSubjects', { user_id: userId });
}

export async function addSubject(subjectData: any) {
  return fetchFromAPI('addSubject', subjectData);
}

export async function updateSubject(data: Record<string, any>) {
  return fetchFromAPI('updateSubject', data);
}

export async function deleteSubject(id: string, userId: string) {
  return fetchFromAPI('deleteSubject', { id, user_id: userId });
}
export async function getSettings(userId: string) {
  return fetchFromAPI('getSettings', { user_id: userId });
}

export async function saveSettings(userId: string, gradingScale: string, classBoundaries: string) {
  return fetchFromAPI('saveSettings', { user_id: userId, grading_scale: gradingScale, class_boundaries: classBoundaries });
}

export async function savePlanner(userId: string, plans: unknown[]) {
  return fetchFromAPI('savePlanner', { user_id: userId, plans: JSON.stringify(plans) });
}

export const swrFetcher = async ([action, userId]: [string, string]) => {
  const res = await fetchFromAPI(action, { user_id: userId });
  if (res.status === "success") {
    return res.data;
  }
  throw new Error(res.message || "Failed to fetch data");
};

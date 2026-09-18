// src/lib/api.ts

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

export async function fetchFromAPI(action: string, data: Record<string, any> = {}) {
  if (!APPS_SCRIPT_URL) {
    console.warn("NEXT_PUBLIC_APPS_SCRIPT_URL is not set. Using mock mode.");
    return { status: "error", message: "API not connected" };
  }

  try {
    const payload = { action, data };
    
    // Fix: Always append action to URL so it's not lost if Google redirects the POST request
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.append("action", action);
    
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", 
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API Fetch Error:", error);
    return { status: "error", message: "Network error" };
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

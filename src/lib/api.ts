// src/lib/api.ts

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

export async function fetchFromAPI(action: string, data: Record<string, any> = {}) {
  // If no URL is provided, return mock data or throw error based on your preference
  if (!APPS_SCRIPT_URL) {
    console.warn("NEXT_PUBLIC_APPS_SCRIPT_URL is not set. Using mock mode.");
    return { status: "error", message: "API not connected" };
  }

  try {
    const payload = { action, data };
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", 
        // Note: Google Apps script requires text/plain for CORS sometimes, or no-cors mode.
        // We parse it as JSON on the Apps Script side.
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

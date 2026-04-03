// Type definitions only — no mock data
export type UserRole = "student" | "teacher" | "admin";

export interface TimetableSlot {
  id: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  type: "lecture" | "lab" | "free";
}

export interface AttendanceRecord {
  date: string;
  present: boolean;
  subject: string;
}

export interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  duration: string;
  category: string;
}

export interface StudentInfo {
  name: string;
  rollNo: string;
  department: string;
  semester: number;
  attendancePercentage: number;
  interests: string[];
  goals: string[];
}

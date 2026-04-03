import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Clock, QrCode, ClipboardCheck, BookOpen, AlertCircle, ArrowRight, CalendarDays, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE } from "@/config/api";

interface TimetableSlot {
  day: string;
  time: string;
  subject: string;
  room: string;
  type: string;
}

interface AttendanceRecord {
  student: { name: string; email: string };
  class?: { name: string; subject: string };
  date: string;
  status: "Present" | "Absent";
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getISTDay() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return DAYS[now.getDay() - 1] || "";
}

function timeToMinutes(t: string) {
  const cleaned = t.replace(/\s*(AM|PM)/i, "").trim();
  const [h, m] = cleaned.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [upcomingClass, setUpcomingClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_BASE}/api/timetable/my`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/api/attendance/class`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/api/attendance/current-class`, { headers }).then(r => r.json()),
    ]).then(([ttData, attData, ccData]) => {
      if (ttData.data?.slots) setSlots(ttData.data.slots);
      if (attData.data) setRecords(attData.data);
      if (ccData.currentClass) setCurrentClass(ccData.currentClass);
      else if (ccData.upcomingClass) setUpcomingClass(ccData.upcomingClass);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Compute stats from real data
  const today = getISTDay();
  const todaySlots = slots
    .filter(s => s.day === today && s.type !== "free")
    .sort((a, b) => timeToMinutes(a.time.split(/[-–]/)[0]) - timeToMinutes(b.time.split(/[-–]/)[0]));

  const uniqueStudents = new Set(records.map(r => r.student?.email)).size;
  const presentCount = records.filter(r => r.status === "Present").length;
  const avgAttendance = records.length > 0 ? Math.round((presentCount / records.length) * 100) : null;

  // Students with < 75% attendance per subject
  const studentMap: Record<string, { total: number; present: number; name: string }> = {};
  records.forEach(r => {
    const key = r.student?.email;
    if (!key) return;
    if (!studentMap[key]) studentMap[key] = { total: 0, present: 0, name: r.student.name };
    studentMap[key].total++;
    if (r.status === "Present") studentMap[key].present++;
  });
  const lowAttendance = Object.values(studentMap).filter(s => s.total > 0 && (s.present / s.total) * 100 < 75);

  const activeCard = currentClass || upcomingClass;

  return (
    <DashboardLayout role="teacher" title="Faculty Operations HQ">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Students" value={loading ? "—" : uniqueStudents || "0"} icon={Users} color="primary" />
        <StatCard label="Avg Attendance" value={loading ? "—" : avgAttendance !== null ? `${avgAttendance}%` : "No data"} icon={ClipboardCheck} color="success" />
        <StatCard label="Classes Today" value={loading ? "—" : todaySlots.length} icon={Clock} color="warning" />
        <StatCard label="Low Attendance" value={loading ? "—" : lowAttendance.length} icon={AlertCircle} color="destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 flex flex-col gap-6">

          {/* Priority Action — current/upcoming class */}
          <div className="glass-card p-6 flex flex-col sm:flex-row gap-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="flex-1 z-10">
              <Badge variant="outline" className="text-xs bg-primary/20 text-primary border-primary/30 mb-3">
                {currentClass ? "🔴 Class Active Now" : upcomingClass ? "Priority Action" : "No Class Now"}
              </Badge>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading schedule...</div>
              ) : activeCard ? (
                <>
                  <h2 className="text-2xl font-display font-bold mb-2">
                    {activeCard.subject}
                    {upcomingClass && !currentClass && <span className="text-lg font-normal text-muted-foreground ml-2">— starts at {activeCard.time?.split(/[-–]/)[0]?.trim()}</span>}
                  </h2>
                  <p className="text-muted-foreground text-sm max-w-md mb-6">
                    {activeCard.room ? `${activeCard.room} · ` : ""}{activeCard.time}
                    {currentClass ? " · Class is live now." : " · Generate a QR code for early check-ins."}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-display font-bold mb-2">No classes today</h2>
                  <p className="text-muted-foreground text-sm max-w-md mb-6">
                    {slots.length === 0 ? "Upload your timetable to see your schedule here." : `No more classes on ${today}.`}
                  </p>
                </>
              )}
              <div className="flex gap-3">
                <Button onClick={() => navigate("/teacher/qr")} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <QrCode className="w-4 h-4 mr-2" /> Generate QR
                </Button>
                <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => navigate("/teacher/reports")}>
                  View Reports
                </Button>
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center w-32 relative z-10">
              <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full" />
              <QrCode className="w-20 h-20 text-primary animate-pulse" />
            </div>
          </div>

          {/* Insights — from real data */}
          <div className="glass-card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-warning" /> Attendance Insights
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Analyzing records...</div>
            ) : records.length === 0 ? (
              <div className="text-sm text-muted-foreground opacity-60 text-center py-4">
                No attendance data yet. Generate a QR and have students scan to see insights here.
              </div>
            ) : (
              <div className="space-y-4">
                {lowAttendance.length > 0 ? (
                  <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center shrink-0 mt-0.5"><Users className="w-4 h-4" /></div>
                    <div>
                      <h4 className="text-sm font-semibold text-destructive mb-1">Low Attendance Alert</h4>
                      <p className="text-xs text-muted-foreground">
                        {lowAttendance.length} student{lowAttendance.length > 1 ? "s" : ""} below 75% attendance:&nbsp;
                        <span className="text-foreground font-medium">{lowAttendance.slice(0, 3).map(s => s.name).join(", ")}{lowAttendance.length > 3 ? ` +${lowAttendance.length - 3} more` : ""}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-success/20 bg-success/5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0 mt-0.5"><ClipboardCheck className="w-4 h-4" /></div>
                    <div>
                      <h4 className="text-sm font-semibold text-success mb-1">Great Attendance!</h4>
                      <p className="text-xs text-muted-foreground">All students are maintaining above 75% attendance. Keep it up!</p>
                    </div>
                  </div>
                )}
                <div className="p-4 rounded-xl border border-info/20 bg-info/5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-info/20 text-info flex items-center justify-center shrink-0 mt-0.5"><BookOpen className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-info mb-1">Overall Attendance Rate</h4>
                    <p className="text-xs text-muted-foreground">
                      {presentCount} present out of {records.length} total records across all your classes.
                      {avgAttendance !== null && ` Class average: ${avgAttendance}%.`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Today's Schedule Sidebar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border bg-black/20 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Today's Schedule
            </h3>
            <Badge variant="outline" className="text-xs border-white/10">{today || "—"}</Badge>
          </div>
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
              </div>
            ) : todaySlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground opacity-50 text-center">
                <CalendarDays className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">{slots.length === 0 ? "No timetable uploaded yet." : `No classes on ${today}.`}</p>
                {slots.length === 0 && (
                  <Button variant="outline" size="sm" className="mt-3 border-white/20" onClick={() => navigate("/teacher/timetable")}>
                    Upload Timetable
                  </Button>
                )}
              </div>
            ) : (
              todaySlots.map((cls, i) => {
                const isActive = cls === (currentClass ? todaySlots.find(s => s.subject === currentClass.subject && s.time === currentClass.time) : null);
                const isNext = !currentClass && cls === todaySlots.find(s => s.subject === upcomingClass?.subject && s.time === upcomingClass?.time);
                return (
                  <div key={i} className={`p-4 rounded-xl border ${isActive ? "bg-primary/10 border-primary/30" : isNext ? "bg-warning/5 border-warning/20" : "bg-black/20 border-border"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-mono font-medium ${isActive ? "text-primary" : isNext ? "text-warning" : "text-muted-foreground"}`}>{cls.time}</span>
                      {isActive && <span className="flex items-center gap-1 text-[10px] text-primary uppercase font-bold tracking-wider animate-pulse"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> LIVE</span>}
                      {isNext && !isActive && <span className="text-[10px] text-warning uppercase font-bold tracking-wider">UP NEXT</span>}
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{cls.subject}</h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{cls.type}</span>
                      <span>{cls.room}</span>
                    </div>
                    {(isActive || isNext) && (
                      <Button variant="ghost" size="sm" className="w-full mt-3 h-8 text-xs bg-primary/20 text-primary hover:bg-primary/30" onClick={() => navigate("/teacher/qr")}>
                        Launch Session <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

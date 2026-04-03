import { useState, useEffect } from "react";
import { API_BASE } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Users, Loader2, ClipboardList, UserX, UserCheck, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AttendanceRecord {
  student: { name: string; email: string };
  date: string;
  status: "Present" | "Absent";
  class?: { name: string; subject: string };
}

interface RosterStudent {
  name: string;
  email: string;
}

type Tab = "present" | "absent";

export default function TeacherReports() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("present");
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterName, setRosterName] = useState("");

  useEffect(() => {
    // Load attendance records
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/attendance/class`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.data) setRecords(data.data);
      } catch (_) {}
      setLoading(false);
    })();

    // Load roster from localStorage
    try {
      const saved = localStorage.getItem("class_roster");
      if (saved) {
        const parsed = JSON.parse(saved);
        setRoster(parsed.students || []);
        setRosterName(parsed.name || "");
      }
    } catch {}
  }, [token]);

  const present = records.filter(r => r.status === "Present").length;
  const rate = records.length > 0 ? Math.round((present / records.length) * 100) : null;

  // Today's present student emails (from today's records)
  const today = new Date().toDateString();
  const todayPresentEmails = new Set(
    records
      .filter(r => r.status === "Present" && new Date(r.date).toDateString() === today)
      .map(r => r.student?.email?.toLowerCase())
      .filter(Boolean)
  );
  const todayPresentNames = new Set(
    records
      .filter(r => r.status === "Present" && new Date(r.date).toDateString() === today)
      .map(r => r.student?.name?.toLowerCase())
      .filter(Boolean)
  );

  // Absent = in roster but NOT in today's present list
  const absentStudents = roster.filter(s => {
    const emailMatch = s.email && todayPresentEmails.has(s.email.toLowerCase());
    const nameMatch = s.name && todayPresentNames.has(s.name.toLowerCase());
    return !emailMatch && !nameMatch;
  });

  return (
    <DashboardLayout role="teacher" title="Class Reports">

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{loading ? "—" : present}</p>
            <p className="text-xs text-muted-foreground">Total Present Records</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{loading ? "—" : rate !== null ? `${rate}%` : "—"}</p>
            <p className="text-xs text-muted-foreground">Overall Attendance Rate</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${absentStudents.length > 0 ? "bg-destructive/20" : "bg-muted/20"}`}>
            <UserX className={`w-5 h-5 ${absentStudents.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{roster.length > 0 ? absentStudents.length : "—"}</p>
            <p className="text-xs text-muted-foreground">Absent Today {roster.length === 0 && "(upload roster)"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-black/20 p-1 rounded-xl border border-white/5 w-fit">
        {(["present", "absent"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all
              ${tab === t ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
          >
            {t === "present" ? `✅ Present Records` : `❌ Absent Today`}
          </button>
        ))}
      </div>

      {/* Present Records Table */}
      {tab === "present" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-info" /> All Attendance Records
            </h2>
            {rate !== null && <Badge variant="secondary">{rate}% attendance</Badge>}
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading records...
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-muted-foreground opacity-60">
              <ClipboardList className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No attendance records yet.</p>
              <p className="text-xs mt-1">Generate a QR code from the QR page to start tracking.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-4 font-medium">Student</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium hidden sm:table-cell">Date</th>
                  <th className="text-left p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4 font-medium">{r.student?.name || "—"}</td>
                    <td className="p-4 text-muted-foreground text-xs">{r.student?.email || "—"}</td>
                    <td className="p-4 text-muted-foreground font-mono text-xs hidden sm:table-cell">
                      {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-4">
                      <Badge variant={r.status === "Present" ? "default" : "destructive"}>{r.status}</Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      )}

      {/* Absent Tab */}
      {tab === "absent" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <UserX className="h-4 w-4 text-destructive" /> Absent Students Today
            </h2>
            {roster.length > 0 && (
              <Badge variant="outline" className="text-xs border-white/10">
                From: {rosterName || "Class Roster"}
              </Badge>
            )}
          </div>

          {roster.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-muted-foreground opacity-70 text-center">
              <FileSpreadsheet className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium mb-1">No class roster uploaded yet</p>
              <p className="text-xs max-w-xs">Upload a CSV roster from the Timetable page to track which students are absent today.</p>
              <Button variant="outline" size="sm" className="mt-4 border-white/20 gap-2" onClick={() => navigate("/teacher/timetable")}>
                <FileSpreadsheet className="w-4 h-4" /> Go to Timetable → Upload Roster
              </Button>
            </div>
          ) : absentStudents.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-muted-foreground opacity-70 text-center">
              <UserCheck className="h-12 w-12 text-success mb-3 opacity-60" />
              <p className="text-sm font-medium text-success">All students present today! 🎉</p>
              <p className="text-xs mt-1 opacity-60">{roster.length} students checked against today's attendance.</p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-destructive/5 border-b border-destructive/10 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive font-medium">
                  {absentStudents.length} student{absentStudents.length > 1 ? "s" : ""} from your roster have NOT marked attendance today
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-4 font-medium">#</th>
                    <th className="text-left p-4 font-medium">Student Name</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {absentStudents.map((s, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-border/50 hover:bg-destructive/5 transition-colors"
                    >
                      <td className="p-4 text-muted-foreground text-xs font-mono">{i + 1}</td>
                      <td className="p-4 font-medium">{s.name}</td>
                      <td className="p-4 text-muted-foreground text-xs">{s.email || "—"}</td>
                      <td className="p-4">
                        <Badge variant="destructive" className="text-[10px]">Absent</Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </motion.div>
      )}
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/DashboardLayout";
import { API_BASE } from "@/config/api";
import { StatCard } from "@/components/StatCard";
import { Users, Clock, Sparkles, CalendarDays, BookOpen, AlertTriangle, Loader2, QrCode, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { QRScannerModal } from "@/components/QRScannerModal";
import { io } from "socket.io-client";

interface AttendanceRecord {
  _id: string;
  status: "Present" | "Absent";
  date: string;
  class?: { name: string };
  createdAt: string;
}

export default function StudentDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/attendance/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data) setAttendance(data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendance();

    const socket = io(API_BASE);
    socket.on("sessionStarted", () => {
      fetchAttendance();
    });
    socket.on("attendanceMarked", (data: any) => {
      if (data.studentId === user._id) {
         fetchAttendance();
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  // Re-fetch after scanner closes (to show new record)
  const handleScannerClose = () => {
    setShowScanner(false);
    fetchAttendance();
  };

  const totalClasses = attendance.length;
  const presentCount = attendance.filter(r => r.status === "Present").length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : null;
  const isLowAttendance = attendanceRate !== null && attendanceRate < 80;

  // Last 5 records for the history preview
  const recentRecords = [...attendance].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5);

  // Last attendance entry
  const lastRecord = recentRecords[0];
  const lastMarkedText = lastRecord
    ? `${lastRecord.status} · ${new Date(lastRecord.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
    : null;

  // Build weekly chart data
  const chartData = totalClasses > 0
    ? Object.entries(
        attendance.reduce((acc: Record<string, { total: number; present: number }>, r) => {
          const week = `Week ${Math.ceil(new Date(r.date).getDate() / 7)}`;
          if (!acc[week]) acc[week] = { total: 0, present: 0 };
          acc[week].total++;
          if (r.status === "Present") acc[week].present++;
          return acc;
        }, {})
      ).map(([name, v]) => ({ name, rate: Math.round((v.present / v.total) * 100) }))
    : [];

  return (
    <DashboardLayout role="student" title="Student Dashboard">
      {/* Scanner Modal */}
      <AnimatePresence>
        {showScanner && <QRScannerModal onClose={handleScannerClose} />}
      </AnimatePresence>

      {/* Low Attendance Alert */}
      {isLowAttendance && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl border border-warning/50 bg-warning/10 flex items-start sm:items-center gap-4"
        >
          <div className="p-2 rounded-full bg-warning/20 text-warning">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-warning">Low Attendance Warning</h3>
            <p className="text-sm text-muted-foreground">
              Your attendance is {attendanceRate}%. You risk losing eligibility for exams (threshold: 75%).
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Attendance" value={loading ? "—" : attendanceRate !== null ? `${attendanceRate}%` : "No data"} icon={Users} color={isLowAttendance ? "warning" : "success"} />
        <StatCard label="Classes Attended" value={loading ? "—" : `${presentCount}/${totalClasses}`} icon={BookOpen} color="info" />
        <StatCard label="Total Scans" value={loading ? "—" : totalClasses} icon={Clock} color="warning" />
        <StatCard label="AI Tasks" value={3} icon={Sparkles} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Charts column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* ✨ Scan QR Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent"
          >
            {/* Glow blobs */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/15 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Icon */}
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
                <motion.div
                  animate={{ scale: [1, 1.07, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <QrCode className="w-8 h-8 text-primary" />
                </motion.div>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-xl mb-1">Scan Attendance</h2>
                <p className="text-sm text-muted-foreground mb-1">
                  Scan the QR code shown by your teacher to mark your attendance instantly.
                </p>
                {lastMarkedText && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mt-1">
                    <History className="w-3 h-3" />
                    Last marked: <span className="text-foreground/80 font-medium">{lastMarkedText}</span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <Button
                onClick={() => setShowScanner(true)}
                className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-shadow"
                size="lg"
              >
                <QrCode className="w-5 h-5" />
                Scan QR Code
              </Button>
            </div>
          </motion.div>

          {/* Attendance Trend */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-success" /> Attendance Trend
              </h2>
              <Badge variant="outline" className="text-xs font-normal">Live Data</Badge>
            </div>

            {loading ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground opacity-40">
                <Users className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No records yet. Scan a QR code to start!</p>
              </div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="rate" stroke="hsl(var(--success))" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Profile + History */}
        <div className="flex flex-col gap-6">
          {/* Profile card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 bg-gradient-to-b from-card to-primary/5">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 shadow-xl shadow-primary/20">
                {user.name?.[0]?.toUpperCase() || "?"}
              </div>
              <h3 className="font-display font-bold text-lg">{user.name || "—"}</h3>
              <p className="text-xs text-muted-foreground">{user.email || "—"}</p>
            </div>
            <div className="flex justify-between text-center gap-2">
              <div className="flex-1 p-3 rounded-xl bg-black/20">
                <p className="text-xl font-bold text-success">{attendanceRate ?? "—"}{attendanceRate !== null ? "%" : ""}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Attendance</p>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-black/20">
                <p className="text-xl font-bold text-info">{presentCount}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Present</p>
              </div>
            </div>
          </motion.div>

          {/* Recent attendance history */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 flex flex-col gap-3 flex-1">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> Recent Attendance
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              </div>
            ) : recentRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 opacity-40 text-xs text-center text-muted-foreground">
                <QrCode className="w-8 h-8 mb-2 opacity-30" />
                Scan your first QR to see history here
              </div>
            ) : (
              recentRecords.map((r, i) => (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${r.status === "Present" ? "bg-success" : "bg-destructive"}`} />
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <Badge variant={r.status === "Present" ? "default" : "destructive"} className="text-[10px] h-5">
                    {r.status}
                  </Badge>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Upcoming Agenda placeholder */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-info" /> Schedule
            </h3>
            <p className="text-xs text-muted-foreground opacity-50 text-center py-3">
              Upload your timetable to see today's agenda
            </p>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

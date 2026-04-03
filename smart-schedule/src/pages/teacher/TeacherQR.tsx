import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ShieldCheck, RefreshCw, XCircle, QrCode,
  Clock, CalendarDays, Loader2, BookOpen, Wifi, WifiOff, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { io } from "socket.io-client";

interface TimetableSlot {
  day: string;
  time: string;
  subject: string;
  room: string;
  type: string;
}

interface AttendanceRecord {
  _id: string;
  student: { name: string; email: string };
  createdAt: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const QR_DURATION = 15;

function timeToMinutes(t: string) {
  if (!t) return 0;
  const cleaned = t.replace(/\s*(AM|PM)/i, "").trim();
  const [h, m] = cleaned.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getISTTime() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return { day: DAYS[now.getDay() - 1] || "Sunday", minutes: now.getHours() * 60 + now.getMinutes(), now };
}

function getSlotStatus(slot: TimetableSlot, currentDay: string, currentMinutes: number) {
  if (slot.day !== currentDay) return "other";
  const parts = slot.time.split(/[-–]/).map(s => s.trim());
  if (parts.length < 2) return "upcoming";
  const start = timeToMinutes(parts[0]);
  const end = timeToMinutes(parts[1]);
  if (currentMinutes >= start && currentMinutes < end) return "active";
  if (currentMinutes < start) return "upcoming";
  return "past";
}

export default function TeacherQR() {
  const token = localStorage.getItem("token");

  // Timetable state
  const [allSlots, setAllSlots] = useState<TimetableSlot[]>([]);
  const [todaySlots, setTodaySlots] = useState<TimetableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [currentDay, setCurrentDay] = useState("");
  const [currentMinutes, setCurrentMinutes] = useState(0);

  // QR state
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(QR_DURATION);
  const [isExpired, setIsExpired] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);

  // Attendance
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  // Clock tick — update current time every minute
  useEffect(() => {
    const update = () => {
      const { day, minutes } = getISTTime();
      setCurrentDay(day);
      setCurrentMinutes(minutes);
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

  // Fetch timetable
  useEffect(() => {
    (async () => {
      setLoadingTimetable(true);
      try {
        const res = await fetch(`${API_BASE}/api/timetable/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.data?.slots?.length) {
          setAllSlots(data.data.slots);
        }
      } catch { toast.error("Could not load timetable"); }
      finally { setLoadingTimetable(false); }
    })();
  }, [token]);

  // Filter today's slots whenever timetable or day changes
  useEffect(() => {
    if (!allSlots.length || !currentDay) return;
    const today = allSlots
      .filter(s => s.day === currentDay && s.type !== "free")
      .sort((a, b) => timeToMinutes(a.time.split(/[-–]/)[0]) - timeToMinutes(b.time.split(/[-–]/)[0]));
    setTodaySlots(today);

    // Auto-select active or next upcoming slot
    const active = today.find(s => getSlotStatus(s, currentDay, currentMinutes) === "active");
    const upcoming = today.find(s => getSlotStatus(s, currentDay, currentMinutes) === "upcoming");
    if (!selectedSlot) setSelectedSlot(active || upcoming || today[0] || null);
  }, [allSlots, currentDay, currentMinutes]);

  // Generate QR for a slot
  const generateQR = async (slot: TimetableSlot) => {
    setGeneratingQR(true);
    setQrToken(null);
    setRecords([]);

    // Capture Teacher Location Anti-Cheat
    let latitude;
    let longitude;
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (err) {
        console.warn("Geolocation denied/timed out. QR fallback generated without Geo-fencing.");
      }
    }

    try {
      // First get/create classId from backend
      const ccRes = await fetch(`${API_BASE}/api/attendance/current-class`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ccData = await ccRes.json();

      let resolvedClassId = ccData.currentClass?.classId;

      const qrRes = await fetch(`${API_BASE}/api/attendance/generate-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          classId: resolvedClassId,
          subject: slot.subject,   // fallback for ad-hoc
          time: slot.time,
          latitude,                // <--- Geolocation injection
          longitude                // <--- Geolocation injection
        })
      });
      const qrData = await qrRes.json();
      if (qrRes.ok) {
        setQrToken(qrData.qrToken);
        setClassId(qrData.classId || resolvedClassId);
        setTimeLeft(QR_DURATION);
        setIsExpired(false);
        setSelectedSlot(slot);
        toast.success(`QR generated for "${slot.subject}"`);
      } else {
        toast.error(qrData.message || "Failed to generate QR");
      }
    } catch { toast.error("Network error"); }
    finally { setGeneratingQR(false); }
  };

  // Socket.io for live attendance
  useEffect(() => {
    if (!classId) return;
    const socket = io(API_BASE);
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.emit("joinClassRoom", classId);

    // Fetch today's records
    fetch(`${API_BASE}/api/attendance/live/${classId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => { if (d.records) setRecords(d.records); });

    socket.on("attendanceMarked", (data: { studentName: string }) => {
      setRecords(prev => [{
        _id: Date.now().toString(),
        student: { name: data.studentName, email: "" },
        createdAt: new Date().toISOString()
      }, ...prev]);
      toast.success(`✅ ${data.studentName} marked attendance!`);
    });
    return () => { socket.disconnect(); setConnected(false); };
  }, [classId, token]);

  // QR countdown (Auto-looping Anti-cheat mechanics)
  useEffect(() => {
    if (!qrToken || isExpired || timeLeft <= 0) {
      if (timeLeft <= 0 && qrToken && !isExpired) {
        setIsExpired(true);
        // Force an automatic recursive regeneration so the student scan time is minimized seamlessly!
        if (selectedSlot) {
          generateQR(selectedSlot);
        }
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [qrToken, timeLeft, isExpired, selectedSlot]);

  const progress = (timeLeft / QR_DURATION) * 100;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const statusColors = {
    active: "border-success text-success bg-success/10",
    upcoming: "border-white/10 text-muted-foreground hover:border-primary/40 hover:bg-primary/5",
    past: "border-white/5 text-muted-foreground/40 opacity-50",
    other: "border-white/5"
  };

  return (
    <DashboardLayout role="teacher" title="QR Attendance · Live">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-7rem)]">

        {/* ── LEFT: Timetable Panel ── */}
        <div className="lg:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> Today's Schedule
            </h3>
            <Badge variant="outline" className="text-xs border-white/10">{currentDay || "—"}</Badge>
          </div>

          {loadingTimetable ? (
            <div className="flex-1 space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : todaySlots.length === 0 ? (
            <div className="flex-1 glass-card p-6 flex flex-col items-center justify-center text-center gap-3">
              <CalendarDays className="w-10 h-10 text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground opacity-60">
                {allSlots.length === 0 ? "No timetable uploaded yet." : `No classes on ${currentDay}.`}
              </p>
              {allSlots.length === 0 && (
                <Button variant="outline" size="sm" className="border-white/20 gap-1"
                  onClick={() => window.location.href = "/teacher/timetable"}>
                  Upload Timetable
                </Button>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {todaySlots.map((slot, i) => {
                const status = getSlotStatus(slot, currentDay, currentMinutes);
                const isSelected = selectedSlot === slot;
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: status === "past" ? 1 : 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => status !== "past" && setSelectedSlot(slot)}
                    className={`w-full text-left p-4 rounded-xl border transition-all glass-card relative overflow-hidden
                      ${isSelected ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : statusColors[status]}`}
                    disabled={status === "past"}
                  >
                    {status === "active" && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 text-[9px] text-success font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> LIVE
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`w-1 self-stretch rounded-full shrink-0 ${status === "active" ? "bg-success" : isSelected ? "bg-primary" : "bg-white/20"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{slot.subject}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {slot.time}
                        </p>
                        {slot.room && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <BookOpen className="w-3 h-3" /> {slot.room}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && status !== "past" && (
                      <Button
                        size="sm"
                        disabled={generatingQR}
                        onClick={(e) => { e.stopPropagation(); generateQR(slot); }}
                        className="w-full mt-3 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-1.5 text-xs h-8"
                      >
                        {generatingQR ? <Loader2 className="w-3 h-3 animate-spin" /> : <QrCode className="w-3 h-3" />}
                        Generate QR
                      </Button>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CENTER: QR Code ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-5 glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

          {/* Class Header */}
          <div className="text-center mb-6 z-10 px-4 w-full">
            {selectedSlot ? (
              <>
                <Badge variant="outline" className={`text-xs mb-2 ${getSlotStatus(selectedSlot, currentDay, currentMinutes) === "active" ? "border-success/40 text-success" : "border-white/20"}`}>
                  {getSlotStatus(selectedSlot, currentDay, currentMinutes) === "active" ? "🔴 LIVE NOW" : getSlotStatus(selectedSlot, currentDay, currentMinutes).toUpperCase()}
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-widest text-primary drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]">
                  {selectedSlot.subject}
                </h2>
                <div className="flex items-center justify-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selectedSlot.time}</span>
                  {selectedSlot.room && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{selectedSlot.room}</span>}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground opacity-50">
                <QrCode className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Select a class from today's schedule to generate a QR code</p>
              </div>
            )}
          </div>

          {/* QR + Ring */}
          {selectedSlot && (
            <>
              {!qrToken ? (
                <div className="z-10 flex flex-col items-center gap-5">
                  <div className="w-52 h-52 rounded-2xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-3 bg-white/2">
                    <QrCode className="w-16 h-16 text-muted-foreground opacity-20" />
                    <p className="text-xs text-muted-foreground opacity-50 text-center px-4">Click "Generate QR" in the schedule panel or below</p>
                  </div>
                  <Button
                    onClick={() => generateQR(selectedSlot)}
                    disabled={generatingQR}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 gap-2"
                  >
                    {generatingQR ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    Generate QR for {selectedSlot.subject}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative flex items-center justify-center z-10 w-72 h-72">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="144" cy="144" r={radius} className="stroke-muted/20" strokeWidth="7" fill="none" />
                      <circle
                        cx="144" cy="144" r={radius}
                        className={`transition-all duration-1000 ease-linear ${isExpired ? "stroke-destructive" : "stroke-primary"}`}
                        strokeWidth="7" fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        filter="url(#glow)"
                      />
                      <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                    </svg>

                    <div className={`p-3 bg-white rounded-2xl shadow-2xl relative transition-all duration-500 ${isExpired ? "opacity-20 blur-sm scale-95" : "opacity-100 scale-100"}`}>
                      <QRCodeSVG value={qrToken} size={168} level="Q" includeMargin={false} />
                    </div>

                    {isExpired && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                        <XCircle className="w-14 h-14 text-destructive mb-2 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]" />
                        <h3 className="text-xl font-bold text-destructive tracking-widest uppercase">Expired</h3>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-center z-10">
                    <div className={`font-mono text-4xl font-bold tracking-tight ${timeLeft <= 10 && !isExpired ? "text-destructive animate-pulse" : "text-foreground"}`}>
                      00:{timeLeft.toString().padStart(2, "0")}
                    </div>
                    <p className="text-muted-foreground text-xs mt-1 uppercase tracking-widest">Seconds Remaining</p>
                  </div>

                  {isExpired && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 z-10">
                      <Button onClick={() => generateQR(selectedSlot!)} disabled={generatingQR} size="lg"
                        className="bg-primary hover:bg-primary/80 shadow-[0_0_20px_rgba(0,255,255,0.4)] gap-2">
                        {generatingQR ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        New QR Code
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </>
          )}
        </motion.div>

        {/* ── RIGHT: Live Feed ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 glass-card flex flex-col overflow-hidden border-t-4 border-t-primary"
        >
          <div className="p-5 border-b border-border bg-card/40">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Live Attendance
              </h3>
              <div className="flex items-center gap-2">
                {classId && (
                  <div className="flex items-center gap-1 text-xs">
                    {connected
                      ? <><Wifi className="w-3 h-3 text-success" /><span className="text-success">Live</span></>
                      : <><WifiOff className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">Offline</span></>
                    }
                  </div>
                )}
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {records.length} Present
                </Badge>
              </div>
            </div>
            {selectedSlot && <p className="text-xs text-muted-foreground mt-1">{selectedSlot.subject} · {currentDay}</p>}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
            <AnimatePresence>
              {records.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-8 opacity-40"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-3">
                    <QrCode className="w-5 h-5 opacity-30" />
                  </div>
                  <p className="text-sm">{!qrToken ? "Generate a QR code first." : "Waiting for students to scan..."}</p>
                </motion.div>
              ) : (
                records.map((r, i) => (
                  <motion.div
                    key={r._id}
                    initial={{ opacity: 0, x: 30, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25, delay: i === 0 ? 0 : 0.03 * Math.min(i, 8) }}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-success/20 bg-success/5"
                  >
                    <div className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center font-bold text-success text-sm shrink-0">
                      {r.student.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.student.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

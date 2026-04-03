import { useState, useRef, useCallback, useEffect } from "react";
import { API_BASE } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, FileScan, CheckCircle2, Edit2, Save, Sparkles,
  Trash2, Plus, RotateCcw, Loader2, X, AlertCircle, Bot, PlusCircle,
  Users, FileSpreadsheet, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type PageState = "chooser" | "upload_idle" | "upload_preview" | "processing" | "ai_form" | "ai_generating" | "editing" | "saved";

interface RosterStudent {
  name: string;
  email: string;
}

interface TimetableSlot {
  day: string;
  time: string;
  subject: string;
  room: string;
  type: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Props { role: "student" | "teacher"; }

export default function TimetableUploadPage({ role }: Props) {
  const token = localStorage.getItem("token");
  const [pageState, setPageState] = useState<PageState>("chooser");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rosterInputRef = useRef<HTMLInputElement>(null);

  // Roster state
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterName, setRosterName] = useState("");

  // Load saved roster from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("class_roster");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRoster(parsed.students || []);
        setRosterName(parsed.name || "");
      } catch {}
    }
  }, []);

  // AI Form state
  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [preferences, setPreferences] = useState("");

  // Load existing timetable
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/timetable/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.data?.slots?.length > 0) {
          setSlots(data.data.slots);
          setConfidence(data.data.ocrConfidence);
          setPageState("editing");
        }
      } catch (_) {}
    })();
  }, []);

  // ── FILE HANDLING ──
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Only image files are supported"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setPageState("upload_preview");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  // ── OCR PROCESSING ──
  const handleProcessOCR = async () => {
    if (!imageFile) return;
    setPageState("processing");
    const formData = new FormData();
    formData.append("image", imageFile);
    try {
      const res = await fetch(`${API_BASE}/api/timetable/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSlots(data.slots || []);
        setConfidence(data.confidence);
        setMessage(data.message || "");
        setPageState("editing");
        if (!data.slots?.length) toast.warning("OCR could not parse. Add entries manually.");
        else toast.success(data.message);
      } else { toast.error(data.message || "Processing failed"); setPageState("upload_preview"); }
    } catch { toast.error("Network error"); setPageState("upload_preview"); }
  };

  // ── AI GENERATE ──
  const addSubject = () => {
    const s = subjectInput.trim();
    if (s && !subjects.includes(s)) setSubjects(p => [...p, s]);
    setSubjectInput("");
  };

  const handleAIGenerate = async () => {
    if (subjects.length === 0) { toast.error("Add at least one subject"); return; }
    setPageState("ai_generating");
    try {
      const res = await fetch(`${API_BASE}/api/ai/generate-timetable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subjects, daysPerWeek, hoursPerDay, preferences })
      });
      const data = await res.json();
      if (res.ok && data.slots?.length > 0) {
        setSlots(data.slots);
        setConfidence(null);
        setMessage(data.message);
        setPageState("editing");
        toast.success(`Groq AI generated ${data.slots.length} timetable slots! ✨`);
      } else {
        toast.error(data.message || "AI generation failed");
        setPageState("ai_form");
      }
    } catch { toast.error("Network error"); setPageState("ai_form"); }
  };

  // ── SAVE ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/timetable/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slots, confidence })
      });
      const data = await res.json();
      if (res.ok) { toast.success("Timetable saved! ✅"); setPageState("saved"); setTimeout(() => setPageState("editing"), 2000); }
      else toast.error(data.message || "Save failed");
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  const updateSlot = (i: number, field: keyof TimetableSlot, value: string) =>
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  const deleteSlot = (i: number) => setSlots(prev => prev.filter((_, idx) => idx !== i));
  const addSlot = () => setSlots(prev => [...prev, { day: "Monday", time: "09:00-10:00", subject: "", room: "", type: "lecture" }]);
  const reset = () => { setPageState("chooser"); setImagePreview(null); setImageFile(null); setSlots([]); setConfidence(null); setMessage(""); };

  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter(s => s.day === day);
    return acc;
  }, {} as Record<string, TimetableSlot[]>);

  // ── ROSTER CSV PARSE ──
  const handleRosterFile = (file: File) => {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.error("Please upload a CSV file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      // Skip header row if it contains 'name' or 'email'
      const start = lines[0]?.toLowerCase().includes("name") || lines[0]?.toLowerCase().includes("email") ? 1 : 0;
      const students: RosterStudent[] = lines.slice(start).map(line => {
        const cols = line.split(",").map(c => c.trim().replace(/"|'/g, ""));
        return { name: cols[0] || "", email: cols[1] || "" };
      }).filter(s => s.name);

      if (students.length === 0) { toast.error("Could not parse CSV. Format: name,email"); return; }

      const rosterData = { name: file.name.replace(".csv", ""), students };
      localStorage.setItem("class_roster", JSON.stringify(rosterData));
      setRoster(students);
      setRosterName(rosterData.name);
      toast.success(`✅ Roster saved: ${students.length} students loaded`);
    };
    reader.readAsText(file);
  };

  return (
    <DashboardLayout role={role} title="Timetable Intelligence">
      <AnimatePresence mode="wait">

        {/* ── CHOOSER ── */}
        {pageState === "chooser" && (
          <motion.div key="chooser" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="text-muted-foreground text-sm mb-8 text-center">Choose how to create your timetable</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Upload card */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPageState("upload_idle")}
                className="glass-card p-8 text-left flex flex-col gap-4 border border-white/10 hover:border-primary/40 transition-all group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl mb-2">Upload Image</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Upload a photo or screenshot of your printed timetable. Groq AI will extract and structure it automatically.
                  </p>
                </div>
                <Badge variant="outline" className="w-fit text-xs border-blue-500/30 text-blue-400">OCR + AI</Badge>
              </motion.button>

              {/* AI Generate card */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPageState("ai_form")}
                className="glass-card p-8 text-left flex flex-col gap-4 border border-white/10 hover:border-primary/40 transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bot className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl mb-2">Generate with AI</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Just enter your subjects and preferences — Groq llama-3.3-70b will create a complete weekly timetable for you.
                  </p>
                </div>
                <Badge variant="outline" className="w-fit text-xs border-primary/30 text-primary">Groq AI ✨</Badge>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── UPLOAD: IDLE ── */}
        {pageState === "upload_idle" && (
          <motion.div key="upload_idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <button onClick={() => setPageState("chooser")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6 transition-colors">
              ← Back
            </button>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all flex flex-col items-center gap-5
                ${isDragging ? "border-primary bg-primary/10" : "border-white/20 hover:border-primary/50 hover:bg-primary/5 glass-card"}`}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <UploadCloud className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">Upload Your Timetable</h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">Drag & drop or click to select a JPG, PNG, or WebP image</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2">
                <UploadCloud className="w-4 h-4" /> Select Image
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── UPLOAD: PREVIEW ── */}
        {pageState === "upload_preview" && imagePreview && (
          <motion.div key="upload_preview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6">
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10 max-w-2xl w-full">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Image ready</span>
                <button onClick={reset}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <img src={imagePreview} alt="Preview" className="w-full object-contain max-h-[400px] bg-black/20" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} className="gap-2 border-white/20"><RotateCcw className="w-4 h-4" /> Re-upload</Button>
              <Button onClick={handleProcessOCR} size="lg" className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <FileScan className="w-5 h-5" /> Extract with AI
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── PROCESSING ── */}
        {pageState === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center gap-6 py-20">
            <div className="relative w-32 h-40 rounded-xl border-2 border-primary bg-black/20 overflow-hidden">
              <div className="absolute inset-4 flex flex-col gap-3">
                {[1, 0.7, 1, 0.6, 0.8].map((w, i) => (
                  <motion.div key={i} className="h-2 bg-white/20 rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    style={{ width: `${w * 100}%` }}
                  />
                ))}
              </div>
              <motion.div animate={{ y: [0, 160, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_4px_hsl(var(--primary)/0.8)]" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold flex items-center gap-2 justify-center"><FileScan className="w-5 h-5 text-primary animate-pulse" /> Running OCR + Groq AI...</h3>
              <p className="text-sm text-muted-foreground mt-1">This may take 10–30 seconds</p>
            </div>
          </motion.div>
        )}

        {/* ── AI FORM ── */}
        {pageState === "ai_form" && (
          <motion.div key="ai_form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
            <button onClick={() => setPageState("chooser")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6 transition-colors">← Back</button>
            <div className="glass-card p-8 border border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl">Generate Timetable with Groq AI</h2>
                  <p className="text-xs text-muted-foreground">Powered by llama-3.3-70b-versatile</p>
                </div>
              </div>

              {/* Subjects */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Your Subjects / Courses *</label>
                <div className="flex gap-2 mb-3">
                  <input
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
                    placeholder="e.g. Data Structures, press Enter"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <Button variant="outline" size="sm" onClick={addSubject} className="gap-1 border-white/20">
                    <PlusCircle className="w-4 h-4" /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjects.length === 0 && <span className="text-xs text-muted-foreground opacity-50">No subjects added yet</span>}
                  {subjects.map(s => (
                    <motion.div key={s} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-1.5 rounded-full">
                      {s}
                      <button onClick={() => setSubjects(p => p.filter(x => x !== s))} className="hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Days per Week</label>
                  <select value={daysPerWeek} onChange={e => setDaysPerWeek(+e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                    {[3,4,5,6].map(d => <option key={d} value={d} className="bg-background">{d} days</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Hours per Day</label>
                  <select value={hoursPerDay} onChange={e => setHoursPerDay(+e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                    {[4,5,6,7,8].map(h => <option key={h} value={h} className="bg-background">{h} hours</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-8">
                <label className="text-sm font-medium mb-2 block">Preferences <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input
                  value={preferences}
                  onChange={e => setPreferences(e.target.value)}
                  placeholder="e.g. Labs on Friday, no classes before 9am..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <Button onClick={handleAIGenerate} disabled={subjects.length === 0} size="lg"
                className="w-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-2 text-base">
                <Sparkles className="w-5 h-5" /> Generate Timetable with AI
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── AI GENERATING ── */}
        {pageState === "ai_generating" && (
          <motion.div key="ai_gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center gap-6 py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </motion.div>
            <div className="text-center">
              <h3 className="text-xl font-semibold flex items-center gap-2 justify-center">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" /> Groq AI is building your timetable...
              </h3>
              <p className="text-sm text-muted-foreground mt-1">llama-3.3-70b is scheduling your {subjects.length} subjects</p>
            </div>
            <div className="flex gap-1.5">
              {[0, 0.2, 0.4].map(d => (
                <motion.div key={d} className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: d }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── EDITING TABLE ── */}
        {(pageState === "editing" || pageState === "saved") && (
          <motion.div key="editing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" /> Review & Edit Timetable
                </h2>
                {confidence !== null && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">OCR Confidence:</span>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${confidence >= 80 ? "bg-success" : confidence >= 50 ? "bg-warning" : "bg-destructive"}`}
                        style={{ width: `${confidence}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${confidence >= 80 ? "text-success" : confidence >= 50 ? "text-warning" : "text-destructive"}`}>{confidence}%</span>
                  </div>
                )}
                {message && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {message}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset} className="gap-1 border-white/20"><RotateCcw className="w-3.5 h-3.5" /> New</Button>
                <Button variant="outline" size="sm" onClick={addSlot} className="gap-1 border-white/20"><Plus className="w-3.5 h-3.5" /> Add Slot</Button>
                <Button size="sm" onClick={handleSave} disabled={saving || slots.length === 0}
                  className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Timetable"}
                </Button>
              </div>
            </div>

            {slots.length === 0 ? (
              <div className="glass-card p-16 text-center text-muted-foreground opacity-50">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No slots yet. Generate with AI or add manually.</p>
                <Button variant="outline" size="sm" onClick={addSlot} className="mt-4 border-white/20"><Plus className="w-3.5 h-3.5 mr-1" /> Add Slot</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {DAYS.map(day => {
                  const daySlots = slotsByDay[day] || [];
                  if (!daySlots.length) return null;
                  return (
                    <motion.div key={day} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                      <div className="px-5 py-3 bg-black/30 border-b border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <h3 className="font-semibold text-sm">{day}</h3>
                        <Badge variant="outline" className="ml-auto text-[10px] border-white/10">{daySlots.length} slots</Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/5 text-muted-foreground text-xs">
                              <th className="text-left p-3 font-medium w-36">Time</th>
                              <th className="text-left p-3 font-medium">Subject</th>
                              <th className="text-left p-3 font-medium hidden md:table-cell w-24">Room</th>
                              <th className="text-left p-3 font-medium hidden sm:table-cell w-24">Type</th>
                              <th className="p-3 w-10" />
                            </tr>
                          </thead>
                          <tbody>
                            {daySlots.map((slot) => {
                              const gi = slots.indexOf(slot);
                              return (
                                <tr key={gi} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                                  <td className="p-2"><input value={slot.time} onChange={e => updateSlot(gi, "time", e.target.value)} className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary/60 focus:outline-none px-1 py-0.5 text-xs font-mono transition-colors" /></td>
                                  <td className="p-2"><input value={slot.subject} onChange={e => updateSlot(gi, "subject", e.target.value)} placeholder="Subject..." className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary/60 focus:outline-none px-1 py-0.5 text-sm transition-colors placeholder:text-muted-foreground/40" /></td>
                                  <td className="p-2 hidden md:table-cell"><input value={slot.room} onChange={e => updateSlot(gi, "room", e.target.value)} placeholder="Room..." className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary/60 focus:outline-none px-1 py-0.5 text-xs transition-colors placeholder:text-muted-foreground/40" /></td>
                                  <td className="p-2 hidden sm:table-cell">
                                    <select value={slot.type} onChange={e => updateSlot(gi, "type", e.target.value)} className="bg-transparent text-xs border border-white/10 rounded-md px-2 py-1 focus:outline-none focus:border-primary/50">
                                      {["lecture","lab","free","other"].map(t => <option key={t} value={t} className="bg-background">{t}</option>)}
                                    </select>
                                  </td>
                                  <td className="p-2">
                                    <button onClick={() => deleteSlot(gi)} className="w-7 h-7 rounded-md hover:bg-destructive/20 hover:text-destructive flex items-center justify-center transition-colors text-muted-foreground">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── CLASS ROSTER UPLOAD (always visible when timetable saved/editing) ── */}
        {(pageState === "editing" || pageState === "saved") && (
          <motion.div
            key="roster"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6 border border-info/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-info/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-info/20 border border-info/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-info" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base">Class Roster</h3>
                  <p className="text-xs text-muted-foreground">Upload CSV to track absent students in Class Reports</p>
                </div>
              </div>
              {roster.length > 0 && (
                <Badge className="bg-info/10 text-info border-info/20 border text-xs w-fit">
                  <UserCheck className="w-3 h-3 mr-1.5" /> {roster.length} students · {rosterName}
                </Badge>
              )}
            </div>

            {roster.length > 0 ? (
              <div className="mb-4 max-h-40 overflow-y-auto scrollbar-thin space-y-1.5">
                {roster.slice(0, 8).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-lg">
                    <div className="w-5 h-5 rounded-full bg-info/20 text-info flex items-center justify-center font-bold text-[10px] shrink-0">
                      {s.name[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground truncate">{s.name}</span>
                    {s.email && <span className="ml-auto opacity-50 truncate">{s.email}</span>}
                  </div>
                ))}
                {roster.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center py-1">+ {roster.length - 8} more students</p>
                )}
              </div>
            ) : (
              <div className="mb-4 p-4 border border-dashed border-white/10 rounded-xl text-center">
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-xs text-muted-foreground opacity-60">No roster uploaded yet</p>
                <p className="text-[11px] text-muted-foreground opacity-40 mt-1">CSV format: <code className="bg-white/10 px-1 rounded">name,email</code> (one per row)</p>
              </div>
            )}

            <input
              ref={rosterInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleRosterFile(e.target.files[0])}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => rosterInputRef.current?.click()}
                variant="outline"
                className="gap-2 border-info/30 text-info hover:bg-info/10"
              >
                <UploadCloud className="w-4 h-4" />
                {roster.length > 0 ? "Replace Roster" : "Upload CSV Roster"}
              </Button>
              {roster.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    localStorage.removeItem("class_roster");
                    setRoster([]);
                    setRosterName("");
                    toast.success("Roster cleared");
                  }}
                >
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>

  );
}

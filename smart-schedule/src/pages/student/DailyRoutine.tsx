import { useState, useEffect } from "react";
import { API_BASE } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FocusMode } from "@/components/FocusMode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CalendarClock, Sparkles, Target, Clock, Play, Plus, X,
  BookOpen, Coffee, Loader2, RefreshCw, Bot, GraduationCap,
  Briefcase, Heart, Lightbulb, ChevronRight, CheckCircle2, Save
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Goal {
  _id?: string;
  text: string;
  category: "career" | "subject" | "personal" | "general";
}

interface RoutineBlock {
  time: string;
  title: string;
  type: "class" | "task" | "break";
  subject?: string;
  room?: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  category?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, any> = {
  career: Briefcase,
  subject: BookOpen,
  personal: Heart,
  general: Target,
};

const CATEGORY_COLORS: Record<string, string> = {
  career: "text-info bg-info/10 border-info/20",
  subject: "text-primary bg-primary/10 border-primary/20",
  personal: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  general: "text-warning bg-warning/10 border-warning/20",
};

const BLOCK_STYLE: Record<string, string> = {
  class: "border-l-4 border-primary bg-primary/5",
  task: "border-l-4 border-success bg-success/5",
  break: "border-l-4 border-muted bg-muted/10",
};

const BLOCK_BADGE: Record<string, string> = {
  class: "bg-primary/20 text-primary",
  task: "bg-success/20 text-success",
  break: "bg-muted/30 text-muted-foreground",
};

const BLOCK_ICON: Record<string, any> = {
  class: GraduationCap,
  task: Sparkles,
  break: Coffee,
};

// ─── Goal Chip ────────────────────────────────────────────────────────────────
function GoalChip({ goal, onRemove }: { goal: Goal; onRemove: () => void }) {
  const Icon = CATEGORY_ICONS[goal.category] || Target;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${CATEGORY_COLORS[goal.category]}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1 leading-snug">{goal.text}</span>
      <button
        onClick={onRemove}
        className="opacity-50 hover:opacity-100 transition-opacity ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Timeline Block ───────────────────────────────────────────────────────────
function TimelineBlock({
  block,
  index,
  onStartFocus,
}: {
  block: RoutineBlock;
  index: number;
  onStartFocus: (b: RoutineBlock) => void;
}) {
  const Icon = BLOCK_ICON[block.type] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative flex gap-4 group ${BLOCK_STYLE[block.type]} rounded-xl p-4 hover:shadow-md transition-shadow`}
    >
      {/* Time column */}
      <div className="w-24 shrink-0 text-right">
        <span className="text-xs font-mono text-muted-foreground leading-5">
          {block.time}
        </span>
      </div>

      {/* Dot on timeline */}
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
            block.type === "class"
              ? "bg-primary"
              : block.type === "task"
              ? "bg-success"
              : "bg-muted-foreground/30"
          }`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start gap-2 mb-1">
          <div className="flex items-center gap-1.5">
            <Icon className="w-4 h-4 shrink-0 opacity-70" />
            <h4 className="font-semibold text-sm leading-tight">{block.title}</h4>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${BLOCK_BADGE[block.type]}`}>
            {block.type}
          </span>
          {block.priority && block.type === "task" && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                block.priority === "high"
                  ? "bg-destructive/10 text-destructive"
                  : block.priority === "medium"
                  ? "bg-warning/10 text-warning"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {block.priority}
            </span>
          )}
        </div>

        {block.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {block.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {block.room && (
            <span className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3" /> {block.room}
            </span>
          )}
          {block.category && block.type === "task" && (
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" /> {block.category}
            </span>
          )}
        </div>
      </div>

      {/* Focus CTA */}
      {block.type === "task" && (
        <div className="shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            className="border-success/30 text-success hover:bg-success/10 text-xs"
            onClick={() => onStartFocus(block)}
          >
            <Play className="w-3 h-3 mr-1" /> Focus
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DailyRoutine() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Goals state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalCat, setNewGoalCat] = useState<Goal["category"]>("career");
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalsLoading, setGoalsLoading] = useState(true);

  // Routine state
  const [routine, setRoutine] = useState<RoutineBlock[]>([]);
  const [generating, setGenerating] = useState(false);
  const [routineMeta, setRoutineMeta] = useState<{ today?: string; classCount?: number; freeSlotCount?: number; goalCount?: number } | null>(null);

  // Focus overlay
  const [focusBlock, setFocusBlock] = useState<RoutineBlock | null>(null);

  // Load persisted goals on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/student/goals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.data) setGoals(data.data);
      } catch {
        /* silently ignore */
      } finally {
        setGoalsLoading(false);
      }
    })();
  }, []);

  const handleAddGoal = () => {
    const text = newGoalText.trim();
    if (!text) return;
    setGoals((prev) => [...prev, { text, category: newGoalCat }]);
    setNewGoalText("");
  };

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    try {
      const res = await fetch(`${API_BASE}/api/student/goals`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goals }),
      });
      if (res.ok) {
        toast.success("Goals saved!");
      } else {
        toast.error("Could not save goals");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingGoals(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setRoutine([]);
    setRoutineMeta(null);
    try {
      const res = await fetch(`${API_BASE}/api/ai/daily-routine`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setRoutine(data.data);
        setRoutineMeta({ today: data.today, ...data.meta });
        toast.success(`Routine generated for ${data.today}!`);
      } else {
        toast.error(data.message || "Could not generate routine");
      }
    } catch {
      toast.error("Network error — could not connect to AI");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout role="student" title="Daily Routine">
      {/* Focus overlay */}
      <FocusMode
        isOpen={!!focusBlock}
        onClose={() => setFocusBlock(null)}
        taskTitle={focusBlock?.title}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Goals panel ─────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-display font-bold text-lg">Long-term Goals</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-5">
                Your goals guide the AI when filling your free periods.
              </p>

              {/* Add goal input */}
              <div className="flex flex-col gap-2 mb-4">
                <select
                  value={newGoalCat}
                  onChange={(e) => setNewGoalCat(e.target.value as Goal["category"])}
                  className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="career">💼 Career</option>
                  <option value="subject">📚 Subject / Academic</option>
                  <option value="personal">💪 Personal Development</option>
                  <option value="general">🎯 General</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
                    placeholder="e.g. Become a data scientist"
                    className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button size="icon" onClick={handleAddGoal} className="shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Goal chips */}
              {goalsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : goals.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground opacity-50">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No goals yet — add one above
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <AnimatePresence>
                    {goals.map((g, i) => (
                      <GoalChip
                        key={g._id || i}
                        goal={g}
                        onRemove={() => setGoals((prev) => prev.filter((_, idx) => idx !== i))}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Save goals */}
              {goals.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-4 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={handleSaveGoals}
                  disabled={savingGoals}
                >
                  {savingGoals ? (
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 mr-2" />
                  )}
                  Save Goals
                </Button>
              )}
            </div>
          </motion.div>

          {/* Generate CTA card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 relative overflow-hidden border border-success/20 bg-gradient-to-br from-success/5 via-transparent to-transparent"
          >
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-success" />
                <h3 className="font-semibold">Generate My Day</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Groq AI will combine your timetable + free periods + goals into a personalised daily plan.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/20 font-semibold"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Building routine…
                  </>
                ) : (
                  <>
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Generate Routine
                  </>
                )}
              </Button>
              {routineMeta && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-black/20">
                    <p className="font-bold text-primary">{routineMeta.classCount}</p>
                    <p className="text-muted-foreground mt-0.5">Classes</p>
                  </div>
                  <div className="p-2 rounded-lg bg-black/20">
                    <p className="font-bold text-success">{routineMeta.freeSlotCount}</p>
                    <p className="text-muted-foreground mt-0.5">Free slots</p>
                  </div>
                  <div className="p-2 rounded-lg bg-black/20">
                    <p className="font-bold text-warning">{routineMeta.goalCount}</p>
                    <p className="text-muted-foreground mt-0.5">Goals</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-4"
          >
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Legend</h4>
            <div className="flex flex-col gap-2 text-xs">
              {[
                { type: "class", label: "Class / Lecture", color: "bg-primary" },
                { type: "task", label: "AI-suggested task", color: "bg-success" },
                { type: "break", label: "Break / Meal", color: "bg-muted-foreground/30" },
              ].map((l) => (
                <div key={l.type} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                  <span className="text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Right: Timeline ───────────────────────────────────── */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-6 min-h-[500px]"
          >
            {/* Timeline header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-bold text-xl flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-primary" />
                  {routineMeta?.today ? `${routineMeta.today}'s Routine` : "Daily Timeline"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {routine.length > 0
                    ? `${routine.filter((b) => b.type === "class").length} classes · ${routine.filter((b) => b.type === "task").length} AI tasks`
                    : "Generate your routine to see the full day plan"}
                </p>
              </div>
              {routine.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="gap-2 border-white/10"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              )}
            </div>

            {/* States */}
            <AnimatePresence mode="wait">
              {generating && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 gap-4"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center">
                      <Bot className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">Groq AI is building your day…</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Analysing timetable, free slots & goals
                    </p>
                  </div>
                </motion.div>
              )}

              {!generating && routine.length === 0 && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 opacity-40"
                >
                  <CalendarClock className="w-14 h-14 mb-4 opacity-30" />
                  <p className="text-sm text-muted-foreground text-center">
                    Add your goals and click<br />
                    <strong>Generate Routine</strong> to see your personalised day
                  </p>
                </motion.div>
              )}

              {!generating && routine.length > 0 && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-2"
                >
                  {/* Completion summary */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-success/5 border border-success/20 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <p className="text-xs text-success font-medium">
                      {routine.length} blocks planned · Hover any task and click <strong>Focus</strong> to start a timer
                    </p>
                  </div>

                  {/* Blocks */}
                  {routine.map((block, i) => (
                    <TimelineBlock
                      key={i}
                      block={block}
                      index={i}
                      onStartFocus={(b) => {
                        setFocusBlock(b);
                        toast.success(`Focus mode: ${b.title}`);
                      }}
                    />
                  ))}

                  {/* End of day */}
                  <div className="flex gap-4 items-center mt-2 opacity-30">
                    <div className="w-24 text-right">
                      <span className="text-xs font-mono text-muted-foreground">22:00</span>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/20 shrink-0" />
                    <p className="text-xs text-muted-foreground italic">End of planned day</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

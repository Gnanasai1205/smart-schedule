import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileScan, CheckCircle2, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type OCRState = "idle" | "scanning" | "success";

export default function StudentTimetable() {
  const [ocrState, setOcrState] = useState<OCRState>("idle");
  const [isEditing, setIsEditing] = useState(false);

  const handleUpload = () => {
    setOcrState("scanning");
    setTimeout(() => {
      setOcrState("success");
    }, 2500);
  };

  return (
    <DashboardLayout role="student" title="Timetable Intelligence">
      <AnimatePresence mode="wait">
        {ocrState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl mx-auto mt-10"
          >
            <div
              className="border-2 border-dashed border-primary/30 rounded-3xl p-12 text-center glass-card hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer group flex flex-col items-center justify-center gap-4"
              onClick={handleUpload}
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-foreground/90">Import Official Schedule</h3>
                <p className="text-sm text-muted-foreground w-3/4 mx-auto">
                  Drag and drop a PDF, image, or screenshot of your university timetable. Our OCR engine will automatically map classes, rooms, and free slots.
                </p>
              </div>
              <Button className="mt-4 bg-foreground text-background">Select File</Button>
            </div>
          </motion.div>
        )}

        {ocrState === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl mx-auto mt-20 flex flex-col items-center text-center"
          >
            <div className="relative w-32 h-40 rounded-lg border-2 border-primary overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.2)]">
              <div className="absolute inset-4 flex flex-col gap-3">
                <div className="h-2 w-3/4 bg-white/20 rounded-full" />
                <div className="h-2 w-full bg-white/20 rounded-full" />
                <div className="h-2 w-5/6 bg-white/20 rounded-full" />
                <div className="h-2 w-full bg-white/20 rounded-full" />
                <div className="h-2 w-2/3 bg-white/20 rounded-full" />
              </div>
              <motion.div
                animate={{ y: [0, 160, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(0,255,255,1)] z-10"
              />
            </div>
            <h3 className="text-xl font-display font-medium mt-8 mb-2 flex items-center gap-2">
              <FileScan className="w-5 h-5 text-primary animate-pulse" />
              Extracting Timetable Data...
            </h3>
            <p className="text-sm text-muted-foreground">Running ML Vision models to parse blocks.</p>
          </motion.div>
        )}

        {ocrState === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-semibold">Ready to Save</h2>
                  <p className="text-sm text-muted-foreground">Your timetable has been extracted. Review and edit below.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setOcrState("idle")}>
                  <X className="w-4 h-4 mr-2" /> Discard
                </Button>
                {isEditing ? (
                  <Button size="sm" onClick={() => setIsEditing(false)} className="bg-success hover:bg-success/90 text-success-foreground">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-2" /> Edit Grid
                  </Button>
                )}
              </div>
            </div>

            <div className="glass-card overflow-hidden border border-white/10 rounded-2xl shadow-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-black/20">
                    <th className="text-left p-4 font-medium w-32">Time</th>
                    <th className="text-left p-4 font-medium">Subject</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">Teacher</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Room</th>
                    <th className="text-left p-4 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground opacity-50 text-sm">
                      No timetable data extracted. Upload an actual schedule image to populate this table.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

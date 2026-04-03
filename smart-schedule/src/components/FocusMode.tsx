import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, RotateCcw, BrainCircuit } from "lucide-react";
import { Button } from "./ui/button";

export function FocusMode({ isOpen, onClose, taskTitle }: { isOpen: boolean; onClose: () => void; taskTitle?: string }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Could play a sound here
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-2xl"
        >
          {/* Close button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="absolute top-6 right-6 text-muted-foreground hover:text-foreground hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="flex flex-col items-center justify-center max-w-md w-full text-center px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 shadow-[0_0_50px_rgba(0,255,255,0.15)] glow-border">
                <BrainCircuit className="w-10 h-10 text-primary" />
              </div>

              <h2 className="text-2xl font-display font-medium text-muted-foreground mb-1 tracking-wide">
                Deep Work Session
              </h2>
              {taskTitle && (
                <p className="text-sm text-primary/80 mb-4 font-medium">{taskTitle}</p>
              )}

              {/* Timer Display */}
              <div className="relative mb-12">
                <motion.div 
                  animate={isActive ? { scale: [1, 1.02, 1] } : {}} 
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="text-8xl md:text-9xl font-mono font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50 drop-shadow-lg"
                >
                  {formatTime(timeLeft)}
                </motion.div>
                {isActive && (
                  <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10 animate-pulse-glow" />
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-6">
                <Button 
                  onClick={toggleTimer}
                  size="lg" 
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isActive 
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-secondary/20" 
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30 hover:scale-105"
                  }`}
                >
                  {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>

                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={resetTimer}
                  className="w-12 h-12 rounded-full border-white/10 hover:bg-white/10 hover:text-foreground text-muted-foreground transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>

              <p className="mt-12 text-sm text-muted-foreground max-w-xs leading-relaxed">
                Stay focused. All notifications are muted. Only structured intervals will trigger alarms.
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("light", !dark);
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="relative w-14 h-7 rounded-full bg-muted border border-border flex items-center transition-colors hover:border-primary/30"
      aria-label="Toggle theme"
    >
      <motion.div
        className="absolute w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        animate={{ x: dark ? 4 : 30 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {dark ? <Moon className="h-3 w-3 text-primary-foreground" /> : <Sun className="h-3 w-3 text-primary-foreground" />}
      </motion.div>
    </button>
  );
}

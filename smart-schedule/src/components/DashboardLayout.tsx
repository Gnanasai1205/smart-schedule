import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserRole } from "@/lib/mock-data";
import { Bell, Search, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AIMentorChat } from "./AIMentorChat";
import { FocusMode } from "./FocusMode";

interface DashboardLayoutProps {
  role: UserRole;
  children: React.ReactNode;
  title: string;
}

export function DashboardLayout({ role, children, title }: DashboardLayoutProps) {
  const [focusModeOpen, setFocusModeOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative overflow-hidden">
        <AppSidebar role={role} />
        <div className="flex-1 flex flex-col min-w-0 z-10">
          <header className="h-14 flex items-center gap-3 border-b border-border px-4 bg-background/80 backdrop-blur-lg sticky top-0 z-30">
            <SidebarTrigger />
            <h1 className="text-lg font-display font-semibold truncate">{title}</h1>
            <div className="ml-auto flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFocusModeOpen(true)}
                className="hidden md:flex gap-2 text-primary hover:text-primary hover:bg-primary/10 border border-primary/20 bg-primary/5 transition-all"
              >
                <BrainCircuit className="h-4 w-4" /> Focus Mode
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              </Button>
              <ThemeToggle />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold ml-1 shadow-lg shadow-primary/20">
                {role[0].toUpperCase()}
              </div>
            </div>
          </header>
          <motion.main
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="page-container relative"
          >
            {children}
          </motion.main>
        </div>

        {/* Global Components */}
        <AIMentorChat />
        <FocusMode isOpen={focusModeOpen} onClose={() => setFocusModeOpen(false)} />
      </div>
    </SidebarProvider>
  );
}

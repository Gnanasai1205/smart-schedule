import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  QrCode,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const roles = [
  {
    key: "student",
    label: "Student",
    icon: GraduationCap,
    desc: "View class timetables and receive personalized AI study plans.",
    path: "/auth?role=student",
    gradient: "from-primary/30 to-secondary/10",
    iconBg: "",
    textColor: "text-foreground"
  },
  {
    key: "teacher",
    label: "Teacher",
    icon: BookOpen,
    desc: "Generate dynamic QR codes for secure, instant attendance.",
    path: "/auth?role=teacher",
    gradient: "from-secondary/30 to-accent/10",
    iconBg: "",
    textColor: "text-foreground"
  },
  {
    key: "admin",
    label: "Admin",
    icon: ShieldCheck,
    desc: "Monitor campus metrics and engagement through live analytics.",
    path: "/auth?role=admin",
    gradient: "from-accent/30 to-primary/10",
    iconBg: "",
    textColor: "text-foreground"
  }
];

const features = [
  {
    icon: Sparkles,
    label: "AI Suggestions",
    desc: "Machine learning algorithms optimize free time with automated tasks."
  },
  {
    icon: Zap,
    label: "Real-time Sync",
    desc: "WebSockets ensure dashboards reflect attendance instantaneously."
  },
  {
    icon: Shield,
    label: "Secure QR Check-in",
    desc: "Rolling 60s expiration completely eliminates proxy attendance."
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">

      {/* Animated Glowing Blur Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ x: [0, 20, -20, 0], y: [0, -20, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px]"
        />
        <motion.div
          animate={{ x: [0, -30, 30, 0], y: [0, 30, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-secondary/20 blur-[150px]"
        />
        <div className="absolute top-[30%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent/15 blur-[150px]" />

        {/* Crisp grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-white/5 py-4 px-6 md:px-10 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <span className="font-display font-extrabold text-xl tracking-wide">
            SmartCurriculum
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <ThemeToggle />

          <Button onClick={() => navigate("/auth?role=student")} className="bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:shadow-[0_0_25px_rgba(0,255,255,0.6)] transition-all">
            Get Started
          </Button>
        </motion.div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full">

        {/* --- HERO SECTION --- */}
        <section className="w-full flex flex-col items-center text-center px-4 pt-24 pb-16">

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-5xl sm:text-7xl md:text-8xl font-display font-black tracking-tighter leading-[1.05] mb-6 max-w-5xl"
          >
            The Future of <br className="hidden sm:block" />
            <span className="pb-2 drop-shadow-sm">
              Attendance & Planning
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10 font-light"
          >
            Transform your campus operations with our infinitely scalable SaaS platform. Live WebSockets, cryptographic QR logic, and AI-driven insights.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth?role=student")}
              className="bg-foreground text-background hover:bg-muted-foreground w-full sm:w-auto h-14 px-8 text-lg rounded-xl font-bold transition-transform hover:scale-105 active:scale-95"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

          </motion.div>
        </section>

        {/* --- DASHBOARD MOCK PREVIEW --- */}
        <section id="demo" className="w-full max-w-6xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden glass-card border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] bg-slate-900/40"
          >
            {/* Window controls */}
            <div className="absolute top-0 w-full h-10 border-b border-white/10 bg-black/40 flex items-center px-4 gap-2 z-20">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <div className="ml-4 text-xs font-mono text-white/40">app.smartcurriculum.io</div>
            </div>

            {/* Dashboard Content Mock */}
            <div className="pt-10 h-full w-full p-6 flex flex-col md:flex-row gap-6 relative">
              {/* Sidebar Mock */}
              <div className="hidden md:flex flex-col w-48 gap-4 border-r border-white/10 pr-4">
                <div className="h-8 w-full bg-white/5 rounded" />
                <div className="flex flex-col gap-2 mt-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-6 w-full bg-white/5 rounded flex-shrink-0" />)}
                </div>
              </div>

              {/* Main Content Mock */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="h-6 w-32 bg-white/10 rounded mb-2" />
                    <div className="h-4 w-48 bg-white/5 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 glass-card bg-white/5 rounded-xl border-white/5 p-4 flex flex-col justify-between relative overflow-hidden">
                      <div className="h-4 w-12 bg-white/10 rounded" />
                      <div className="h-8 w-20 bg-primary/20 rounded" />
                      {/* Decorative chart line */}
                      <svg className="absolute bottom-0 right-0 w-full h-1/2 text-primary opacity-20" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0,100 L20,70 L40,80 L60,40 L80,50 L100,10" fill="none" stroke="currentColor" strokeWidth="4" />
                      </svg>
                    </div>
                  ))}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 relative min-h-[200px]">
                  <div className="md:col-span-2 glass-card bg-white/5 rounded-xl border-white/5 p-4 flex flex-col items-center justify-center">
                    <BarChart3 className="w-16 h-16 text-secondary/30 mb-4" />
                    <div className="text-sm text-foreground/50">Live Attendance Trends Analysis</div>
                  </div>
                  <div className="glass-card bg-white/5 rounded-xl border-white/5 p-4 flex flex-col items-center justify-center relative shadow-[0_0_30px_rgba(255,0,128,0.1)]">
                    <QrCode className="w-24 h-24 text-accent animate-pulse-glow" />
                    <div className="mt-4 text-xs font-mono text-accent">Expires in: 59s</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Holographic overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 mix-blend-screen pointer-events-none" />
          </motion.div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section className="w-full max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Unrivaled <span className="text-primary">Engineering</span></h2>
            <p className="text-muted-foreground w-full max-w-2xl mx-auto">Built from the ground up to solve complex scheduling schemas effortlessly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group p-8 rounded-3xl glass-card bg-card/40 border-white/5 hover:border-primary/40 hover:bg-card/60 transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 group-hover:border-primary/30 transition-all duration-500">
                  <f.icon className="w-7 h-7 text-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.label}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- PORTALS SECTION --- */}
        <section id="roles" className="w-full max-w-6xl mx-auto px-4 py-20 mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Choose your <span className="text-secondary">Workspace</span></h2>
            <p className="text-muted-foreground w-full max-w-2xl mx-auto">Different interfaces optimized entirely for your specific objectives.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role, i) => (
              <motion.div
                key={role.key}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="h-full"
              >
                <button
                  onClick={() => navigate(role.path)}
                  className="w-full h-full text-left p-8 rounded-3xl relative overflow-hidden group glass-card border border-white/10 hover:border-white/20 transition-all duration-500 flex flex-col focus:outline-none"
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${role.gradient} transition-opacity duration-500 blur-xl`} />

                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className={`w-14 h-14 rounded-2xl ${role.iconBg} flex items-center justify-center mb-6 shadow-xl transform group-hover:-translate-y-1 transition-transform duration-300`}>
                      <role.icon className={`h-7 w-7 ${role.textColor}`} />
                    </div>

                    <h3 className="text-2xl font-bold mb-3 tracking-tight">{role.label}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6 flex-1 text-sm md:text-base">
                      {role.desc}
                    </p>

                    <div className={`flex items-center gap-2 ${role.textColor} font-semibold text-sm mt-auto transform group-hover:translate-x-1 transition-transform`}>
                      Launch Interface <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-muted-foreground bg-background/80 backdrop-blur-lg">
        <p>Smart Curriculum © 2026. Next-generation scalable attendance infrastructure.</p>
      </footer>
    </div>
  );
}

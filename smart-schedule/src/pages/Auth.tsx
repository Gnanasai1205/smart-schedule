import { useState } from "react";
import { API_BASE } from "@/config/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, ArrowLeft, Mail, Lock, User, AlertCircle, EyeOff, Eye, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin ? { email, password } : { name, email, password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.errors?.[0]?.msg || "Authentication failed");
      }

      if (isLogin) {
        // Save token & redirect to proper dashboard
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        const userRole = data.role.toLowerCase();
        
        if (userRole === "admin") navigate("/admin/dashboard");
        else if (userRole === "teacher") navigate("/teacher/dashboard");
        else navigate("/student/dashboard");
      } else {
        // Registration success (Pending state)
        setSuccess(data.message || "Your account is under review. Please wait for admin approval.");
        setIsLogin(true); // switch back to login mode so they can read the message
        setPassword("");
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-info/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display font-bold text-lg hidden sm:block">SmartCurriculum</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass-card-hover p-8 md:p-10 flex flex-col items-center text-center relative overflow-hidden">
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-info to-primary" />

            <div className="mb-6 p-4 rounded-full bg-primary/10 border border-primary/20">
              <ShieldAlert className="w-10 h-10 text-primary" />
            </div>

            <h1 className="text-3xl font-display font-bold mb-2 tracking-tight">
              {isLogin ? "Secure Login" : "Join SmartCurriculum"}
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              {isLogin
                ? "Access your authorized portal."
                : "Submit a request to access the platform."}
            </p>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 text-left">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2 text-left"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="flex-1 leading-snug">{error}</span>
                  </motion.div>
                )}
                
                {success && isLogin && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex items-start gap-2 text-left"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="flex-1 leading-snug">{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        required={!isLogin}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative flex items-center group">
                  <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="••••••••"
                  />
                  <div 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full mt-4 font-semibold shadow-md shadow-primary/20 transition-all relative">
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-t-2 border-r-2 border-primary-foreground animate-spin" />
                ) : (
                  isLogin ? "Log In" : "Request Access"
                )}
              </Button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Need a platform account?" : "Already requested access?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccess("");
                }}
                className="text-primary font-medium hover:underline focus:outline-none"
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </div>
            
            <div className="absolute top-4 right-4 flex gap-1.5 opacity-30 pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <div className="w-1.5 h-1.5 rounded-full bg-info" />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

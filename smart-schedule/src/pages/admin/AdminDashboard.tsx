import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Server, Activity, ShieldCheck, Database, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin" title="Global Infrastructure Command">
      {/* Prime Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Enrolled" value="2,405" icon={Users} color="primary" trend="+12" />
        <StatCard label="Campus Avg Attendance" value="89%" icon={Activity} color="success" trend="+4.5%" />
        <StatCard label="Live QR Sessions" value="24" icon={Server} color="warning" />
        <StatCard label="System Security" value="100%" icon={ShieldCheck} color="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Infrastructure Heartbeat
            </h2>
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 animate-pulse">
              ALL SYSTEMS OPTIMAL
            </Badge>
          </div>
          
          <div className="space-y-6 bg-black/20 p-6 rounded-2xl border border-white/5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 font-mono text-muted-foreground"><Database className="w-4 h-4 text-info" /> DB Instances</span>
                <span className="font-medium">42% Load</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-info w-[42%] rounded-full shadow-[0_0_10px_rgba(0,150,255,0.5)]" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 font-mono text-muted-foreground"><Cpu className="w-4 h-4 text-warning" /> AI Processing Nodes</span>
                <span className="font-medium">78% Load</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-warning w-[78%] rounded-full shadow-[0_0_10px_rgba(255,165,0,0.5)]" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 font-mono text-muted-foreground"><Activity className="w-4 h-4 text-success" /> WebSocket Traffic</span>
                <span className="font-medium">2.4k conn/s</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-success w-[65%] rounded-full shadow-[0_0_10px_rgba(0,255,100,0.5)]" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Global Alert Log */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border bg-card/40 backdrop-blur-md">
            <h3 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Security & Access Log
            </h3>
          </div>
          <div className="flex-1 p-4 space-y-3 bg-gradient-to-b from-background/50 to-background/10">
            {[
              { time: "2m ago", evt: "Admin Login (IP: 192.168.1.5)", ok: true },
              { time: "15m ago", evt: "Proxy Prevention Triggered (CSE301)", ok: false },
              { time: "1h ago", evt: "QR Session #49X2 completed", ok: true },
              { time: "2h ago", evt: "Database Snapshot Backed Up", ok: true },
              { time: "5h ago", evt: "New Faculty Registered: Dr. Smith", ok: true },
            ].map((log, i) => (
              <div key={i} className="flex gap-3 text-sm p-3 rounded-lg border border-white/5 bg-black/10">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.ok ? 'bg-success shadow-[0_0_8px_rgba(0,255,100,0.5)]' : 'bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.5)] animate-pulse'}`} />
                <div>
                  <p className={`font-medium ${!log.ok ? 'text-destructive' : 'text-foreground'}`}>{log.evt}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

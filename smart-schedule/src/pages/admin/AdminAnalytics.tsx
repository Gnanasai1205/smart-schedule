import { DashboardLayout } from "@/components/DashboardLayout";
import { BarChart3, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const departmentData = [
  { name: "CSE", active: 850, inactive: 40 },
  { name: "ECE", active: 520, inactive: 30 },
  { name: "MECH", active: 410, inactive: 55 },
  { name: "CIV", active: 300, inactive: 25 },
];

const engagementData = [
  { day: "Mon", rate: 92 },
  { day: "Tue", rate: 89 },
  { day: "Wed", rate: 94 },
  { day: "Thu", rate: 85 },
  { day: "Fri", rate: 78 },
];

export default function AdminAnalytics() {
  return (
    <DashboardLayout role="admin" title="Global Analytics">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
        
        {/* Attendance Trends */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 flex flex-col h-full border-t-4 border-t-primary">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Campus Engagement Trends
            </h2>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorPrimary)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Department Breakdowns */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6 flex flex-col h-full border-t-4 border-t-secondary">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-secondary" />
              Department Enrollment
            </h2>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="active" stackId="a" fill="hsl(var(--success))" radius={[0, 0, 4, 4]} />
                <Bar dataKey="inactive" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success" /> Active Students</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive" /> Inactive Alert</div>
          </div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect } from "react";
import { API_BASE } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { Users, TrendingUp, Loader2, Building2 } from "lucide-react";

interface DeptStat {
  _id: string;
  students: number;
  attendance: number;
}

export default function AdminDepartments() {
  const token = localStorage.getItem("token");
  const [stats, setStats] = useState<DeptStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        // Build department breakdown from analytics if available
        if (res.ok && data.data?.departmentStats) {
          setStats(data.data.departmentStats);
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, [token]);

  return (
    <DashboardLayout role="admin" title="Departments">
      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading departments...
        </div>
      ) : stats.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-muted-foreground opacity-60">
          <Building2 className="h-14 w-14 mb-4 opacity-30" />
          <p className="text-base font-medium">No department data available yet.</p>
          <p className="text-sm mt-2 max-w-sm text-center">
            Department statistics will appear here once students and teachers are approved and attend classes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((dept, i) => (
            <motion.div
              key={dept._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card-hover p-6"
            >
              <h3 className="text-lg font-semibold mb-4">{dept._id} Department</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-info" />
                  <div>
                    <p className="text-2xl font-bold">{dept.students}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-2xl font-bold">{dept.attendance}%</p>
                    <p className="text-xs text-muted-foreground">Attendance</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${dept.attendance}%` }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

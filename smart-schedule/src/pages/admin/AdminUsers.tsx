import { useState, useEffect } from "react";
import { API_BASE } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ShieldCheck, BookOpen, GraduationCap, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UserData {
  _id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  role: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/users?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const handleAction = async (id: string, action: 'approve' | 'reject', role?: string) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = action === 'approve' ? `/api/admin/approve-user/${id}` : `/api/admin/reject-user/${id}`;
      
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: action === 'approve' ? JSON.stringify({ role }) : undefined
      });

      if (res.ok) {
        toast.success(`User ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        setUsers(users.filter(u => u._id !== id));
      } else {
        const err = await res.json();
        toast.error(err.message || "Action failed");
      }
    } catch (err) {
      toast.error("Network error occurred");
    }
  };

  return (
    <DashboardLayout role="admin" title="Access Control">
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        
        {/* Filters Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
            {(['pending', 'approved', 'rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  filter === f 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-card flex-1 overflow-hidden flex flex-col border-t-4 border-t-primary">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Requested Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 rounded-full border-t-2 border-primary animate-spin" />
                          Loading directory...
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-muted-foreground">
                        <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No users found in "{filter}" state.</p>
                      </td>
                    </tr>
                  ) : (
                    users.map((user, idx) => (
                      <motion.tr 
                        key={user._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-foreground">{user.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {filter === 'pending' && (
                              <>
                                <Button size="sm" onClick={() => handleAction(user._id, 'approve', 'Student')} className="bg-success text-success-foreground hover:bg-success/90 h-8 gap-1 shadow-[0_0_15px_rgba(0,255,100,0.2)]">
                                  <GraduationCap className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Student</span>
                                </Button>
                                <Button size="sm" onClick={() => handleAction(user._id, 'approve', 'Teacher')} className="bg-info text-info-foreground hover:bg-info/90 h-8 gap-1 shadow-[0_0_15px_rgba(0,150,255,0.2)]">
                                  <BookOpen className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Teacher</span>
                                </Button>
                                <div className="w-px h-4 bg-border mx-1" />
                                <Button size="sm" variant="outline" onClick={() => handleAction(user._id, 'reject')} className="border-destructive/30 text-destructive hover:bg-destructive/10 h-8">
                                  <XCircle className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            {filter !== 'pending' && (
                              <Badge variant={filter === 'approved' ? 'default' : 'destructive'} className="uppercase tracking-widest text-[10px]">
                                {filter} • {user.role}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

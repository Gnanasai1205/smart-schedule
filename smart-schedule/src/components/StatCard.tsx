import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: "primary" | "success" | "warning" | "info" | "destructive";
}

const colorMap = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  destructive: "text-destructive",
};

const bgMap = {
  primary: "bg-primary/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
  info: "bg-info/10",
  destructive: "bg-destructive/10",
};

export function StatCard({ label, value, icon: Icon, trend, color = "primary" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="stat-card glass-card-hover group"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${bgMap[color]} flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon className={`h-4.5 w-4.5 ${colorMap[color]}`} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-display font-bold">{value}</span>
        {trend && (
          <span className={`text-xs font-medium mb-0.5 ${trend.startsWith("+") ? "text-success" : "text-destructive"}`}>
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}

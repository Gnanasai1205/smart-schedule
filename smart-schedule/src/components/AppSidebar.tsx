import { API_BASE } from "@/config/api";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarClock,
  QrCode,
  Users,
  BarChart3,
  Sparkles,
  LogOut,
  GraduationCap,
  Zap,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserRole } from "@/lib/mock-data";

const roleMenus: Record<UserRole, { title: string; url: string; icon: any }[]> = {
  student: [
    { title: "Dashboard", url: "/student/dashboard", icon: LayoutDashboard },
    { title: "Timetable", url: "/student/timetable", icon: CalendarDays },
    { title: "Daily Routine", url: "/student/routine", icon: CalendarClock },
    { title: "AI Suggestions", url: "/student/suggestions", icon: Sparkles },
  ],
  teacher: [
    { title: "Dashboard", url: "/teacher/dashboard", icon: LayoutDashboard },
    { title: "QR Attendance", url: "/teacher/qr", icon: QrCode },
    { title: "Class Reports", url: "/teacher/reports", icon: Users },
    { title: "Timetable", url: "/teacher/timetable", icon: CalendarDays },
  ],
  admin: [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "User Approvals", url: "/admin/users", icon: Users },
  ],
};

interface AppSidebarProps {
  role: UserRole;
}

export function AppSidebar({ role }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const items = roleMenus[role];

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-display font-bold tracking-wider text-xs uppercase flex items-center gap-2">
            {!collapsed && (
              <>
                <Zap className="h-3.5 w-3.5" />
                SmartCurriculum
              </>
            )}
            {collapsed && <Zap className="h-4 w-4 text-primary" />}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

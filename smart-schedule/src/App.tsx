import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import StudentDashboard from "./pages/student/StudentDashboard";
import TimetableUploadPage from "./pages/TimetableUploadPage";
import StudentSuggestions from "./pages/student/StudentSuggestions";
import DailyRoutine from "./pages/student/DailyRoutine";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherQR from "./pages/teacher/TeacherQR";
import TeacherReports from "./pages/teacher/TeacherReports";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminUsers from "./pages/admin/AdminUsers";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { AuthGuard } from "./components/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Auth />} />
          
          {/* Redirect old root role paths to explicit dashboard paths */}
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />

          {/* Protected Routes */}
          <Route path="/student/dashboard" element={<AuthGuard allowedRole="student"><StudentDashboard /></AuthGuard>} />
          <Route path="/student/timetable" element={<AuthGuard allowedRole="student"><TimetableUploadPage role="student" /></AuthGuard>} />
          <Route path="/student/suggestions" element={<AuthGuard allowedRole="student"><StudentSuggestions /></AuthGuard>} />
          <Route path="/student/routine" element={<AuthGuard allowedRole="student"><DailyRoutine /></AuthGuard>} />
          
          <Route path="/teacher/dashboard" element={<AuthGuard allowedRole="teacher"><TeacherDashboard /></AuthGuard>} />
          <Route path="/teacher/qr" element={<AuthGuard allowedRole="teacher"><TeacherQR /></AuthGuard>} />
          <Route path="/teacher/reports" element={<AuthGuard allowedRole="teacher"><TeacherReports /></AuthGuard>} />
          <Route path="/teacher/timetable" element={<AuthGuard allowedRole="teacher"><TimetableUploadPage role="teacher" /></AuthGuard>} />
          
          <Route path="/admin/dashboard" element={<AuthGuard allowedRole="admin"><AdminDashboard /></AuthGuard>} />
          <Route path="/admin/analytics" element={<AuthGuard allowedRole="admin"><AdminAnalytics /></AuthGuard>} />
          <Route path="/admin/users" element={<AuthGuard allowedRole="admin"><AdminUsers /></AuthGuard>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

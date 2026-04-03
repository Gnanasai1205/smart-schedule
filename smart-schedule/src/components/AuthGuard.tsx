import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function AuthGuard({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      navigate("/auth");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (allowedRole && user.role.toLowerCase() !== allowedRole.toLowerCase()) {
        // Redirect them to their actual dashboard
        navigate(`/${user.role.toLowerCase()}/dashboard`);
      }
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/auth");
    }
  }, [navigate, allowedRole]);

  return <>{children}</>;
}

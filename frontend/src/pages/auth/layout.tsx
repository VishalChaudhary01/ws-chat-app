import { Navigate, Outlet } from "react-router-dom";
import { AppBar } from "../../components/app-bar";
import { useProfileQuery } from "../../lib/queries";

export default function AuthLayout() {
  const { data } = useProfileQuery();

  if (data?.user) return <Navigate to="/" replace />;
  return (
    <div className="mx-auto min-h-screen w-full max-w-360">
      <div className="flex flex-col items-center gap-4">
        <AppBar />
        <Outlet />
      </div>
    </div>
  );
}

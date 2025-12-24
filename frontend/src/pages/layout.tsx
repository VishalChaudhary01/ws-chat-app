import { Navigate, Outlet } from "react-router-dom";
import { AppBar } from "../components/app-bar";
import { useProfileQuery } from "../lib/queries";

export default function AppLayout() {
  const { data } = useProfileQuery();

  if (!data?.user) return <Navigate to="/signin" replace />;

  return (
    <div className="mx-auto min-h-screen w-full max-w-360">
      <div className="flex flex-col">
        <AppBar />
        <Outlet />
      </div>
    </div>
  );
}

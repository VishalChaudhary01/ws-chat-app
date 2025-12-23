import { Outlet } from "react-router-dom";
import { AppBar } from "../components/app-bar";

export default function AppLayout() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-360">
      <div className="flex flex-col">
        <AppBar />
        <Outlet />
      </div>
    </div>
  );
}

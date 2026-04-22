import { Outlet } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";

export function MainLayout() {
  return (
    <div className="min-h-screen">
      <div className="pb-24">
        <Outlet />
      </div>
      <BottomNavigation />
    </div>
  );
}
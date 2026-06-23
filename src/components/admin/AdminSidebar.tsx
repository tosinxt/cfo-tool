"use client";

import { useRouter } from "next/navigation";

export function AdminSidebar({ active }: { active: "dashboard" | "settings" }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <aside className="w-[220px] shrink-0 bg-[oklch(97%_0.003_250)] border-r border-gray-200 flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-gray-200">
        <span className="text-[14px] font-semibold text-gray-900">PitchReady</span>
        <span className="text-[11px] text-gray-400 ml-1.5">Admin</span>
      </div>
      <nav aria-label="Main navigation" className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        <button
          onClick={() => router.push("/admin")}
          aria-current={active === "dashboard" ? "page" : undefined}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-left transition-colors ${
            active === "dashboard"
              ? "bg-hudson-blue/10 text-hudson-blue"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => router.push("/admin/settings")}
          aria-current={active === "settings" ? "page" : undefined}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-left transition-colors ${
            active === "settings"
              ? "bg-hudson-blue/10 text-hudson-blue"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          Settings
        </button>
      </nav>
      <div className="px-2 py-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

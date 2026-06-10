import { AppShell } from "@/components/app-shell";

export default function ShellPage() {
  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-card border border-white/5"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="h-72 rounded-xl bg-card border border-white/5 lg:col-span-3" />
          <div className="h-72 rounded-xl bg-card border border-white/5" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-56 rounded-xl bg-card border border-white/5" />
          <div className="h-56 rounded-xl bg-card border border-white/5" />
        </div>
      </div>
    </AppShell>
  );
}

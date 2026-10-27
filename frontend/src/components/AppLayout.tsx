import { NavLink, Outlet } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

const nav = [
  { to: "/", label: "概览" },
  { to: "/datasets", label: "数据集" },
  { to: "/train", label: "训练" },
  { to: "/jobs", label: "任务" },
]

export function AppLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r bg-sidebar p-4">
        <div className="mb-6 text-sm font-semibold">Model Trainer</div>
        <nav className="grid gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent",
                  isActive && "bg-sidebar-accent font-medium",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2 pt-6">
          <p className="truncate text-xs text-muted-foreground">{user?.username}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
            退出
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

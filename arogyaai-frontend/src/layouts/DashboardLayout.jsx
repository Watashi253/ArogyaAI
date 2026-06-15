import { NavLink, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Utensils,
  Droplets,
  Moon,
  Activity,
  Pill,
  FileText,
  Sparkles,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/utils/cn'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/nutrition', label: 'Nutrition', icon: Utensils },
  { to: '/water', label: 'Hydration', icon: Droplets },
  { to: '/sleep', label: 'Sleep', icon: Moon },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/medicines', label: 'Medicines', icon: Pill },
  { to: '/records', label: 'Records', icon: FileText },
  { to: '/insights', label: 'Insights', icon: Sparkles },
  { to: '/profile', label: 'Profile', icon: User },
]

function SidebarNav({ onNavigate }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6 border-b border-surface-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-semibold text-sm">
            A
          </div>
          <div>
            <p className="font-semibold text-surface-900 leading-tight">Arogya</p>
            <p className="text-[11px] text-surface-400 tracking-wide uppercase">Health AI</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-surface-100">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-surface-800 truncate">{user?.name}</p>
          <p className="text-xs text-surface-400 truncate">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export function DashboardLayout() {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-surface-100 z-30">
          <SidebarNav />
        </aside>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-surface-900/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-elevated"
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-surface-400 hover:bg-surface-100"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav onNavigate={() => setSidebarOpen(false)} />
          </motion.aside>
        </>
      )}

      <div className={cn(!isMobile && 'pl-64')}>
        {isMobile && (
          <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-surface-100">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-surface-600 hover:bg-surface-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold text-surface-900">Arogya</span>
          </header>
        )}

        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

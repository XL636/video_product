import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Wand2,
  Film,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/authStore'
import { useLanguage } from '@/hooks/useLanguage'

export const navItems = (t: any) => [
  { to: '/', icon: LayoutDashboard, label: t.nav?.dashboard || 'Dashboard' },
  { to: '/create', icon: Wand2, label: t.nav?.create || 'Create' },
  { to: '/ai-creator', icon: Sparkles, label: t.nav?.aiCreator || 'AI Creator' },
  { to: '/studio', icon: Film, label: t.nav?.studio || 'Studio' },
  { to: '/gallery', icon: Image, label: t.nav?.gallery || 'Gallery' },
  { to: '/settings', icon: Settings, label: t.nav?.settings || 'Settings' },
]

interface SidebarProps {
  isOpen?: boolean
  onToggle?: () => void
}

export function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { language, toggleLanguage, t } = useLanguage()

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg anime-gradient">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold anime-gradient-text">AnimeGen</h1>
              <p className="text-[10px] text-muted-foreground">Studio</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden rounded-md p-1.5 text-muted-foreground hover:bg-slate-900 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Separator />

        <nav className="flex-1 space-y-1 p-3">
          {navItems(t).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => {
                // Close sidebar on mobile after navigation
                if (window.innerWidth < 1024 && onToggle) {
                  onToggle()
                }
              }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-slate-900 hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Separator />

        {/* Language Switcher */}
        <div className="px-4 py-2">
          <button
            onClick={toggleLanguage}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-slate-900 hover:text-foreground"
          >
            <Globe className="h-4 w-4" />
            <span>{language === 'zh-CN' ? '中文' : 'English'}</span>
          </button>
        </div>

        <Separator />

        <div className="flex items-center gap-3 p-4">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-xs text-primary">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">
              {user?.username || 'User'}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {user?.credits ?? 0} {t.credits || 'credits'}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-slate-900 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  )
}

export function MobileHeader({ onToggle }: { onToggle: () => void }) {
  const { toggleLanguage } = useLanguage()

  return (
    <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-800 lg:hidden">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-slate-900 hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg anime-gradient">
            <Wand2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold anime-gradient-text">AnimeGen</span>
        </div>
      </div>
      <button
        onClick={toggleLanguage}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-slate-900 hover:text-foreground"
        title="Switch Language"
      >
        <Globe className="h-5 w-5" />
      </button>
    </div>
  )
}

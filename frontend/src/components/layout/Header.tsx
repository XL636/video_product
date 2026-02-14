import { useLocation, Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/authStore'
import { Settings, LogOut, User } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

export function Header() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { t } = useLanguage()

  const pageTitles: Record<string, string> = {
    '/': t.pages?.dashboard || 'Dashboard',
    '/create': t.pages?.create || 'Create',
    '/studio': t.pages?.studio || 'Story Studio',
    '/gallery': t.pages?.gallery || 'Gallery',
    '/settings': t.pages?.settings || 'Settings',
  }

  const pageTitle = pageTitles[location.pathname] || 'AnimeGen Studio'

  const breadcrumbParts = location.pathname
    .split('/')
    .filter(Boolean)

  const breadcrumbLabels: Record<string, string> = {
    create: t.pages?.create || 'Create',
    studio: t.pages?.studio || 'Studio',
    gallery: t.pages?.gallery || 'Gallery',
    settings: t.pages?.settings || 'Settings',
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 px-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{pageTitle}</h2>
        {breadcrumbParts.length > 0 && (
          <div className="ml-4 flex items-center gap-1 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              {t.common?.home || 'Home'}
            </Link>
            {breadcrumbParts.map((part, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span>/</span>
                <span>{breadcrumbLabels[part] || part}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-slate-900">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/20 text-xs text-primary">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{user?.username}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <div>
              <p className="text-sm">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              {t.header?.profile || 'Profile'}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="h-4 w-4" />
              {t.header?.settings || 'Settings'}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-red-400"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            {t.header?.logOut || 'Log out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

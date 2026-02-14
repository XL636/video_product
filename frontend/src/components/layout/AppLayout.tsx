import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sidebar, MobileHeader } from './Sidebar'
import { Header } from './Header'
import { Toaster } from '@/components/ui/toast'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useJobPolling } from '@/hooks/useJobPolling'

export function AppLayout() {
  useWebSocket()
  useJobPolling()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
        <MobileHeader onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="hidden lg:block">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}

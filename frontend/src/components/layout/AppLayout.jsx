import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import ErrorBoundary from '../ErrorBoundary'
import Sidebar from './Sidebar'
import '../../styles/layout.css'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setSidebarOpen(false), [pathname])

  return (
    <div className="app">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="app__body">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="app__content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

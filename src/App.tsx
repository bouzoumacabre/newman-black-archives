import { useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { BootSequence } from './components/animations/BootSequence'
import { ProtectedRoute } from './components/routes/ProtectedRoute'
import { AdminRoute } from './components/routes/AdminRoute'
import { StaffRoute } from './components/routes/StaffRoute'
import { ChatPage } from './pages/ChatPage'
import { AdminAccountsPage } from './pages/AdminAccountsPage'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminMissionsPage } from './pages/AdminMissionsPage'
import { NotFoundPage } from './pages/NotFoundPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/control" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/control/missions" element={<StaffRoute><AdminMissionsPage /></StaffRoute>} />
      <Route path="/control/accounts" element={<AdminRoute><AdminAccountsPage /></AdminRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  const [booted, setBooted] = useState(() => sessionStorage.getItem('nba_boot_seen') === '1')
  const complete = () => {
    sessionStorage.setItem('nba_boot_seen', '1')
    setBooted(true)
  }
  if (!booted) return <BootSequence onComplete={complete} />
  return <HashRouter><AppRoutes /></HashRouter>
}

import { useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { BootSequence } from './components/animations/BootSequence'
import { ProtectedRoute } from './components/routes/ProtectedRoute'
import { AdminRoute } from './components/routes/AdminRoute'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { PhasePage } from './pages/PhasePage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminSubmissionsPage } from './pages/AdminSubmissionsPage'
import { AdminPlayersPage } from './pages/AdminPlayersPage'
import { AdminPlayerPage } from './pages/AdminPlayerPage'
import { AdminTransmissionsPage } from './pages/AdminTransmissionsPage'
import { NotFoundPage } from './pages/NotFoundPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/phase/:no" element={<ProtectedRoute><PhasePage /></ProtectedRoute>} />
      <Route path="/control" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/control/submissions" element={<AdminRoute><AdminSubmissionsPage /></AdminRoute>} />
      <Route path="/control/players" element={<AdminRoute><AdminPlayersPage /></AdminRoute>} />
      <Route path="/control/players/:id" element={<AdminRoute><AdminPlayerPage /></AdminRoute>} />
      <Route path="/control/transmissions" element={<AdminRoute><AdminTransmissionsPage /></AdminRoute>} />
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

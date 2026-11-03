import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingTerminal } from '../ui/LoadingTerminal'
import { PendingScreen } from './PendingScreen'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingTerminal />
  if (!user) return <Navigate to="/auth" replace />
  if (profile && profile.status !== 'approved') return <PendingScreen />
  return <>{children}</>
}

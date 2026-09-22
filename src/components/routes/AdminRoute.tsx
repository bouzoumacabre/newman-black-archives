import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingTerminal } from '../ui/LoadingTerminal'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingTerminal />
  if (!user) return <Navigate to="/auth" replace />
  if (!profile || profile.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

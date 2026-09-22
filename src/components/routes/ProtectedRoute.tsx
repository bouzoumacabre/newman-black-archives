import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingTerminal } from '../ui/LoadingTerminal'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingTerminal />
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

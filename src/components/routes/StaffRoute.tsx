import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingTerminal } from '../ui/LoadingTerminal'

// Admin or manager (employee). RLS is the real gate.
export function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingTerminal />
  if (!user) return <Navigate to="/auth" replace />
  if (!profile || profile.status !== 'approved' || (profile.role !== 'admin' && profile.role !== 'manager')) return <Navigate to="/" replace />
  return <>{children}</>
}

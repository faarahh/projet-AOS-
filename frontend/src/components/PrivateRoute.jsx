import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function PrivateRoute({ children }) {
  const { user } = useAuth()
  // user is set synchronously from localStorage on first render,
  // so this check is immediate — no loading state needed.
  return user ? children : <Navigate to="/login" replace />
}

export function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default PrivateRoute

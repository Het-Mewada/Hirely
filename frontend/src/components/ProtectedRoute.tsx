import { Navigate, Outlet } from 'react-router-dom'

export function ProtectedRoute() {
  let isAuthenticated = false
  try {
    const saved = localStorage.getItem('hirely_auth')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed?.access_token) {
        isAuthenticated = true
      }
    }
  } catch {
    isAuthenticated = false
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

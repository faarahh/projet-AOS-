import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute, AdminRoute } from './components/PrivateRoute'

import LandingPage       from './pages/LandingPage'
import LoginPage         from './pages/LoginPage'
import SignupPage        from './pages/SignupPage'
import Dashboard         from './pages/Dashboard'
import ListesPage        from './pages/ListesPage'
import RepasPage         from './pages/RepasPage'
import NotificationsPage from './pages/NotificationsPage'
import AdminPage         from './pages/AdminPage'
import DemoPage          from './pages/DemoPage'
import GroupePage        from './pages/GroupePage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/landing"    element={<LandingPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/signup"     element={<SignupPage />} />
          <Route path="/demo"       element={<DemoPage />} />

          {/* Private */}
          <Route path="/"            element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/listes"      element={<PrivateRoute><ListesPage /></PrivateRoute>} />
          <Route path="/repas"       element={<PrivateRoute><RepasPage /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
          <Route path="/groupe"      element={<PrivateRoute><GroupePage /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin"       element={<AdminRoute><AdminPage /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

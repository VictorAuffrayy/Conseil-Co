import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Catalogue from './pages/Catalogue'
import MaVeille from './pages/MaVeille'
import Favoris from './pages/Favoris'
import Parametres from './pages/Parametres'

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
      Chargement...
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/catalogue" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/catalogue' : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/catalogue" element={<PrivateRoute><Catalogue /></PrivateRoute>} />
      <Route path="/ma-veille" element={<PrivateRoute><MaVeille /></PrivateRoute>} />
      <Route path="/favoris" element={<PrivateRoute><Favoris /></PrivateRoute>} />
      <Route path="/parametres" element={<PrivateRoute><Parametres /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute adminOnly><div style={{ padding: '2rem', fontFamily: 'var(--font-body)' }}>Dashboard admin (à venir)</div></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
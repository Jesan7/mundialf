// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import PrivateRoute from '@/components/PrivateRoute'

// Pages - Autenticación y Principales
import Login         from '@/pages/Login'
import Register      from '@/pages/Register'
import Home          from '@/pages/Home'
import Predictions   from '@/pages/Predictions'
import Ranking       from '@/pages/Ranking'
import Coins         from '@/pages/Coins'
import Notifications from '@/pages/Notifications'
import Profile       from '@/pages/Profile'

// Pages - Módulo de Grupos (Fase 3 Integrada)
import Groups        from '@/pages/Groups'
import CreateGroup   from '@/pages/groups/CreateGroup'
import JoinGroup     from '@/pages/groups/JoinGroup'
import GroupDetail   from '@/pages/groups/GroupDetail'
import Chat          from '@/pages/groups/Chat'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Raíz → Redirección segura a Home */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Rutas Públicas */}
          <Route path="/login"    element={<Login />} />
          {/* Private - groups */}          <Route path="/register" element={<Register />} />

          {/* Rutas Privadas Principales */}
          <Route path="/home"          element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/predictions"   element={<PrivateRoute><Predictions /></PrivateRoute>} />
          <Route path="/ranking"       element={<PrivateRoute><Ranking /></PrivateRoute>} />
          <Route path="/coins"         element={<PrivateRoute><Coins /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/profile"       element={<PrivateRoute><Profile /></PrivateRoute>} />

          {/* Rutas Privadas del Módulo de Grupos y Chat */}
          <Route path="/groups"               element={<PrivateRoute><Groups /></PrivateRoute>} />
          <Route path="/groups/create"        element={<PrivateRoute><CreateGroup /></PrivateRoute>} />
          <Route path="/groups/join"          element={<PrivateRoute><JoinGroup /></PrivateRoute>} />
          <Route path="/groups/:groupId"      element={<PrivateRoute><GroupDetail /></PrivateRoute>} />
          <Route path="/groups/:groupId/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />

          {/* Comodín de Redirección (404) */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>

        {/* Estilización global del Toast */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#111827',
              color:       '#f9fafb',
              border:      '1px solid #1e2d3d',
              borderRadius: '12px',
              fontSize:     '14px',
              padding:      '12px 16px',
            },
            success: {
              iconTheme: { primary: '#00ff7f', secondary: '#0a0e1a' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
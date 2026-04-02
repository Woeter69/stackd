import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import RoomPage from './pages/RoomPage'
import AuthPage from './pages/AuthPage'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return <AuthPage />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:code" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Vitrina from './pages/Vitrina'
import Reserva from './pages/Reserva'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Vitrina />} />
        {/* El :id permite saber qué habitación exacta eligió el cliente */}
        <Route path="/reserva/:id" element={<Reserva />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
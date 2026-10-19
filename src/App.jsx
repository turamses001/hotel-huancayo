import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'


// Importar vistas del cliente
import LayoutCliente from './pages/cliente/LayoutCliente'
import Home from './pages/cliente/Home'
import HabitacionesView from './pages/cliente/HabitacionesView'
import PromocionesView from './pages/cliente/PromocionesView'
import NosotrosView from './pages/cliente/NosotrosView'
import ClienteAuth from './pages/cliente/ClienteAuth'

// Importar otras vistas generales y de admin
import Reserva from './pages/Reserva'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CarritoReserva from './pages/cliente/CarritoReserva'
import AdminLayout from './pages/admin/AdminLayout'
import AdminHabitaciones from './pages/admin/AdminHabitaciones'
import AdminConfig from './pages/admin/AdminConfig'
import AdminRecepcion from './pages/admin/AdminRecepcion'
import AdminClientes from './pages/admin/AdminClientes'
import AdminReservas from './pages/admin/AdminReservas'
import AdminVentas from './pages/admin/AdminVentas'
import AdminBazar from './pages/admin/AdminBazar'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirigir la raíz directamente al portal de clientes /app */}
        <Route path="/" element={<Navigate to="/app" replace />} />

        {/* Portal del Cliente con Pestañas (/app) */}
        <Route path="/app" element={<LayoutCliente />}>
          <Route index element={<Home />} />
          <Route path="habitaciones" element={<HabitacionesView />} />
          <Route path="promociones" element={<PromocionesView />} />
          <Route path="nosotros" element={<NosotrosView />} />
        </Route>

        {/* Otras rutas de reserva y administración */}
        <Route path="/reserva/:id" element={<Reserva />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/cliente-auth" element={<ClienteAuth />} />
        <Route path="/reserva-carrito" element={<CarritoReserva />} />

        <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHabitaciones />} />
        <Route path="habitaciones" element={<AdminHabitaciones />} />
        <Route path="recepcion" element={<AdminRecepcion />} />
        <Route path="clientes" element={<AdminClientes />} />
        <Route path="reservas" element={<AdminReservas />} />
        <Route path="ventas" element={<AdminVentas />} />
        <Route path="bazar" element={<AdminBazar />} />

        <Route path="configuracion" element={<AdminConfig />} />
        {/* Las demás secciones se pueden agregar aquí progresivamente */}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
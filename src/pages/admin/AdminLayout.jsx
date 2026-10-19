import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function AdminLayout() {
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        navigate('/login')
        return
      }
      
      // Opcional: Validar si es el correo administrador autorizado
      const correoAdmin = "admin@hotel.com" // O tu correo de admin
      if (data.session.user.email !== correoAdmin && !data.session.user.email.includes("admin")) {
        alert("Acceso denegado. Esta zona es exclusiva para administradores.")
        navigate('/app')
        return
      }

      setUser(data.session.user)
    }
    checkAdmin()
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const menuItems = [
    { name: 'Recepción', path: '/admin/recepcion', icon: '🛎️' },
    { name: 'Reservas', path: '/admin/reservas', icon: '📅' },
    { name: 'Ventas', path: '/admin/ventas', icon: '💳' },
    { name: 'Habitaciones', path: '/admin/habitaciones', icon: '🛏️' },
    { name: 'Productos y Servicios', path: '/admin/bazar', icon: '🛍️' },
    { name: 'Clientes', path: '/admin/clientes', icon: '👥' },
    { name: 'Ofertas', path: '/admin/ofertas', icon: '🏷️' },
    { name: 'Finanzas', path: '/admin/finanzas', icon: '📊' },
    { name: 'Configuración', path: '/admin/configuracion', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Menú Lateral Desplegable */}
      <aside className={`bg-blue-950 text-white w-64 space-y-6 py-7 px-4 fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition duration-200 ease-in-out z-50 shadow-2xl flex flex-col justify-between`}>
        <div>
          <div className="flex items-center justify-between px-2 mb-8">
            <h2 className="text-2xl font-black tracking-wider text-blue-400">HOTEL ADMIN</h2>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white text-xl">✕</button>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const activo = location.pathname === item.path
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activo ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-900 hover:text-white'}`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-blue-900">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            <span>🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-700 text-2xl font-bold">
            ☰
          </button>
          <h3 className="font-extrabold text-gray-800 text-lg">Panel de Gestión General</h3>
          <span className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1.5 rounded-lg">
            {user?.email || 'Administrador'}
          </span>
        </header>

        <main className="p-6 flex-grow">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
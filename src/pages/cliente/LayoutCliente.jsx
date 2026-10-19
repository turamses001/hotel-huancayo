import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function LayoutCliente() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user || null)
    }
    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/app')
  }

  const linkAsesor = "https://wa.me/51999888777?text=Hola,%20deseo%20conversar%20con%20un%20asesor%20sobre%20las%20habitaciones%20del%20Hotel%20Huancayo."

  // URL exacta de tu imagen del colibrí en Supabase Storage
  const urlCursorColibri = "https://kgwyzojozraxmuconsrt.supabase.co/storage/v1/object/public/hotel-assets/Mouse.jpg"

  return (
    <div 
      className="min-h-screen bg-gray-50 flex flex-col relative" 
      style={{ cursor: `url('${urlCursorColibri}') 2 12, auto` }}
    >
      
      {/* Estilo global para forzar el cursor del colibrí en todos los elementos interactivos */}
      <style>{`
        button, a, input, select, textarea, label {
          cursor: url('${urlCursorColibri}') 2 12, pointer !important;
        }
      `}</style>

      {/* Barra de Navegación */}
      <nav className="bg-white text-gray-800 shadow-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-2 flex justify-between items-center">
          
          {/* Logo en video maximizado */}
          <Link to="/app" className="flex items-center">
            <video 
              src="https://kgwyzojozraxmuconsrt.supabase.co/storage/v1/object/public/hotel-assets/Logo_dinamico_tuki2.mp4" 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="h-20 md:h-24 w-auto object-contain rounded-md"
            />
          </Link>
          
          {/* Cabeceras separadas y con efecto subrayado */}
          <div className="hidden md:flex space-x-8 font-bold text-sm tracking-wide">
            <Link to="/app" className="hover:text-blue-900 hover:underline underline-offset-8 transition duration-200">Inicio</Link>
            <Link to="/app/habitaciones" className="hover:text-blue-900 hover:underline underline-offset-8 transition duration-200">Habitaciones</Link>
            <Link to="/app/promociones" className="hover:text-blue-900 hover:underline underline-offset-8 transition duration-200">Promociones</Link>
            <Link to="/app/nosotros" className="hover:text-blue-900 hover:underline underline-offset-8 transition duration-200">Nosotros</Link>
          </div>

          {/* Botón de Login del Cliente */}
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs bg-gray-100 text-gray-700 border px-3 py-2 rounded-lg hidden sm:inline font-medium">👤 {user.email}</span>
                <button onClick={handleLogout} className="bg-red-600 text-white text-xs px-3.5 py-2 rounded-xl font-bold hover:bg-red-700 transition shadow">
                  Salir
                </button>
              </div>
            ) : (
              <Link to="/cliente-auth" className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition shadow-md">
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Botón Flotante de WhatsApp con Asesor */}
      <a 
        href={linkAsesor} 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition flex items-center justify-center z-50 text-3xl animate-bounce"
        title="Conversar con un asesor"
      >
        💬
      </a>

      {/* Pie de página */}
      <footer className="bg-white text-gray-700 text-center py-8 mt-12 border-t border-gray-200 shadow-inner">
        <p className="text-sm font-medium">© 2026 Hotel Huancayo - Valle del Mantaro. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
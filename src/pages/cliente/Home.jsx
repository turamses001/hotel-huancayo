import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function Home() {
  // Obtenemos la fecha actual exacta en el huso horario de Lima, Perú (GMT-5)
  const obtenerFechaLocal = (diasOffset = 0) => {
    const d = new Date()
    d.setDate(d.getDate() + diasOffset)
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
  }

  const hoy = obtenerFechaLocal(0)
  const fechaMañana = obtenerFechaLocal(1)

  const [fechaIngreso, setFechaIngreso] = useState(hoy)
  const [fechaSalida, setFechaSalida] = useState(fechaMañana)
  const [datosHotel, setDatosHotel] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    cargarDatosHotel()
  }, [])

  async function cargarDatosHotel() {
    try {
      const { data } = await supabase
        .from('configuracion_hotel')
        .select('*')
        .limit(1)
        .maybeSingle()
      if (data) setDatosHotel(data)
    } catch (err) {
      console.error('Error al cargar datos dinámicos del hotel:', err)
    }
  }

  const handleBuscar = (e) => {
    e.preventDefault()
    if (!fechaIngreso || !fechaSalida) {
      alert("Por favor selecciona ambas fechas.")
      return
    }
    if (fechaSalida < fechaIngreso) {
      alert("La fecha de salida no puede ser anterior a la de ingreso.")
      return
    }
    navigate(`/app/habitaciones?llegada=${fechaIngreso}&salida=${fechaSalida}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans relative">
      
      {/* Barra de Búsqueda Flotante Fija */}
      <div className="fixed top-20 left-0 right-0 z-50 px-4 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto shadow-2xl transition-all duration-300">
          <form 
            onSubmit={handleBuscar}
            className="bg-white/95 backdrop-blur-md text-gray-800 p-4 rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center border border-gray-200"
          >
            <div className="text-left px-2">
              <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">Fecha de Ingreso</label>
              <input 
                type="date" 
                min={hoy}
                value={fechaIngreso}
                onChange={(e) => {
                  const nuevaIngreso = e.target.value
                  setFechaIngreso(nuevaIngreso)
                  if (nuevaIngreso > fechaSalida) {
                    setFechaSalida(nuevaIngreso)
                  }
                }}
                className="w-full text-xs font-bold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none"
              />
            </div>

            <div className="text-left px-2">
              <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">Fecha de Salida</label>
              <input 
                type="date" 
                min={fechaIngreso || hoy}
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
                className="w-full text-xs font-bold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none"
              />
            </div>

            <div>
              <button 
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg transition text-sm flex items-center justify-center gap-2"
              >
                <span>🔍 Buscar Habitaciones</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Hero Section con Video de Fondo Collage */}
      <header className="relative overflow-hidden min-h-[85vh] flex flex-col items-center justify-center text-white py-32 px-6 text-center shadow-2xl">
        
        {/* Video interactivo de fondo en bucle */}
        <video 
          src="https://kgwyzojozraxmuconsrt.supabase.co/storage/v1/object/public/hotel-assets/Collage.mp4" 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-75"
        />

        {/* Capa oscura semitransparente (Overlay) */}
        <div className="absolute inset-0 bg-black/50 z-10"></div>

        {/* Contenido principal del Hero */}
        <div className="relative z-20 max-w-4xl mx-auto space-y-6 pt-12">
          <span className="bg-white/20 backdrop-blur-md text-white text-xs uppercase font-black px-5 py-2 rounded-full tracking-widest border border-white/40 shadow-sm inline-block">
            ☀️ {datosHotel?.nombre_comercial || 'Hotel Huancayo'} — Valle del Mantaro
          </span>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-lg">
            Descanso y Confort en Armonía
          </h2>
          
          <p className="text-base md:text-lg text-white/95 font-medium max-w-xl mx-auto drop-shadow">
            Selecciona tus fechas y vive una experiencia inolvidable rodeada de calidez, flores y naturaleza.
          </p>
        </div>
      </header>

      {/* Sección Interactiva: Habitaciones, Promociones y Minimapa Interactivo */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h3 className="text-2xl md:text-3xl font-black text-gray-900">Descubre Nuestro Hotel</h3>
          <p className="text-sm text-gray-500 font-medium">Explora nuestras opciones, ofertas especiales y nuestra ubicación exacta.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Opción 1: Habitaciones */}
          <Link to="/app/habitaciones" className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition group block">
            <div className="h-56 overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800" alt="Habitaciones" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow z-10">🛏️ Confort</span>
            </div>
            <div className="p-6 space-y-2">
              <h4 className="font-extrabold text-lg text-gray-800 group-hover:text-blue-900 transition">1. Habitaciones</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Conoce nuestras suites matrimoniales, dobles y con jacuzzi diseñadas para tu máximo descanso.</p>
            </div>
          </Link>

          {/* Opción 2: Promociones */}
          <Link to="/app/promociones" className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition group block">
            <div className="h-56 overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800" alt="Promociones" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow z-10">✨ Ofertas</span>
            </div>
            <div className="p-6 space-y-2">
              <h4 className="font-extrabold text-lg text-gray-800 group-hover:text-blue-900 transition">2. Promociones</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Aprovecha descuentos especiales, paquetes por temporada y beneficios exclusivos para reservas web.</p>
            </div>
          </Link>

          {/* Opción 3: Minimapa Interactivo */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition group flex flex-col">
            <div className="h-56 overflow-hidden relative w-full">
              <iframe 
                title="Ubicación Exacta Hotel Huancayo"
                src="https://maps.google.com/maps?q=-12.076278005671186,-75.21121568030567&z=15&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              ></iframe>
              
              <a 
                href="https://maps.app.goo.gl/xvUkjjqJjUMFUkSr6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow z-20 hover:bg-black hover:text-white transition"
              >
                📍 Ampliar Mapa
              </a>
            </div>
            
            <a 
              href="https://maps.app.goo.gl/xvUkjjqJjUMFUkSr6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-6 space-y-2 block text-left"
            >
              <h4 className="font-extrabold text-lg text-gray-800 group-hover:text-blue-900 transition">3. Ubicación en Google Maps</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Encuéntranos fácilmente en el corazón del Valle del Mantaro. Haz clic para ver la ruta exacta en Google Maps.</p>
            </a>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-10 px-6 text-center text-xs space-y-3 mt-16 border-t border-gray-800">
        <p className="font-bold">{datosHotel?.nombre_comercial || 'Hotel Huancayo'} &copy; 2026 — Todos los derechos reservados.</p>
        <p className="text-gray-400">Diseñado con amor, luz y naturaleza 🌸🌿☀️</p>
      </footer>
    </div>
  )
}
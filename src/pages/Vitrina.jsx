import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Vitrina() {
  const [fechaIngreso, setFechaIngreso] = useState('2026-10-06')
  const [fechaSalida, setFechaSalida] = useState('2026-10-07')

  const handleBuscar = (e) => {
    e.preventDefault()
    alert(`Buscando habitaciones disponibles del ${fechaIngreso} al ${fechaSalida}...`)
  }

  return (
    <div className="min-h-screen bg-rose-50/50 text-gray-800 font-sans">
      {/* Navbar Superior */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-rose-200 sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <h1 className="text-xl font-extrabold text-rose-900 tracking-wide">Hotel Huancayo</h1>
        </div>
        
        <div className="hidden md:flex gap-8 text-sm font-bold text-rose-900/80">
          <Link to="/" className="hover:text-rose-600 transition">Inicio</Link>
          <Link to="/habitaciones" className="hover:text-rose-600 transition">Habitaciones</Link>
          <Link to="/promociones" className="hover:text-rose-600 transition">Promociones</Link>
          <Link to="/nosotros" className="hover:text-rose-600 transition">Nosotros</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-lg shadow-rose-600/30 transition">
            Ingreso Admin
          </Link>
        </div>
      </nav>

      {/* Hero Section con Sol Radiante, Tonos Rosas y Vegetación */}
      <header className="relative overflow-hidden bg-gradient-to-br from-amber-300 via-rose-400 to-pink-600 text-white py-28 px-6 text-center shadow-2xl">
        {/* Sol Radiante de fondo */}
        <div className="absolute top-[-10%] right-[10%] w-[450px] h-[450px] bg-yellow-200/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[5%] w-[400px] h-[400px] bg-pink-300/40 rounded-full blur-3xl pointer-events-none"></div>

        {/* Vegetación y naturaleza flotante */}
        <div className="absolute top-8 left-12 text-4xl opacity-80 animate-bounce">🌿</div>
        <div className="absolute top-20 right-20 text-4xl opacity-80 animate-pulse">🍃</div>
        <div className="absolute bottom-10 left-24 text-3xl opacity-75">🪴</div>
        <div className="absolute bottom-14 right-32 text-3xl opacity-80">🌸</div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <span className="bg-white/25 backdrop-blur-md text-white text-xs uppercase font-black px-5 py-2 rounded-full tracking-widest border border-white/40 shadow-sm">
            ☀️ Tu refugio natural en el Valle del Mantaro
          </span>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-lg">
            Descanso y Confort en Armonía
          </h2>
          
          <p className="text-base md:text-lg text-white/95 font-medium max-w-xl mx-auto drop-shadow">
            Selecciona tus fechas y vive una experiencia inolvidable rodeada de calidez, flores y naturaleza.
          </p>

          {/* Buscador de Habitaciones Flotante */}
          <form 
            onSubmit={handleBuscar}
            className="bg-white text-gray-800 p-4 rounded-3xl shadow-2xl max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 items-center border border-rose-100 mt-8"
          >
            <div className="text-left px-2">
              <label className="block text-[10px] font-extrabold text-rose-800 uppercase tracking-wider mb-1">Fecha de Ingreso</label>
              <input 
                type="date" 
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="w-full text-xs font-bold text-gray-700 bg-rose-50/60 p-3 rounded-xl border border-rose-200 outline-none"
              />
            </div>

            <div className="text-left px-2">
              <label className="block text-[10px] font-extrabold text-rose-800 uppercase tracking-wider mb-1">Fecha de Salida</label>
              <input 
                type="date" 
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
                className="w-full text-xs font-bold text-gray-700 bg-rose-50/60 p-3 rounded-xl border border-rose-200 outline-none"
              />
            </div>

            <div>
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-rose-600/40 transition text-sm flex items-center justify-center gap-2"
              >
                <span>🔍 Buscar Habitaciones</span>
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Sección de Instalaciones */}
      <section className="py-16 px-6 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h3 className="text-2xl md:text-3xl font-black text-rose-900">Nuestras Instalaciones</h3>
          <p className="text-sm text-gray-500 font-medium">Espacios diseñados con elegancia, luz natural y detalles florales para tu bienestar.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-rose-100 hover:shadow-2xl transition group">
            <div className="h-56 overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800" alt="Habitación Matrimonial" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-rose-800 text-xs font-bold px-3 py-1 rounded-full shadow">🌸 Acogedor</span>
            </div>
            <div className="p-6 space-y-2">
              <h4 className="font-extrabold text-lg text-gray-800">Suite Floral Matrimonial</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Habitación amplia con vista al jardín, cama King-size y decoración en tonos pastel.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-rose-100 hover:shadow-2xl transition group">
            <div className="h-56 overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800" alt="Sala de Estar" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-rose-800 text-xs font-bold px-3 py-1 rounded-full shadow">🌿 Relax</span>
            </div>
            <div className="p-6 space-y-2">
              <h4 className="font-extrabold text-lg text-gray-800">Lounge & Sala de Descanso</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Un ambiente rodeado de plantas ornamentales y luz solar ideal para relajarse con un buen libro.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-rose-100 hover:shadow-2xl transition group">
            <div className="h-56 overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800" alt="Piscina y Spa" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-rose-800 text-xs font-bold px-3 py-1 rounded-full shadow">☀️ Solarium</span>
            </div>
            <div className="p-6 space-y-2">
              <h4 className="font-extrabold text-lg text-gray-800">Piscina & Zona Wellness</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Disfruta del sol radiante del Valle del Mantaro junto a nuestra área de hidromasajes y spa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-rose-900 text-rose-100 py-10 px-6 text-center text-xs space-y-3 mt-16 border-t border-rose-800">
        <p className="font-bold">Hotel Huancayo &copy; 2026 — Todos los derechos reservados.</p>
        <p className="text-rose-300">Diseñado con amor, luz y naturaleza 🌸🌿☀️</p>
      </footer>
    </div>
  )
}
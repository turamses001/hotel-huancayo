import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom' // <-- Nueva herramienta de navegación
import { supabase } from '../supabaseClient' // Nota: subimos un nivel con '../'

export default function Vitrina() {
  const [habitaciones, setHabitaciones] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function obtenerHabitaciones() {
      const { data, error } = await supabase.from('habitaciones').select('*')
      if (!error) setHabitaciones(data)
      setCargando(false)
    }
    obtenerHabitaciones()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Hotel Huancayo</h1>
          {/* Botón convertido en Link */}
          <Link to="/login" className="bg-blue-700 px-4 py-2 rounded hover:bg-blue-600 font-semibold transition">
            Ingreso Admin
          </Link>
        </div>
      </nav>

      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto py-16 px-4 text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Descanso y confort en el corazón del Valle del Mantaro
          </h2>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-blue-900 pb-2 inline-block">
          Nuestras Habitaciones
        </h3>
        
        {cargando ? (
          <p className="text-center text-gray-500 text-xl font-bold">Cargando habitaciones...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {habitaciones.map((hab) => (
              <div key={hab.numero} className="bg-white rounded-xl shadow-lg overflow-hidden border">
                <img src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80" alt="Habitación" className="h-48 w-full object-cover" />
                <div className="p-5">
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${hab.estado === 'Libre' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {hab.estado}
                  </span>
                  <h4 className="text-xl font-bold mt-2">Habitación {hab.numero} - {hab.tipo}</h4>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-blue-700 font-black text-xl">S/ {hab.precio}</p>
                    
                    {/* Botón Reservar convertido en Link. Si está ocupada, no se puede hacer clic */}
                    {hab.estado === 'Libre' ? (
                      <Link 
                        to={`/reserva/${hab.numero}`} 
                        className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 transition"
                      >
                        Reservar
                      </Link>
                    ) : (
                      <button disabled className="bg-gray-400 text-white px-4 py-2 rounded font-bold cursor-not-allowed">
                        Ocupada
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
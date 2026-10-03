import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Dashboard() {
  const [habitaciones, setHabitaciones] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    async function verificarUsuario() {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        navigate('/login')
      } else {
        cargarHabitaciones()
      }
    }
    verificarUsuario()
  }, [navigate])

  const cargarHabitaciones = async () => {
    const { data } = await supabase.from('habitaciones').select('*').order('numero')
    if (data) setHabitaciones(data)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  // 1. Función para alternar entre Libre y Ocupada con un clic
  const toggleEstado = async (numero, estadoActual) => {
    const nuevoEstado = estadoActual === 'Libre' ? 'Ocupada' : 'Libre'
    
    const { error } = await supabase
      .from('habitaciones')
      .update({ estado: nuevoEstado })
      .eq('numero', numero) // Usamos 'numero' en vez de 'id'
    
    if (!error) cargarHabitaciones() // Refresca la tabla automáticamente
  }

  // 2. Función para abrir una ventanita y cambiar el precio
  const cambiarPrecio = async (numero, precioActual) => {
    const nuevoPrecio = window.prompt(`Ingresa el nuevo precio para la Habitación ${numero}:`, precioActual)
    
    // Si escribió algo y es un número válido
    if (nuevoPrecio !== null && !isNaN(nuevoPrecio)) {
      const { error } = await supabase
        .from('habitaciones')
        .update({ precio: parseFloat(nuevoPrecio) })
        .eq('numero', numero)
      
      if (!error) cargarHabitaciones()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Panel de Control</h2>
          <button onClick={cerrarSesion} className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition">
            Cerrar Sesión
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="p-4">N°</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Precio (S/)</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {habitaciones.map(hab => (
                // SOLUCIÓN AL ERROR ROJO: Usamos key={hab.numero}
                <tr key={hab.numero} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-bold">{hab.numero}</td>
                  <td className="p-4">{hab.tipo}</td>
                  <td className="p-4 font-bold text-blue-700">{hab.precio}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${hab.estado === 'Libre' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {hab.estado}
                    </span>
                  </td>
                  <td className="p-4 flex gap-4 justify-center">
                    {/* Botones de acción conectados a la base de datos */}
                    <button 
                      onClick={() => toggleEstado(hab.numero, hab.estado)} 
                      className="text-white bg-gray-700 px-3 py-1 rounded font-bold hover:bg-gray-800 transition text-sm"
                    >
                      Cambiar Estado
                    </button>
                    <button 
                      onClick={() => cambiarPrecio(hab.numero, hab.precio)} 
                      className="text-white bg-blue-600 px-3 py-1 rounded font-bold hover:bg-blue-700 transition text-sm"
                    >
                      Editar Precio
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
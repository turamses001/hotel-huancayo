import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminHabitaciones() {
  const [habitaciones, setHabitaciones] = useState([])
  const [tiposConfigurados, setTiposConfigurados] = useState([])
  const [numero, setNumero] = useState('')
  const [tipo, setTipo] = useState('')
  const [precio, setPrecio] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    // 1. Cargar habitaciones físicas
    const { data: habs } = await supabase.from('habitaciones').select('*').order('numero')
    if (habs) setHabitaciones(habs)

    // 2. Cargar tipos dinámicos desde Configuración
    const { data: tipos } = await supabase.from('tipos_habitacion').select('*').order('nombre')
    if (tipos && tipos.length > 0) {
      setTiposConfigurados(tipos)
      if (!tipo) {
        setTipo(tipos[0].nombre)
        setPrecio(tipos[0].precio_base)
      }
    }
    setCargando(false)
  }

  const handleCambioTipo = (e) => {
    const nombreTipo = e.target.value
    setTipo(nombreTipo)
    const encontrado = tiposConfigurados.find(t => t.nombre === nombreTipo)
    if (encontrado) {
      setPrecio(encontrado.precio_base)
    }
  }

  const handleAgregar = async (e) => {
    e.preventDefault()
    if (!numero || !precio || !tipo) return

    const { error } = await supabase.from('habitaciones').insert([
      { numero: parseInt(numero), tipo, precio: parseFloat(precio), estado: 'Libre' }
    ])

    if (error) {
      alert("Error al agregar habitación: " + error.message)
    } else {
      setNumero('')
      cargarDatos()
    }
  }

  const toggleMantenimiento = async (numeroHab, estadoActual) => {
    const nuevoEstado = estadoActual === 'Mantenimiento' ? 'Libre' : 'Mantenimiento'
    
    const { error } = await supabase
      .from('habitaciones')
      .update({ estado: nuevoEstado })
      .eq('numero', numeroHab)

    if (!error) cargarDatos()
  }

  const eliminarHabitacion = async (numeroHab) => {
    if (!confirm(`¿Estás seguro de eliminar la habitación física N° ${numeroHab}?`)) return

    const { error } = await supabase
      .from('habitaciones')
      .delete()
      .eq('numero', numeroHab)

    if (error) {
      alert("Error al eliminar habitación: " + error.message)
    } else {
      cargarDatos()
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <h2 className="text-3xl font-extrabold text-gray-900">Gestión de Habitaciones</h2>

      {/* Formulario para agregar habitación */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border">
        <h3 className="text-xl font-bold text-blue-900 mb-4">Agregar Nueva Habitación Física</h3>
        <form onSubmit={handleAgregar} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">N° de Habitación</label>
            <input 
              type="number" 
              value={numero} 
              onChange={e => setNumero(e.target.value)} 
              className="w-full border p-3 rounded-xl" 
              placeholder="Ej. 104" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Habitación</label>
            <select 
              value={tipo} 
              onChange={handleCambioTipo} 
              className="w-full border p-3 rounded-xl bg-white font-medium"
            >
              {tiposConfigurados.map(t => (
                <option key={t.id} value={t.nombre}>{t.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Precio por Noche (S/)</label>
            <input 
              type="number" 
              value={precio} 
              onChange={e => setPrecio(e.target.value)} 
              className="w-full border p-3 rounded-xl" 
              placeholder="120" 
              required 
            />
          </div>
          <div>
            <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold p-3 rounded-xl transition shadow">
              Agregar Habitación
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de habitaciones */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="p-4">N°</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Precio (S/)</th>
              <th className="p-4">Estado Actual</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="5" className="p-6 text-center text-gray-500 font-bold">Cargando habitaciones...</td></tr>
            ) : habitaciones.length === 0 ? (
              <tr><td colSpan="5" className="p-6 text-center text-gray-500 font-bold">No hay habitaciones registradas.</td></tr>
            ) : (
              habitaciones.map(hab => (
                <tr key={hab.numero} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-bold">{hab.numero}</td>
                  <td className="p-4">{hab.tipo}</td>
                  <td className="p-4 font-bold text-blue-900">S/ {hab.precio}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${hab.estado === 'Libre' ? 'bg-green-100 text-green-800' : hab.estado === 'Ocupada' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {hab.estado}
                    </span>
                  </td>
                  <td className="p-4 text-center space-x-2">
                    <button 
                      onClick={() => toggleMantenimiento(hab.numero, hab.estado)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${hab.estado === 'Mantenimiento' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
                    >
                      {hab.estado === 'Mantenimiento' ? 'Habilitar' : 'Mantenimiento'}
                    </button>
                    <button 
                      onClick={() => eliminarHabitacion(hab.numero)}
                      className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-red-200 transition"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminClientes() {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)

  const [nombre, setNombre] = useState('')
  const [tipoDoc, setTipoDoc] = useState('DNI')
  const [numeroDoc, setNumeroDoc] = useState('')
  const [telefono, setTelefono] = useState('')

  useEffect(() => {
    cargarTodosLosClientes()
  }, [])

  const cargarTodosLosClientes = async () => {
    setCargando(true)
    
    // 1. Obtener clientes directos
    const { data: dataClientes } = await supabase.from('clientes').select('*')
    
    // 2. Obtener perfiles de usuarios registrados en el portal web (/app)
    const { data: dataPerfiles } = await supabase.from('perfiles').select('*')

    // Unificar ambas fuentes evitando duplicados por documento o nombre
    const listaUnificada = []
    const dniVistos = new Set()

    if (dataClientes) {
      dataClientes.forEach(c => {
        dniVistos.add(c.numero_documento)
        listaUnificada.push(c)
      })
    }

    if (dataPerfiles) {
      dataPerfiles.forEach(p => {
        const dniPerfil = p.dni || p.id
        if (!dniVistos.has(dniPerfil)) {
          dniVistos.add(dniPerfil)
          listaUnificada.push({
            id: p.id,
            nombre: `${p.nombres || ''} ${p.apellidos || ''}`.trim() || p.email || 'Cliente Web',
            tipo_documento: 'DNI',
            numero_documento: p.dni || 'Sin DNI',
            telefono: p.telefono || 'No registrado'
          })
        }
      })
    }

    setClientes(listaUnificada)
    setCargando(false)
  }

  const handleGuardarManual = async (e) => {
    e.preventDefault()
    if (!nombre || !numeroDoc) return

    const { error } = await supabase.from('clientes').insert([
      { nombre: nombre.trim(), tipo_documento: tipoDoc, numero_documento: numeroDoc.trim(), telefono }
    ])

    if (error) {
      alert("Error al registrar cliente: " + error.message)
    } else {
      setNombre('')
      setNumeroDoc('')
      setTelefono('')
      setModalAbierto(false)
      cargarTodosLosClientes()
    }
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    c.numero_documento.includes(busqueda)
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-wide">CLIENTES</h2>
        <button 
          onClick={() => setModalAbierto(true)}
          className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2"
        >
          <span>+ Nuevo</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex w-full md:w-96 gap-2">
          <input 
            type="text" 
            placeholder="Buscar por Nombre o N° de Documento..." 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full border p-3 rounded-xl text-sm outline-none focus:border-blue-900"
          />
        </div>
        <span className="text-sm font-bold text-gray-500">Total registros: {clientesFiltrados.length}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-900 text-white text-sm">
              <th className="p-4 w-16">#</th>
              <th className="p-4">Nombre / Razón Social</th>
              <th className="p-4">Tipo de documento</th>
              <th className="p-4">Número</th>
              <th className="p-4">Teléfono</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500 font-bold">Cargando clientes...</td></tr>
            ) : clientesFiltrados.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500 font-bold">No se encontraron clientes registrados.</td></tr>
            ) : (
              clientesFiltrados.map((c, index) => (
                <tr key={c.id || index} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-4 font-bold text-gray-500">{index + 1}</td>
                  <td className="p-4 font-extrabold text-gray-800">{c.nombre}</td>
                  <td className="p-4 font-semibold text-gray-600">{c.tipo_documento || 'DNI'}</td>
                  <td className="p-4 font-bold text-blue-900">{c.numero_documento}</td>
                  <td className="p-4 text-gray-600">{c.telefono || 'No registrado'}</td>
                  <td className="p-4 text-center">
                    <span className="text-gray-400 font-bold cursor-pointer hover:text-gray-700">⋮</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-bold text-blue-900">Registrar Nuevo Cliente</h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-700 font-bold text-xl">✕</button>
            </div>

            <form onSubmit={handleGuardarManual} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo / Razón Social</label>
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)} 
                  className="w-full border p-3 rounded-xl outline-none focus:border-blue-900" 
                  placeholder="Ej. Juan Pérez Ramos" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tipo Documento</label>
                  <select 
                    value={tipoDoc} 
                    onChange={e => setTipoDoc(e.target.value)} 
                    className="w-full border p-3 rounded-xl bg-white font-medium"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">Carnet de Extranjería</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">N° de Documento</label>
                  <input 
                    type="text" 
                    value={numeroDoc} 
                    onChange={e => setNumeroDoc(e.target.value)} 
                    className="w-full border p-3 rounded-xl outline-none focus:border-blue-900" 
                    placeholder="71865761" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono / Celular</label>
                <input 
                  type="text" 
                  value={telefono} 
                  onChange={e => setTelefono(e.target.value)} 
                  className="w-full border p-3 rounded-xl outline-none focus:border-blue-900" 
                  placeholder="999888777" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalAbierto(false)}
                  className="w-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition shadow"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
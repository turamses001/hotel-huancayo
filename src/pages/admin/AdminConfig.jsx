import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminConfig() {
  const [tabActiva, setTabActiva] = useState('habitaciones') // 'habitaciones' | 'hotel'

  // --- ESTADOS: Tipos de Habitaciones ---
  const [tipos, setTipos] = useState([])
  const [editandoId, setEditandoId] = useState(null)
  const [nombre, setNombre] = useState('')
  const [precioBase, setPrecioBase] = useState('')
  
  // URLs de las fotos
  const [fotoUrl, setFotoUrl] = useState('')
  const [foto2, setFoto2] = useState('')
  const [foto3, setFoto3] = useState('')
  const [foto4, setFoto4] = useState('')
  const [foto5, setFoto5] = useState('')

  // Estados de carga para archivos individuales
  const [subiendo1, setSubiendo1] = useState(false)
  const [subiendo2, setSubiendo2] = useState(false)
  const [subiendo3, setSubiendo3] = useState(false)
  const [subiendo4, setSubiendo4] = useState(false)
  const [subiendo5, setSubiendo5] = useState(false)

  const [caracteristicasSeleccionadas, setCaracteristicasSeleccionadas] = useState([])
  const [cargandoTipos, setCargandoTipos] = useState(true)

  // --- ESTADOS: Datos del Hotel ---
  const [hotelId, setHotelId] = useState(null)
  const [razonSocial, setRazonSocial] = useState('')
  const [nombreComercial, setNombreComercial] = useState('')
  const [ruc, setRuc] = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [emailFacturacion, setEmailFacturacion] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [guardandoHotel, setGuardandoHotel] = useState(false)

  const caracteristicasDisponibles = [
    'Alfombrado',
    'Ropero',
    'Butacas',
    'Mesa',
    'Cama Queen Size',
    'Cama 2 plazas',
    'Cama 2 plazas y 1.5 plazas',
    'Cama King Size',
    'Wi-Fi de alta velocidad',
    'Agua caliente 24/7',
    'TV Smart de 50"',
    'TV Smart de 55"',
    'Vista a la calle',
    'Desayuno americano incl.',
    'Jacuzzi privado hidromasaje'
  ]

  useEffect(() => {
    cargarTipos()
    cargarDatosHotel()
  }, [])

  // --- LÓGICA: Subir archivo a Supabase Storage ---
  const subirImagenASupabase = async (e, setUrlDestino, setSubiendoState) => {
    const file = e.target.files[0]
    if (!file) return

    setSubiendoState(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `habitaciones/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('hotel-assets')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('hotel-assets')
        .getPublicUrl(filePath)

      setUrlDestino(data.publicUrl)
    } catch (err) {
      alert("Error al subir la imagen: " + err.message)
    } finally {
      setSubiendoState(false)
    }
  }

  // --- LÓGICA: Tipos de Habitaciones ---
  const cargarTipos = async () => {
    try {
      const { data } = await supabase.from('tipos_habitacion').select('*').order('nombre')
      if (data) {
        const unicos = []
        const nombresVistos = new Set()
        for (const item of data) {
          if (!nombresVistos.has(item.nombre)) {
            nombresVistos.add(item.nombre)
            unicos.push(item)
          }
        }
        setTipos(unicos)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargandoTipos(false)
    }
  }

  const handleCheckboxChange = (carac) => {
    if (caracteristicasSeleccionadas.includes(carac)) {
      setCaracteristicasSeleccionadas(caracteristicasSeleccionadas.filter(c => c !== carac))
    } else {
      setCaracteristicasSeleccionadas([...caracteristicasSeleccionadas, carac])
    }
  }

  const handleGuardarTipo = async (e) => {
    e.preventDefault()
    if (!nombre || !precioBase) return

    const imagenPorDefecto = fotoUrl.trim() || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"
    
    const payloadHabitacion = {
      nombre: nombre.trim(),
      precio_base: parseFloat(precioBase), 
      caracteristicas: caracteristicasSeleccionadas,
      foto_url: imagenPorDefecto,
      foto_2: foto2.trim() || null,
      foto_3: foto3.trim() || null,
      foto_4: foto4.trim() || null,
      foto_5: foto5.trim() || null
    }

    let errorSupabase = null

    if (editandoId) {
      const { error } = await supabase
        .from('tipos_habitacion')
        .update(payloadHabitacion)
        .eq('id', editandoId)
      errorSupabase = error
    } else {
      const { error } = await supabase.from('tipos_habitacion').insert([payloadHabitacion])
      errorSupabase = error
    }

    if (errorSupabase) {
      alert("Error al guardar: " + errorSupabase.message)
    } else {
      limpiarFormularioHabitacion()
      cargarTipos()
    }
  }

  const iniciarEdicion = (t) => {
    setEditandoId(t.id)
    setNombre(t.nombre)
    setPrecioBase(t.precio_base)
    setFotoUrl(t.foto_url || '')
    setFoto2(t.foto_2 || '')
    setFoto3(t.foto_3 || '')
    setFoto4(t.foto_4 || '')
    setFoto5(t.foto_5 || '')
    setCaracteristicasSeleccionadas(t.caracteristicas || [])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const limpiarFormularioHabitacion = () => {
    setEditandoId(null)
    setNombre('')
    setPrecioBase('')
    setFotoUrl('')
    setFoto2('')
    setFoto3('')
    setFoto4('')
    setFoto5('')
    setCaracteristicasSeleccionadas([])
  }

  const eliminarTipo = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este tipo de habitación?")) return
    const { error } = await supabase.from('tipos_habitacion').delete().eq('id', id)
    if (!error) cargarTipos()
  }

  // --- LÓGICA: Datos del Hotel ---
  const cargarDatosHotel = async () => {
    try {
      const { data } = await supabase.from('configuracion_hotel').select('*').limit(1).maybeSingle()
      if (data) {
        setHotelId(data.id)
        setRazonSocial(data.razon_social || '')
        setNombreComercial(data.nombre_comercial || '')
        setRuc(data.ruc || '')
        setDireccion(data.direccion || '')
        setTelefono(data.telefono || '')
        setEmailFacturacion(data.email_facturacion || '')
        setLogoUrl(data.logo_url || '')
      }
    } catch (err) {
      console.error("Error al cargar datos del hotel:", err)
    }
  }

  const handleGuardarHotel = async (e) => {
    e.preventDefault()
    setGuardandoHotel(true)

    const payload = {
      razon_social: razonSocial.trim(),
      nombre_comercial: nombreComercial.trim(),
      ruc: ruc.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      email_facturacion: emailFacturacion.trim(),
      logo_url: logoUrl.trim()
    }

    let errorSupabase = null

    if (hotelId) {
      const { error } = await supabase.from('configuracion_hotel').update(payload).eq('id', hotelId)
      errorSupabase = error
    } else {
      const { data, error } = await supabase.from('configuracion_hotel').insert([payload]).select().single()
      errorSupabase = error
      if (data) setHotelId(data.id)
    }

    setGuardandoHotel(false)

    if (errorSupabase) {
      alert("Error al guardar datos del hotel: " + errorSupabase.message)
    } else {
      alert("¡Datos del hotel actualizados correctamente!")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Configuración del Sistema</h2>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => setTabActiva('habitaciones')}
          className={`py-3 px-6 font-bold text-sm rounded-t-xl transition-all ${
            tabActiva === 'habitaciones'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tipos de Habitaciones
        </button>
        <button
          onClick={() => setTabActiva('hotel')}
          className={`py-3 px-6 font-bold text-sm rounded-t-xl transition-all ${
            tabActiva === 'hotel'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Datos del Hotel / Comprobantes
        </button>
      </div>

      {/* PESTAÑA 1: TIPOS DE HABITACIONES */}
      {tabActiva === 'habitaciones' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-xl border space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-blue-900">
                {editandoId ? `Editando: ${nombre}` : 'Agregar Nuevo Tipo de Habitación'}
              </h3>
              {editandoId && (
                <button 
                  onClick={limpiarFormularioHabitacion}
                  className="bg-gray-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-gray-600 transition"
                >
                  Cancelar Edición
                </button>
              )}
            </div>
            
            <form onSubmit={handleGuardarTipo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Tipo</label>
                  <input 
                    type="text" 
                    value={nombre} 
                    onChange={e => setNombre(e.target.value)} 
                    className="w-full border p-3 rounded-xl" 
                    placeholder="Ej. Suite Matrimonial" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Precio Base (S/)</label>
                  <input 
                    type="number" 
                    value={precioBase} 
                    onChange={e => setPrecioBase(e.target.value)} 
                    className="w-full border p-3 rounded-xl" 
                    placeholder="300" 
                    required 
                  />
                </div>
              </div>

              {/* SECCIÓN DE CARGA DE FOTOGRAFÍAS DESDE ARCHIVOS DE WINDOWS */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border">
                <label className="block text-sm font-bold text-gray-800">Cargar Fotografías de la Habitación (Hasta 5)</label>
                
                {/* Foto Principal */}
                <div className="bg-white p-3 rounded-xl border">
                  <span className="text-xs font-bold text-blue-900 block mb-1">1. Foto Principal (Portada)</span>
                  <div className="flex items-center gap-3">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => subirImagenASupabase(e, setFotoUrl, setSubiendo1)} 
                      className="text-xs border rounded-lg p-1.5 w-full bg-gray-50 cursor-pointer" 
                    />
                    {subiendo1 && <span className="text-xs font-bold text-blue-600 animate-pulse">Subiendo...</span>}
                  </div>
                  {fotoUrl && <p className="text-[10px] text-green-700 font-semibold mt-1 truncate">✔ Cargada: {fotoUrl}</p>}
                </div>

                {/* Fotos Adicionales (2 a 5) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border">
                    <span className="text-xs font-bold text-gray-700 block mb-1">2. Foto Adicional</span>
                    <input type="file" accept="image/*" onChange={e => subirImagenASupabase(e, setFoto2, setSubiendo2)} className="text-xs border rounded-lg p-1 w-full bg-gray-50 cursor-pointer" />
                    {subiendo2 && <span className="text-[10px] text-blue-600 animate-pulse">Subiendo...</span>}
                    {foto2 && <p className="text-[9px] text-green-700 truncate mt-1">✔ OK</p>}
                  </div>

                  <div className="bg-white p-3 rounded-xl border">
                    <span className="text-xs font-bold text-gray-700 block mb-1">3. Foto Adicional</span>
                    <input type="file" accept="image/*" onChange={e => subirImagenASupabase(e, setFoto3, setSubiendo3)} className="text-xs border rounded-lg p-1 w-full bg-gray-50 cursor-pointer" />
                    {subiendo3 && <span className="text-[10px] text-blue-600 animate-pulse">Subiendo...</span>}
                    {foto3 && <p className="text-[9px] text-green-700 truncate mt-1">✔ OK</p>}
                  </div>

                  <div className="bg-white p-3 rounded-xl border">
                    <span className="text-xs font-bold text-gray-700 block mb-1">4. Foto Adicional</span>
                    <input type="file" accept="image/*" onChange={e => subirImagenASupabase(e, setFoto4, setSubiendo4)} className="text-xs border rounded-lg p-1 w-full bg-gray-50 cursor-pointer" />
                    {subiendo4 && <span className="text-[10px] text-blue-600 animate-pulse">Subiendo...</span>}
                    {foto4 && <p className="text-[9px] text-green-700 truncate mt-1">✔ OK</p>}
                  </div>

                  <div className="bg-white p-3 rounded-xl border">
                    <span className="text-xs font-bold text-gray-700 block mb-1">5. Foto Adicional</span>
                    <input type="file" accept="image/*" onChange={e => subirImagenASupabase(e, setFoto5, setSubiendo5)} className="text-xs border rounded-lg p-1 w-full bg-gray-50 cursor-pointer" />
                    {subiendo5 && <span className="text-[10px] text-blue-600 animate-pulse">Subiendo...</span>}
                    {foto5 && <p className="text-[9px] text-green-700 truncate mt-1">✔ OK</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Características y Mobiliario (Checklist)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 p-4 rounded-xl border max-h-60 overflow-y-auto">
                  {caracteristicasDisponibles.map((carac) => (
                    <label key={carac} className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={caracteristicasSeleccionadas.includes(carac)}
                        onChange={() => handleCheckboxChange(carac)}
                        className="w-4 h-4 text-blue-900 rounded"
                      />
                      {carac}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold p-3 rounded-xl transition shadow">
                {editandoId ? 'Actualizar Tipo de Habitación' : 'Guardar Tipo de Habitación'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-4">Foto</th>
                  <th className="p-4">Tipo de Habitación</th>
                  <th className="p-4">Precio Base</th>
                  <th className="p-4">Características</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargandoTipos ? (
                  <tr><td colSpan="5" className="p-6 text-center text-gray-500 font-bold">Cargando tipos...</td></tr>
                ) : tipos.length === 0 ? (
                  <tr><td colSpan="5" className="p-6 text-center text-gray-500 font-bold">No hay tipos registrados aún.</td></tr>
                ) : (
                  tipos.map(t => (
                    <tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <img src={t.foto_url || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=200&q=80"} alt="" className="w-16 h-12 object-cover rounded-lg shadow" />
                      </td>
                      <td className="p-4 font-bold text-gray-800">{t.nombre}</td>
                      <td className="p-4 text-blue-900 font-bold">S/ {t.precio_base}</td>
                      <td className="p-4 text-xs text-gray-600">
                        {t.caracteristicas && t.caracteristicas.length > 0 ? t.caracteristicas.join(', ') : 'Ninguna'}
                      </td>
                      <td className="p-4 text-center space-x-2">
                        <button 
                          onClick={() => iniciarEdicion(t)}
                          className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-blue-200 transition"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => eliminarTipo(t.id)}
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
      )}

      {/* PESTAÑA 2: DATOS DEL HOTEL */}
      {tabActiva === 'hotel' && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border space-y-6">
          <div>
            <h3 className="text-xl font-bold text-blue-900">Datos Principales del Establecimiento</h3>
            <p className="text-sm text-gray-500">Esta información se imprimirá en las boletas, facturas y notas electrónicas.</p>
          </div>

          <form onSubmit={handleGuardarHotel} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Razón Social</label>
                <input 
                  type="text" 
                  value={razonSocial} 
                  onChange={e => setRazonSocial(e.target.value)} 
                  className="w-full border p-3 rounded-xl" 
                  placeholder="Ej. HOTEL S.A.C." 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Comercial</label>
                <input 
                  type="text" 
                  value={nombreComercial} 
                  onChange={e => setNombreComercial(e.target.value)} 
                  className="w-full border p-3 rounded-xl" 
                  placeholder="Ej. Hotel Gran Palacio" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Número de RUC</label>
                <input 
                  type="text" 
                  value={ruc} 
                  onChange={e => setRuc(e.target.value)} 
                  className="w-full border p-3 rounded-xl" 
                  placeholder="Ej. 20123456789" 
                  maxLength={11}
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono / Celular de Contacto</label>
                <input 
                  type="text" 
                  value={telefono} 
                  onChange={e => setTelefono(e.target.value)} 
                  className="w-full border p-3 rounded-xl" 
                  placeholder="Ej. +51 987 654 321" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Dirección Fiscal / Establecimiento</label>
              <input 
                type="text" 
                value={direccion} 
                onChange={e => setDireccion(e.target.value)} 
                className="w-full border p-3 rounded-xl" 
                placeholder="Ej. Av. Próceres de la Independencia 123, San Juan de Lurigancho" 
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico de Facturación</label>
                <input 
                  type="email" 
                  value={emailFacturacion} 
                  onChange={e => setEmailFacturacion(e.target.value)} 
                  className="w-full border p-3 rounded-xl" 
                  placeholder="facturacion@mihotel.com" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL del Logotipo</label>
                <input 
                  type="url" 
                  value={logoUrl} 
                  onChange={e => setLogoUrl(e.target.value)} 
                  className="w-full border p-3 rounded-xl" 
                  placeholder="https://..." 
                />
              </div>
            </div>

            {/* Previsualización del Logo si existe */}
            {logoUrl && (
              <div className="p-3 bg-gray-50 rounded-xl border flex items-center gap-4">
                <span className="text-xs font-bold text-gray-500">Vista previa del logo:</span>
                <img src={logoUrl} alt="Logo Previsto" className="h-12 object-contain rounded" />
              </div>
            )}

            <button 
              type="submit" 
              disabled={guardandoHotel}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white font-bold p-3 rounded-xl transition shadow"
            >
              {guardandoHotel ? 'Guardando...' : 'Guardar Datos del Hotel'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
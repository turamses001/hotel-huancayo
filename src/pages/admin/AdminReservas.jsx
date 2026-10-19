import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminReservas() {
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [vistaTabla, setVistaTabla] = useState(false)
  const [modalNuevo, setModalNuevo] = useState(false)

  // Estados para el modal de cancelación detallada
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false)
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('Cambio de planes del cliente')
  const [devuelveDinero, setDevuelveDinero] = useState('No')
  const [formaDevolucion, setFormaDevolucion] = useState('Efectivo')

  // Tipos de habitación y clientes
  const [tiposHabitacion, setTiposHabitacion] = useState([])
  const [clientes, setClientes] = useState([])
  const [dniBusqueda, setDniBusqueda] = useState('')
  const [clienteEncontrado, setClienteEncontrado] = useState(null)

  // Formulario de nueva reserva manual
  const [formData, setFormData] = useState({
    cliente_id: '',
    nombre_huesped: '',
    doc_huesped: '',
    tipo_habitacion: '',
    cantidad: 1,
    fecha_ingreso: '',
    fecha_salida: '',
    observaciones: 'Reserva manual de recepción'
  })

  // Obtener fecha local en formato YYYY-MM-DD
  const obtenerFechaLocal = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const hoyStr = obtenerFechaLocal()

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)
    const { data: resData } = await supabase.from('reservas').select('*').order('fecha_ingreso', { ascending: false })
    const { data: tiposData } = await supabase.from('tipos_habitacion').select('*')
    const { data: cliData } = await supabase.from('clientes').select('*')

    if (resData) setReservas(resData)
    if (tiposData) setTiposHabitacion(tiposData)
    if (cliData) setClientes(cliData)
    setCargando(false)
  }

  // Función auxiliar para extraer el nombre del huésped sin importar cómo se guardó en la BD
  const obtenerNombreHuesped = (res) => {
    if (res.nombre_huesped) return res.nombre_huesped
    if (res.cliente_nombre) return res.cliente_nombre
    if (res.nombre) return res.nombre
    
    if (res.cliente_id && clientes.length > 0) {
      const cli = clientes.find(c => c.id === res.cliente_id)
      if (cli) return cli.nombre || cli.nombres || cli.email || 'Cliente registrado'
    }

    if (res.email) return res.email

    return 'Huésped General / Web'
  }

  const obtenerDocHuesped = (res) => {
    if (res.doc_huesped) return res.doc_huesped
    if (res.dni) return res.dni
    if (res.documento) return res.documento

    if (res.cliente_id && clientes.length > 0) {
      const cli = clientes.find(c => c.id === res.cliente_id)
      if (cli) return cli.dni || cli.documento || ''
    }
    return ''
  }

  const buscarClientePorDni = () => {
    const encontrado = clientes.find(c => c.dni === dniBusqueda || c.documento === dniBusqueda)
    if (encontrado) {
      setClienteEncontrado(encontrado)
      setFormData({
        ...formData,
        cliente_id: encontrado.id,
        nombre_huesped: encontrado.nombre || encontrado.nombres,
        doc_huesped: encontrado.dni || encontrado.documento
      })
      alert(`Cliente encontrado: ${encontrado.nombre || encontrado.nombres}`)
    } else {
      alert("Cliente no encontrado con ese DNI. Puedes ingresarlo manualmente.")
    }
  }

  const handleCrearReserva = async (e) => {
    e.preventDefault()
    if (!formData.tipo_habitacion || !formData.fecha_ingreso || !formData.fecha_salida || !formData.nombre_huesped) {
      alert("Por favor completa los campos obligatorios.")
      return
    }

    // Validación anti-overbooking
    const { data: habsData } = await supabase.from('habitaciones').select('*')
    const fisicasTotales = habsData ? habsData.filter(h => h.tipo === formData.tipo_habitacion && h.estado !== 'Mantenimiento').length : 3

    const { data: reservasActivas } = await supabase.from('reservas').select('*').eq('estado', 'Confirmada').eq('tipo_habitacion', formData.tipo_habitacion)

    let reservadasEnFechas = 0
    if (reservasActivas) {
      reservasActivas.forEach(res => {
        if (res.fecha_ingreso < formData.fecha_salida && res.fecha_salida > formData.fecha_ingreso) {
          reservadasEnFechas += (res.cantidad || 1)
        }
      })
    }

    const stockLibre = fisicasTotales - reservadasEnFechas
    if (formData.cantidad > stockLibre) {
      alert(`No hay suficiente stock disponible. Disponibles en esas fechas: ${stockLibre}`)
      return
    }

    const { error } = await supabase.from('reservas').insert([{
      ...formData,
      estado: 'Confirmada'
    }])

    if (error) {
      alert("Error al registrar la reserva: " + error.message)
    } else {
      alert("¡Reserva manual registrada con éxito!")
      setModalNuevo(false)
      setFormData({
        cliente_id: '',
        nombre_huesped: '',
        doc_huesped: '',
        tipo_habitacion: '',
        cantidad: 1,
        fecha_ingreso: '',
        fecha_salida: '',
        observaciones: 'Reserva manual de recepción'
      })
      setDniBusqueda('')
      setClienteEncontrado(null)
      cargarDatos()
    }
  }

  const abrirModalCancelar = (res) => {
    setReservaSeleccionada(res)
    setMotivoCancelacion('Cambio de planes del cliente')
    setDevuelveDinero('No')
    setFormaDevolucion('Efectivo')
    setModalCancelarAbierto(true)
  }

  const confirmarCancelacionReserva = async (e) => {
    e.preventDefault()
    if (!reservaSeleccionada) return

    const obsAdicional = ` | [CANCELADA] Motivo: ${motivoCancelacion} - Devuelve dinero: ${devuelveDinero} (${formaDevolucion})`
    const observacionActualizada = `${reservaSeleccionada.observaciones || ''}${obsAdicional}`.trim()

    const { error } = await supabase
      .from('reservas')
      .update({ 
        estado: 'Cancelada',
        observaciones: observacionActualizada 
      })
      .eq('id', reservaSeleccionada.id)

    if (error) {
      alert("Error al cancelar la reserva: " + error.message)
    } else {
      alert("Reserva cancelada correctamente con su respectivo registro.")
      setModalCancelarAbierto(false)
      cargarDatos()
    }
  }

  // Separar reservas Vigentes vs Historial (Pasadas)
  const reservasVigentes = reservas.filter(r => r.fecha_salida >= hoyStr || r.estado === 'Cancelada')
  const reservasHistorial = reservas.filter(r => r.fecha_salida < hoyStr && r.estado !== 'Cancelada')

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 border flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">GESTIÓN DE RESERVAS</h2>
          <p className="text-sm text-gray-500 mt-1">Control anti-overbooking, listado activo e historial de salidas.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setVistaTabla(!vistaTabla)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2.5 rounded-xl border transition shadow-sm text-sm"
          >
            {vistaTabla ? '📅 Ver Calendario Activo' : '📋 Ver Tabla General'}
          </button>
          <button 
            onClick={() => setModalNuevo(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-lg text-sm flex items-center gap-2"
          >
            <span>+ Nueva Reserva Manual</span>
          </button>
        </div>
      </div>

      {cargando ? (
        <p className="text-center text-gray-500 py-12 font-semibold">Cargando reservas del sistema...</p>
      ) : (
        <>
          {/* VISTA CALENDARIO / TARJETAS VIGENTES */}
          {!vistaTabla ? (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border">
                <h3 className="text-lg font-bold text-gray-800 mb-1">📅 Reservas Activas y Vigentes</h3>
                <p className="text-xs text-gray-500 mb-6">Listado cronológico de reservas en curso o próximas a ingresar:</p>
                
                {reservasVigentes.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No hay reservas vigentes en este momento.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reservasVigentes.map((res) => {
                      const nombreHuesp = obtenerNombreHuesped(res)
                      const docHuesp = obtenerDocHuesped(res)
                      const esCancelada = res.estado?.toLowerCase() === 'cancelada'

                      return (
                        <div key={res.id} className="bg-gray-50 rounded-2xl p-5 border shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-extrabold text-blue-900 text-base">{res.tipo_habitacion} ({res.cantidad || 1}x)</h4>
                              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                                esCancelada ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-800'
                              }`}>
                                {res.estado}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-gray-800">Huésped: {nombreHuesp}</p>
                            {docHuesp && <p className="text-xs text-gray-500">Doc: {docHuesp}</p>}
                            <p className="text-xs font-semibold text-blue-800 mt-2 flex items-center gap-1">
                              <span>📅</span> Del {res.fecha_ingreso} al {res.fecha_salida}
                            </p>
                            <p className="text-xs text-gray-500 italic mt-2 bg-white p-2 rounded border">Obs: {res.observaciones || 'Ninguna'}</p>
                          </div>
                          
                          {!esCancelada && (
                            <div className="mt-4 pt-3 border-t flex justify-end">
                              <button 
                                onClick={() => abrirModalCancelar(res)}
                                className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-1.5 rounded-lg border border-rose-200 transition shadow-sm"
                              >
                                ❌ Cancelar Reserva
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* SECCIÓN HISTORIAL DE RESERVAS PASADAS */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-1">📂 Historial de Reservas Pasadas</h3>
                <p className="text-xs text-gray-500 mb-4">Reservas cuya fecha de salida ya concluyó respecto a hoy ({hoyStr}):</p>
                
                {reservasHistorial.length === 0 ? (
                  <p className="text-center text-gray-400 py-6 text-sm">No hay reservas en el historial pasado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 text-xs uppercase font-bold border-b">
                          <th className="p-3">Huésped / Doc</th>
                          <th className="p-3">Habitación</th>
                          <th className="p-3">Fechas (Ingreso ➔ Salida)</th>
                          <th className="p-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm">
                        {reservasHistorial.map((res) => {
                          const nombreHuesp = obtenerNombreHuesped(res)
                          const docHuesp = obtenerDocHuesped(res)

                          return (
                            <tr key={res.id} className="hover:bg-gray-50 text-gray-600">
                              <td className="p-3 font-bold text-gray-800">
                                {nombreHuesp}
                                <span className="block text-xs font-normal text-gray-400">{docHuesp || 'S/D'}</span>
                              </td>
                              <td className="p-3">{res.tipo_habitacion} ({res.cantidad || 1}x)</td>
                              <td className="p-3 text-xs font-semibold">{res.fecha_ingreso} al {res.fecha_salida}</td>
                              <td className="p-3">
                                <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                                  Finalizada
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VISTA TABLA GENERAL (SEPARADA EN VIGENTES E HISTORIAL) */
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
                <div className="p-6 border-b bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800">📋 Listado de Reservas Activas y Vigentes</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Reservas vigentes u operativas en curso:</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-blue-900 text-white text-xs uppercase tracking-wider">
                        <th className="p-4">Huésped / Cliente</th>
                        <th className="p-4">Habitación & Cantidad</th>
                        <th className="p-4">Fechas (Ingreso ➔ Salida)</th>
                        <th className="p-4">Observaciones</th>
                        <th className="p-4">Estado / Pago</th>
                        <th className="p-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs font-medium text-gray-700">
                      {reservasVigentes.map((res) => {
                        const nombreHuesp = obtenerNombreHuesped(res)
                        const docHuesp = obtenerDocHuesped(res)
                        const esCancelada = res.estado?.toLowerCase() === 'cancelada'

                        return (
                          <tr key={res.id} className="hover:bg-gray-50 transition">
                            <td className="p-4">
                              <p className="font-bold text-gray-900">{nombreHuesp}</p>
                              <p className="text-[10px] text-gray-500">Doc: {docHuesp || 'No reg.'}</p>
                            </td>
                            <td className="p-4 font-bold text-blue-900">{res.cantidad || 1}x {res.tipo_habitacion}</td>
                            <td className="p-4 text-sm font-semibold">{res.fecha_ingreso} ➔ {res.fecha_salida}</td>
                            <td className="p-4 text-xs text-gray-600 max-w-xs">{res.observaciones || '-'}</td>
                            <td className="p-4">
                              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                                esCancelada ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-800'
                              }`}>
                                {res.estado}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {!esCancelada && (
                                <button 
                                  onClick={() => abrirModalCancelar(res)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl font-extrabold text-[11px] shadow transition"
                                >
                                  ❌ Cancelar
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLA HISTORIAL EN VISTA TABLA GENERAL */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
                <div className="p-6 border-b bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800">📂 Historial de Reservas Pasadas</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Estancias concluidas (Check-out anterior a hoy):</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-200 text-gray-700 text-xs uppercase tracking-wider">
                        <th className="p-4">Huésped / Cliente</th>
                        <th className="p-4">Habitación & Cantidad</th>
                        <th className="p-4">Fechas (Ingreso ➔ Salida)</th>
                        <th className="p-4">Observaciones</th>
                        <th className="p-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {reservasHistorial.map((res) => {
                        const nombreHuesp = obtenerNombreHuesped(res)
                        const docHuesp = obtenerDocHuesped(res)

                        return (
                          <tr key={res.id} className="hover:bg-gray-50 text-gray-600">
                            <td className="p-4">
                              <p className="font-bold text-gray-900">{nombreHuesp}</p>
                              <p className="text-xs text-gray-400">Doc: {docHuesp || 'No reg.'}</p>
                            </td>
                            <td className="p-4 font-semibold text-gray-800">{res.cantidad || 1}x {res.tipo_habitacion}</td>
                            <td className="p-4 text-xs font-semibold">{res.fecha_ingreso} ➔ {res.fecha_salida}</td>
                            <td className="p-4 text-xs text-gray-500 max-w-xs">{res.observaciones || '-'}</td>
                            <td className="p-4">
                              <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                                Finalizada
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DE CANCELACIÓN DETALLADA */}
      {modalCancelarAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 text-gray-800">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-extrabold text-rose-700">❌ Cancelar Reserva</h3>
              <button onClick={() => setModalCancelarAbierto(false)} className="text-gray-400 font-bold text-xl">✕</button>
            </div>

            <form onSubmit={confirmarCancelacionReserva} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Motivo de Cancelación</label>
                <select
                  value={motivoCancelacion}
                  onChange={e => setMotivoCancelacion(e.target.value)}
                  className="w-full border p-3 rounded-xl bg-white text-xs font-bold"
                >
                  <option value="Cambio de planes del cliente">Cambio de planes del cliente</option>
                  <option value="No se presentó / Show-up negativo">No se presentó / Show-up negativo</option>
                  <option value="Emergencia médica o personal">Emergencia médica o personal</option>
                  <option value="Duplicidad de reserva">Duplicidad de reserva</option>
                  <option value="Problemas con el pago">Problemas con el pago</option>
                  <option value="Otro motivo">Otro motivo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">¿Se devuelve dinero?</label>
                  <select
                    value={devuelveDinero}
                    onChange={e => setDevuelveDinero(e.target.value)}
                    className="w-full border p-3 rounded-xl bg-white text-xs font-bold"
                  >
                    <option value="No">No</option>
                    <option value="Sí (Parcial)">Sí (Parcial)</option>
                    <option value="Sí (Total)">Sí (Total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Forma de Devolución</label>
                  <select
                    value={formaDevolucion}
                    onChange={e => setFormaDevolucion(e.target.value)}
                    className="w-full border p-3 rounded-xl bg-white text-xs font-bold"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Yape / Plin">Yape / Plin</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta (Reverso)</option>
                    <option value="No aplica">No aplica</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalCancelarAbierto(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow"
                >
                  Confirmar Cancelación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA RESERVA MANUAL */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-extrabold text-gray-900">Nueva Reserva Manual</h3>
              <button onClick={() => setModalNuevo(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 space-y-2">
              <label className="block text-xs font-bold text-blue-900 uppercase">Buscar Cliente por DNI (Opcional)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ingrese DNI..." 
                  value={dniBusqueda}
                  onChange={(e) => setDniBusqueda(e.target.value)}
                  className="flex-1 border p-2 rounded-lg text-sm bg-white"
                />
                <button 
                  type="button" 
                  onClick={buscarClientePorDni}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg text-xs"
                >
                  Buscar
                </button>
              </div>
              {clienteEncontrado && (
                <p className="text-xs text-green-700 font-bold">✔ Huésped seleccionado: {clienteEncontrado.nombre || clienteEncontrado.nombres}</p>
              )}
            </div>

            <form onSubmit={handleCrearReserva} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nombre del Huésped *</label>
                <input 
                  type="text" 
                  value={formData.nombre_huesped}
                  onChange={(e) => setFormData({...formData, nombre_huesped: e.target.value})}
                  className="w-full border p-2.5 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Tipo de Habitación *</label>
                  <select 
                    value={formData.tipo_habitacion}
                    onChange={(e) => setFormData({...formData, tipo_habitacion: e.target.value})}
                    className="w-full border p-2.5 rounded-xl text-sm bg-white"
                    required
                  >
                    <option value="">Seleccione...</option>
                    {tiposHabitacion.map(t => (
                      <option key={t.id} value={t.nombre}>{t.nombre} (S/ {t.precio_base})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cantidad *</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: parseInt(e.target.value) || 1})}
                    className="w-full border p-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Fecha Ingreso *</label>
                  <input 
                    type="date" 
                    value={formData.fecha_ingreso}
                    onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})}
                    className="w-full border p-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Fecha Salida *</label>
                  <input 
                    type="date" 
                    value={formData.fecha_salida}
                    onChange={(e) => setFormData({...formData, fecha_salida: e.target.value})}
                    className="w-full border p-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Observaciones</label>
                <textarea 
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  className="w-full border p-2.5 rounded-xl text-sm"
                  rows="2"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setModalNuevo(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2 rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-xl text-sm shadow"
                >
                  Guardar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
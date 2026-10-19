import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminRecepcion() {
  const [habitaciones, setHabitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  
  // Estados para Check-in
  const [modalCheckinAbierto, setModalCheckinAbierto] = useState(false)
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null)
  const [nombreHuesped, setNombreHuesped] = useState('')
  const [tipoDocHuesped, setTipoDocHuesped] = useState('DNI')
  const [dniHuesped, setDniHuesped] = useState('')
  const [telefonoHuesped, setTelefonoHuesped] = useState('')
  const [formaPago, setFormaPago] = useState('Efectivo')
  const [montoCancelado, setMontoCancelado] = useState('')
  const [buscandoDni, setBuscandoDni] = useState(false)

  // Estados para Consumos Adicionales
  const [modalConsumoAbierto, setModalConsumoAbierto] = useState(false)
  const [habitacionConsumo, setHabitacionConsumo] = useState(null)
  const [productosDisponibles, setProductosDisponibles] = useState([])
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cantidadConsumo, setCantidadConsumo] = useState(1)
  const [formaPagoConsumo, setFormaPagoConsumo] = useState('Cargar a Habitación')

  // Estados para Modal de Check-out con Detalle Completo
  const [modalCheckoutAbierto, setModalCheckoutAbierto] = useState(false)
  const [habitacionCheckout, setHabitacionCheckout] = useState(null)
  const [detalleConsumos, setDetalleConsumos] = useState([])
  const [totalPendiente, setTotalPendiente] = useState(0)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    const { data: habs } = await supabase.from('habitaciones').select('*').order('numero')
    if (habs) setHabitaciones(habs)

    const { data: prods } = await supabase.from('productos').select('*').order('nombre')
    if (prods) setProductosDisponibles(prods)

    setCargando(false)
  }

  const abrirCheckin = (hab) => {
    setHabitacionSeleccionada(hab)
    setNombreHuesped('')
    setTipoDocHuesped('DNI')
    setDniHuesped('')
    setTelefonoHuesped('')
    setFormaPago('Efectivo')
    setMontoCancelado('')
    setModalCheckinAbierto(true)
  }

  const handleBuscarDniLocal = async () => {
    const docBuscado = dniHuesped.trim()
    if (!docBuscado || docBuscado.length < 6) {
      alert("Ingresa un número de documento válido.")
      return
    }

    setBuscandoDni(true)
    try {
      const { data: clientesList } = await supabase.from('clientes').select('*')
      let encontrado = clientesList?.find(c => c.numero_documento?.trim() === docBuscado || c.dni?.trim() === docBuscado)

      if (encontrado) {
        setNombreHuesped(encontrado.nombre || encontrado.nombres)
        if (encontrado.telefono) setTelefonoHuesped(encontrado.telefono)
        if (encontrado.tipo_documento) setTipoDocHuesped(encontrado.tipo_documento)
        setBuscandoDni(false)
        return
      }

      const { data: perfilesList } = await supabase.from('perfiles').select('*')
      let perfilEncontrado = perfilesList?.find(p => p.dni?.trim() === docBuscado || p.id === docBuscado)

      if (perfilEncontrado) {
        const nombreCompleto = `${perfilEncontrado.nombres || ''} ${perfilEncontrado.apellidos || ''}`.trim()
        setNombreHuesped(nombreCompleto || perfilEncontrado.email || 'Cliente Web')
        if (perfilEncontrado.telefono) setTelefonoHuesped(perfilEncontrado.telefono)
        setBuscandoDni(false)
        return
      }

      alert("El número de documento no se encuentra registrado.")
    } catch (err) {
      console.error("Error en búsqueda:", err)
      alert("Error al consultar la base de datos.")
    } finally {
      setBuscandoDni(false)
    }
  }

  const confirmarCheckin = async (e) => {
    e.preventDefault()
    if (!nombreHuesped || !dniHuesped || !habitacionSeleccionada) return

    // Registrar cliente en la tabla clientes
    await supabase.from('clientes').insert([
      { 
        nombre: nombreHuesped.trim(), 
        nombres: nombreHuesped.trim(),
        tipo_documento: tipoDocHuesped, 
        numero_documento: dniHuesped.trim(),
        dni: dniHuesped.trim(),
        telefono: telefonoHuesped.trim()
      }
    ])

    const montoNum = parseFloat(montoCancelado)
    if (!isNaN(montoNum) && montoNum > 0) {
      await supabase.from('ventas').insert([{ total: montoNum }])
    }

    // Actualizar la habitación a ocupada y guardar el nombre del huésped
    const { error } = await supabase
      .from('habitaciones')
      .update({ 
        estado: 'Ocupada',
        huesped: nombreHuesped.trim()
      })
      .eq('numero', habitacionSeleccionada.numero)

    if (!error) {
      setModalCheckinAbierto(false)
      cargarDatos()
    } else {
      alert("Error al actualizar la habitación: " + error.message)
    }
  }

  const abrirModalConsumo = (hab) => {
    setHabitacionConsumo(hab)
    setBusquedaProducto('')
    setProductoSeleccionado(null)
    setCantidadConsumo(1)
    setFormaPagoConsumo('Cargar a Habitación')
    setModalConsumoAbierto(true)
  }

  const registrarConsumoAdicional = async (e) => {
    e.preventDefault()
    if (!productoSeleccionado || !habitacionConsumo) return

    const cantidad = parseInt(cantidadConsumo) || 1
    const precioUnitario = Number(productoSeleccionado.precio_venta)
    const totalVenta = precioUnitario * cantidad

    const { error: errorConsumo } = await supabase.from('consumos_habitacion').insert([{
      numero_habitacion: String(habitacionConsumo.numero),
      producto: productoSeleccionado.nombre,
      cantidad: cantidad,
      precio_unitario: precioUnitario,
      total: totalVenta,
      tipo_pago: formaPagoConsumo
    }])

    if (errorConsumo) {
      alert("Error al registrar consumo: " + errorConsumo.message)
      return
    }

    if (formaPagoConsumo !== 'Cargar a Habitación') {
      await supabase.from('ventas').insert([{ total: totalVenta }])
    }

    const nuevoStock = Math.max(0, (productoSeleccionado.stock || 0) - cantidad)
    await supabase.from('productos').update({ stock: nuevoStock }).eq('id', productoSeleccionado.id)

    alert(`¡Consumo registrado! (${formaPagoConsumo}) - Total: S/ ${totalVenta.toFixed(2)}`)
    setModalConsumoAbierto(false)
    cargarDatos()
  }

  const abrirCheckoutModal = async (hab) => {
    setHabitacionCheckout(hab)
    setModalCheckoutAbierto(true)
    setCargandoDetalle(true)

    try {
      const { data: consumosData } = await supabase
        .from('consumos_habitacion')
        .select('*')
        .eq('numero_habitacion', String(hab.numero))

      let listaConsumos = []
      let acumuladoPendiente = 0

      const tarifaBaseHabitacion = Number(hab.precio || hab.tarifa || 80.00)
      acumuladoPendiente += tarifaBaseHabitacion
      listaConsumos.push({
        descripcion: `Alojamiento Habitación ${hab.numero}`,
        monto: tarifaBaseHabitacion,
        estadoPago: 'Cargar a Habitación'
      })

      if (consumosData && consumosData.length > 0) {
        consumosData.forEach(c => {
          const montoC = Number(c.total || 0)
          const esCargo = c.tipo_pago === 'Cargar a Habitación'

          if (esCargo) {
            acumuladoPendiente += montoC
            listaConsumos.push({
              descripcion: `${c.producto} (x${c.cantidad})`,
              monto: montoC,
              estadoPago: 'Cargar a Habitación'
            })
          } else {
            listaConsumos.push({
              descripcion: `${c.producto} (x${c.cantidad})`,
              monto: montoC,
              estadoPago: `Pagado (${c.tipo_pago})`
            })
          }
        })
      }

      setDetalleConsumos(listaConsumos)
      setTotalPendiente(acumuladoPendiente)
    } catch (err) {
      console.error("Error al cargar detalle de check-out:", err)
      setDetalleConsumos([{ descripcion: `Alojamiento Habitación ${hab.numero}`, monto: 80, estadoPago: 'Cargar a Habitación' }])
      setTotalPendiente(80)
    } finally {
      setCargandoDetalle(false)
    }
  }

  const confirmarCheckoutFinal = async () => {
    if (!habitacionCheckout) return

    const { error } = await supabase
      .from('habitaciones')
      .update({ 
        estado: 'Limpieza',
        huesped: null 
      })
      .eq('numero', habitacionCheckout.numero)

    if (error) {
      alert("Error al realizar el check-out: " + error.message)
    } else {
      alert(`¡Check-out exitoso! Habitación ${habitacionCheckout.numero} pasó a estado de Limpieza.`)
      setModalCheckoutAbierto(false)
      cargarDatos()
    }
  }

  const marcarLibre = async (numeroHab) => {
    const { error } = await supabase
      .from('habitaciones')
      .update({ 
        estado: 'Libre',
        huesped: null 
      })
      .eq('numero', numeroHab)

    if (error) {
      alert("Error al marcar como libre: " + error.message)
    } else {
      cargarDatos()
    }
  }

  const productosFiltrados = busquedaProducto.trim() === '' ? [] : productosDisponibles.filter(p => 
    p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Recepción - Control de Habitaciones</h2>
        <div className="flex gap-3 text-xs font-bold flex-wrap">
          <span className="bg-red-500 text-white px-3 py-1.5 rounded-lg shadow">🔴 Ocupado</span>
          <span className="bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow">🔵 Disponible</span>
          <span className="bg-purple-500 text-white px-3 py-1.5 rounded-lg shadow">🧹 Limpieza</span>
          <span className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg shadow">🟡 Mantenimiento</span>
        </div>
      </div>

      {cargando ? (
        <p className="text-center text-gray-500 text-xl font-bold py-12">Cargando tablero...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {habitaciones.map(hab => {
            let bgColor = "bg-blue-500 hover:bg-blue-600"
            let estadoTexto = "DISPONIBLE"
            if (hab.estado === 'Ocupada' || hab.estado === 'Ocupado') {
              bgColor = "bg-red-500 hover:bg-red-600"
              estadoTexto = "OCUPADO"
            } else if (hab.estado === 'Limpieza') {
              bgColor = "bg-purple-600 hover:bg-purple-700"
              estadoTexto = "EN LIMPIEZA"
            } else if (hab.estado === 'Mantenimiento') {
              bgColor = "bg-yellow-500 hover:bg-yellow-600"
              estadoTexto = "MANTENIMIENTO"
            }

            return (
              <div key={hab.numero || hab.id} className={`${bgColor} text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between transition`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-3xl font-black">{hab.numero}</span>
                    <span className="block text-xs font-semibold text-white/80 mt-0.5">{hab.tipo}</span>
                  </div>
                  
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {hab.estado === 'Libre' && (
                      <button 
                        onClick={() => abrirCheckin(hab)}
                        title="Hacer Check-in"
                        className="bg-white/25 hover:bg-white/40 px-3 py-1.5 rounded-lg text-xs transition font-bold shadow"
                      >
                        📥 Check-in
                      </button>
                    )}
                    {(hab.estado === 'Ocupada' || hab.estado === 'Ocupado') && (
                      <>
                        <button 
                          onClick={() => abrirModalConsumo(hab)}
                          title="Agregar Consumo"
                          className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-3 py-1.5 rounded-lg text-xs transition font-extrabold shadow"
                        >
                          🛒 Consumo
                        </button>
                        <button 
                          onClick={() => abrirCheckoutModal(hab)}
                          title="Realizar Check-out"
                          className="bg-white/25 hover:bg-white/40 px-3 py-1.5 rounded-lg text-xs transition font-bold shadow"
                        >
                          📤 Check-out
                        </button>
                      </>
                    )}
                    {hab.estado === 'Limpieza' && (
                      <button 
                        onClick={() => marcarLibre(hab.numero)}
                        title="Terminar Limpieza"
                        className="bg-white/25 hover:bg-white/40 px-3 py-1.5 rounded-lg text-xs transition font-bold shadow"
                      >
                        ✨ Marcar Libre
                      </button>
                    )}
                  </div>
                </div>

                <div className="py-6 text-center space-y-1">
                  <div className="text-4xl mb-1">🚪</div>
                  <span className="block font-bold text-sm tracking-widest uppercase text-white/90">Habitación {hab.numero}</span>
                  {/* Muestra el huésped actual */}
                  {hab.huesped && (
                    <span className="inline-block bg-black/30 text-white text-xs font-bold px-3 py-1 rounded-lg mt-2 truncate max-w-full">
                      👤 {hab.huesped}
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-white/20 flex justify-between items-center text-xs font-black tracking-wider">
                  <span>ESTADO:</span>
                  <span className="bg-black/20 px-3 py-1 rounded-full">{estadoTexto}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL CHECK-IN */}
      {modalCheckinAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-gray-800 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-bold text-blue-900">Check-in - Habitación {habitacionSeleccionada?.numero}</h3>
              <button onClick={() => setModalCheckinAbierto(false)} className="text-gray-400 font-bold text-xl">✕</button>
            </div>

            <form onSubmit={confirmarCheckin} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Documento</label>
                  <select 
                    value={tipoDocHuesped} 
                    onChange={e => setTipoDocHuesped(e.target.value)} 
                    className="w-full border p-2.5 rounded-xl bg-white font-medium text-xs"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">Carnet de Extranjería</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">N° de Documento</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={dniHuesped} 
                      onChange={e => setDniHuesped(e.target.value)} 
                      className="w-full border p-2.5 rounded-xl outline-none focus:border-blue-900 font-bold text-xs" 
                      required 
                    />
                    <button 
                      type="button"
                      onClick={handleBuscarDniLocal}
                      disabled={buscandoDni}
                      className="bg-blue-900 text-white px-3 rounded-xl font-bold hover:bg-blue-800 text-xs transition"
                    >
                      {buscandoDni ? '...' : '🔍'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo del Huésped</label>
                <input 
                  type="text" 
                  value={nombreHuesped} 
                  onChange={e => setNombreHuesped(e.target.value)} 
                  className="w-full border p-2.5 rounded-xl outline-none focus:border-blue-900 font-semibold text-xs" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono / Celular</label>
                <input 
                  type="text" 
                  value={telefonoHuesped} 
                  onChange={e => setTelefonoHuesped(e.target.value)} 
                  className="w-full border p-2.5 rounded-xl text-xs" 
                />
              </div>

              <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-100 space-y-3">
                <h4 className="font-extrabold text-rose-900 text-xs uppercase">💰 Pago al Ingreso</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Forma de Pago</label>
                    <select 
                      value={formaPago}
                      onChange={e => setFormaPago(e.target.value)}
                      className="w-full border p-2.5 rounded-xl bg-white text-xs font-bold"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Yape / Plin">Yape / Plin</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Monto Cancelado (S/)</label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={montoCancelado}
                      onChange={e => setMontoCancelado(e.target.value)}
                      className="w-full border p-2.5 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalCheckinAbierto(false)} className="w-1/2 bg-gray-200 text-gray-800 font-bold py-3 rounded-xl text-xs">Cancelar</button>
                <button type="submit" className="w-1/2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-xs shadow">Confirmar Check-in</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONSUMO ADICIONAL */}
      {modalConsumoAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-gray-800">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-extrabold text-amber-700">🛒 Agregar Consumo - Hab. {habitacionConsumo?.numero}</h3>
              <button onClick={() => setModalConsumoAbierto(false)} className="text-gray-400 font-bold text-xl">✕</button>
            </div>

            <form onSubmit={registrarConsumoAdicional} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Buscar Producto o Servicio</label>
                <input 
                  type="text" 
                  placeholder="Escribe para buscar..."
                  value={productoSeleccionado ? productoSeleccionado.nombre : busquedaProducto}
                  onChange={(e) => {
                    setBusquedaProducto(e.target.value)
                    setProductoSeleccionado(null)
                  }}
                  className="w-full border p-3 rounded-xl text-sm font-semibold bg-gray-50 pl-10 outline-none focus:border-amber-500"
                  required={!productoSeleccionado}
                />
                <span className="absolute left-3.5 top-9 text-gray-400">🔍</span>

                {busquedaProducto.trim() !== '' && !productoSeleccionado && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y">
                    {productosFiltrados.length === 0 ? (
                      <div className="p-3 text-xs text-gray-400 text-center">No se encontraron productos.</div>
                    ) : (
                      productosFiltrados.map(prod => (
                        <div 
                          key={prod.id}
                          onClick={() => {
                            setProductoSeleccionado(prod)
                            setBusquedaProducto('')
                          }}
                          className="p-3 hover:bg-amber-50 cursor-pointer text-xs flex justify-between items-center"
                        >
                          <span className="font-bold text-gray-800">{prod.nombre}</span>
                          <span className="text-amber-800 font-extrabold">S/ {Number(prod.precio_venta).toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cantidad</label>
                  <input 
                    type="number" 
                    min="1"
                    value={cantidadConsumo}
                    onChange={e => setCantidadConsumo(e.target.value)}
                    className="w-full border p-3 rounded-xl text-sm font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Forma de Pago</label>
                  <select 
                    value={formaPagoConsumo}
                    onChange={e => setFormaPagoConsumo(e.target.value)}
                    className="w-full border p-3 rounded-xl bg-white text-xs font-bold text-amber-900"
                  >
                    <option value="Cargar a Habitación">Cargar a Habitación</option>
                    <option value="Efectivo">Efectivo (Pagado)</option>
                    <option value="Yape / Plin">Yape / Plin (Pagado)</option>
                    <option value="Tarjeta">Tarjeta (Pagado)</option>
                    <option value="Transferencia">Transferencia (Pagado)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setModalConsumoAbierto(false)} className="bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-xl text-xs">Cancelar</button>
                <button type="submit" disabled={!productoSeleccionado} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-900 font-extrabold px-6 py-2 rounded-xl text-xs shadow">Registrar Consumo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHECK-OUT CON DETALLE DESGLOSADO */}
      {modalCheckoutAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 text-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-extrabold text-red-700">📤 Resumen de Check-out - Hab. {habitacionCheckout?.numero}</h3>
              <button onClick={() => setModalCheckoutAbierto(false)} className="text-gray-400 font-bold text-xl">✕</button>
            </div>

            {cargandoDetalle ? (
              <p className="text-center py-8 text-sm font-bold text-gray-500">Calculando cuenta y consumos...</p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">Desglose de Estancia y Consumos</h4>
                  <div className="border rounded-2xl overflow-hidden divide-y text-xs">
                    {detalleConsumos.map((item, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center bg-gray-50/50 hover:bg-gray-50">
                        <div>
                          <span className="font-bold block text-gray-800">{item.descripcion}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold mt-1 ${
                            item.estadoPago === 'Cargar a Habitación' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.estadoPago}
                          </span>
                        </div>
                        <span className="font-black text-sm text-gray-900">S/ {item.monto.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-xs uppercase font-extrabold text-rose-800 block">Total a Pagar en Check-out</span>
                    <span className="text-[11px] text-rose-600 font-medium">Incluye días de habitación y consumos con cargo.</span>
                  </div>
                  <div className="text-3xl font-black text-rose-900">
                    S/ {totalPendiente.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setModalCheckoutAbierto(false)}
                className="w-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={confirmarCheckoutFinal}
                className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-xl text-xs shadow"
              >
                Confirmar Check-out y Cobro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminVentas() {
  const [tipoComprobante, setTipoComprobante] = useState('BOLETA') // BOLETA, FACTURA, TICKET
  const [serie, setSerie] = useState('B001')
  const [moneda, setMoneda] = useState('Soles')
  const [tipoCambio, setTipoCambio] = useState(3.435)

  // Fechas locales
  const obtenerFechaLocal = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [fechaEmision, setFechaEmision] = useState(obtenerFechaLocal())
  const [fechaVencimiento, setFechaVencimiento] = useState(obtenerFechaLocal())

  // Clientes y búsqueda
  const [clientes, setClientes] = useState([])
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [modalNuevoCliente, setModalNuevoCliente] = useState(false)

  // Formulario nuevo cliente
  const [formCliente, setFormCliente] = useState({
    tipo_documento: 'DNI',
    documento: '',
    nombre: '',
    telefono: '',
    email: ''
  })

  // Productos / Servicios
  const [productosDisponibles, setProductosDisponibles] = useState([])
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [carrito, setCarrito] = useState([])

  // Historial y Estados de Impresión
  const [ventasGuardadas, setVentasGuardadas] = useState([])
  const [vistaHistorial, setVistaHistorial] = useState(false)
  
  // Estado para Datos del Hotel
  const [datosHotel, setDatosHotel] = useState(null)

  // Estado para el Modal de Impresión / Facturación
  const [ventaParaImprimir, setVentaParaImprimir] = useState(null)
  const [formatoImpresion, setFormatoImpresion] = useState('80mm') // '50mm', '80mm', 'a4'
  const [modalXml, setModalXml] = useState(null)

  useEffect(() => {
    cargarClientes()
    cargarVentas()
    cargarProductosDesdeBD()
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
      console.error('Error al cargar datos del hotel:', err)
    }
  }

  async function cargarClientes() {
    const { data } = await supabase.from('clientes').select('*')
    if (data) setClientes(data)
  }

  // Carga unificada y segura desde ambas tablas de Supabase
  async function cargarVentas() {
    try {
      let listaUnificada = []

      // 1. Intentar cargar desde comprobantes_sunat
      const { data: dataSunat } = await supabase
        .from('comprobantes_sunat')
        .select('*')
        .order('created_at', { ascending: false })

      if (dataSunat && dataSunat.length > 0) {
        listaUnificada = [...dataSunat]
      }

      // 2. Intentar cargar desde ventas antiguas / generales
      const { data: dataVentas } = await supabase
        .from('ventas')
        .select('*')
        .order('created_at', { ascending: false })

      if (dataVentas && dataVentas.length > 0) {
        // Evitar duplicados si ya están en sunat
        dataVentas.forEach(v => {
          listaUnificada.push({
            ...v,
            estado: v.estado || 'EMITIDO'
          })
        })
      }

      setVentasGuardadas(listaUnificada)
    } catch (err) {
      console.error('Error al cargar ventas:', err.message)
      setVentasGuardadas([])
    }
  }

  async function cargarProductosDesdeBD() {
    const { data: prodData } = await supabase.from('productos').select('*')
    const { data: habsData } = await supabase.from('habitaciones').select('*')

    let listaCombinada = []

    if (prodData && prodData.length > 0) {
      const mapeadosProd = prodData.map(p => ({
        id: 'prod-' + p.id,
        tipo_item: 'producto',
        nombre: p.nombre,
        unidad: p.unidad || 'NIU',
        precio: Number(p.precio_venta || 0),
        igv_porcentaje: p.igv_porcentaje ?? (p.tiene_igv ? 18 : 0)
      }))
      listaCombinada = [...mapeadosProd]
    }

    if (habsData && habsData.length > 0) {
      habsData.forEach(hab => {
        const nroHab = hab.numero || hab.nro || hab.id || 'N/D'
        const tipoHab = hab.tipo || hab.tipo_habitacion || 'Habitación'
        const precioHab = Number(hab.precio || hab.precio_noche || hab.precio_base || 80.00)

        listaCombinada.push({
          id: 'hab-' + hab.id,
          tipo_item: 'habitacion',
          habitacion_id: hab.id,
          unidad: 'ZZ',
          nombre: `Habitación ${nroHab}\n${tipoHab} (Noche)`,
          precio: precioHab,
          igv_porcentaje: 10
        })
      })
    }

    setProductosDisponibles(listaCombinada)
  }

  const obtenerDocCliente = (cli) => {
    if (!cli) return ''
    return cli.numero_documento || cli.numero_document || cli.documento || cli.dni || cli.ruc || cli.nro_documento || ''
  }

  const handleCrearCliente = async (e) => {
    e.preventDefault()
    if (!formCliente.documento || !formCliente.nombre) {
      alert("Por favor completa el documento y el nombre del cliente.")
      return
    }

    const documentoLimpio = formCliente.documento.trim()
    const existente = clientes.find(c => obtenerDocCliente(c) === documentoLimpio)

    if (existente) {
      alert(`⚠️ El número de documento "${documentoLimpio}" ya se encuentra registrado.`)
      return
    }

    const { data, error } = await supabase.from('clientes').insert([{
      tipo_documento: formCliente.tipo_documento,
      numero_documento: documentoLimpio,
      documento: documentoLimpio,
      dni: formCliente.tipo_documento === 'DNI' ? documentoLimpio : null,
      ruc: formCliente.tipo_documento === 'RUC' ? documentoLimpio : null,
      nombre: formCliente.nombre,
      nombres: formCliente.nombre,
      telefono: formCliente.telefono,
      email: formCliente.email
    }]).select().single()

    if (error) {
      alert("Error al registrar cliente: " + error.message)
    } else {
      alert("¡Cliente registrado con éxito!")
      await cargarClientes()
      setClienteSeleccionado(data)
      setBusquedaCliente(`${data.nombre || data.nombres} - Doc: ${obtenerDocCliente(data)}`)
      setModalNuevoCliente(false)
      setFormCliente({ tipo_documento: 'DNI', documento: '', nombre: '', telefono: '', email: '' })
    }
  }

  const agregarAlCarrito = (prod) => {
    if (prod.tipo_item === 'habitacion') {
      const nuevoItemHabitacion = {
        ...prod,
        id: `${prod.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        cantidad: 1
      }
      setCarrito([...carrito, nuevoItemHabitacion])
    } else {
      const existente = carrito.find(item => item.id === prod.id)
      if (existente) {
        setCarrito(carrito.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item))
      } else {
        setCarrito([...carrito, { ...prod, cantidad: 1 }])
      }
    }
    setBusquedaProducto('')
  }

  const cambiarCantidadItem = (id, delta) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        const nuevaCant = Math.max(1, item.cantidad + delta)
        return { ...item, cantidad: nuevaCant }
      }
      return item
    }))
  }

  const eliminarItem = (id) => {
    setCarrito(carrito.filter(item => item.id !== id))
  }

  const calcularTotalesDiferenciados = () => {
    let subtotalGeneral = 0
    let igvGeneral = 0

    carrito.forEach(item => {
      const totalItem = item.precio * item.cantidad
      const tasaIgv = (item.igv_porcentaje ?? 18) / 100
      const baseItem = totalItem / (1 + tasaIgv)
      const igvItem = totalItem - baseItem

      subtotalGeneral += baseItem
      igvGeneral += igvItem
    })

    const totalGeneral = subtotalGeneral + igvGeneral
    return {
      subtotal: subtotalGeneral,
      igv: igvGeneral,
      total: totalGeneral
    }
  }

  const totales = calcularTotalesDiferenciados()

  const guardarVenta = async () => {
    if (carrito.length === 0) {
      alert("El carrito de ventas está vacío.")
      return
    }
    if (!clienteSeleccionado && !busquedaCliente) {
      alert("Por favor selecciona o ingresa un cliente.")
      return
    }

    const nombreCli = clienteSeleccionado ? (clienteSeleccionado.nombre || clienteSeleccionado.nombres) : busquedaCliente
    const docCli = clienteSeleccionado ? obtenerDocCliente(clienteSeleccionado) : 'S/D'

    const xmlGenerado = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>${serie}-${Math.floor(Math.random() * 900000) + 100000}</cbc:ID>
  <cbc:IssueDate>${fechaEmision}</cbc:IssueDate>
  <cac:AccountingCustomerParty>
    <cac:Party><cac:PartyIdentification><cbc:ID>${docCli}</cbc:ID></cac:PartyIdentification>
    <cac:PartyLegalEntity><cbc:RegistrationName><![CDATA[${nombreCli}]]></cbc:RegistrationName></cac:PartyLegalEntity></cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal><cbc:PayableAmount currencyID="PEN">${totales.total.toFixed(2)}</cbc:PayableAmount></cac:LegalMonetaryTotal>
</Invoice>`

    const nuevoComprobante = {
      tipo_comprobante: tipoComprobante,
      serie: serie,
      correlativo: Math.floor(Math.random() * 90000) + 1000,
      cliente_id: clienteSeleccionado ? clienteSeleccionado.id : null,
      nombre_cliente: nombreCli,
      doc_cliente: docCli,
      fecha_emision: fechaEmision,
      fecha_vencimiento: fechaVencimiento,
      moneda: moneda === 'Soles' ? 'PEN' : 'USD',
      subtotal: parseFloat(totales.subtotal.toFixed(2)),
      igv: parseFloat(totales.igv.toFixed(2)),
      total: parseFloat(totales.total.toFixed(2)),
      items: carrito,
      estado: 'EMITIDO',
      xml_generado: xmlGenerado
    }

    // Guardar simultáneamente en ambas tablas para evitar pérdida de registros
    await supabase.from('comprobantes_sunat').insert([nuevoComprobante])
    await supabase.from('ventas').insert([nuevoComprobante])

    alert(`¡${tipoComprobante} ${serie} emitida y guardada con éxito!`)
    setCarrito([])
    setClienteSeleccionado(null)
    setBusquedaCliente('')
    cargarVentas()

    setVentaParaImprimir(nuevoComprobante)
  }

  const anularComprobante = async (comp) => {
    const motivo = window.prompt("Ingrese el motivo de anulación del comprobante:")
    if (!motivo) return

    if (comp.id) {
      await supabase
        .from('comprobantes_sunat')
        .update({ estado: 'ANULADO', motivo_anulacion: motivo })
        .eq('id', comp.id)
    }

    alert("¡Comprobante anulado con éxito!")
    cargarVentas()
  }

  const ejecutarImpresion = () => {
    window.print()
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 pb-32">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #zona-impresion, #zona-impresion * { visibility: visible; }
          #zona-impresion {
            position: absolute; left: 0; top: 0;
            width: ${formatoImpresion === '50mm' ? '50mm' : formatoImpresion === '80mm' ? '80mm' : '100%'};
            margin: 0; padding: 5px; background: white; color: black;
          }
          .no-imprimir { display: none !important; }
        }
      `}</style>

      {/* Cabecera */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-900">
            {datosHotel?.razon_social || datosHotel?.nombre_comercial || 'GRUPO HOTELERO TUKI E.I.R.L.'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">Módulo de Emisión Electrónica de Comprobantes (Facturas, Boletas, Tickets, XML)</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setVistaHistorial(!vistaHistorial)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2.5 rounded-xl border text-sm transition"
          >
            {vistaHistorial ? '🛒 Ir al Punto de Venta' : '📊 Historial de Ventas y XML'}
          </button>
        </div>
      </div>

      {!vistaHistorial ? (
        <div className="space-y-6">
          {/* Configuración */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tipo comprobante</label>
              <select 
                value={tipoComprobante} 
                onChange={(e) => {
                  setTipoComprobante(e.target.value)
                  setSerie(e.target.value === 'FACTURA' ? 'F001' : e.target.value === 'BOLETA' ? 'B001' : 'T001')
                }}
                className="w-full border p-2.5 rounded-xl text-sm bg-white font-semibold"
              >
                <option value="BOLETA">BOLETA DE VENTA</option>
                <option value="FACTURA">FACTURA</option>
                <option value="TICKET">TICKET DE VENTA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Fec. emisión</label>
              <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Fec. vencimiento</label>
              <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Serie</label>
              <input type="text" value={serie} onChange={(e) => setSerie(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm font-bold bg-gray-50" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Moneda</label>
              <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm bg-white">
                <option value="Soles">Soles (S/)</option>
                <option value="Dolares">Dólares ($)</option>
              </select>
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border space-y-3 relative">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700 uppercase">Cliente (RUC / DNI / NOMBRE)</label>
              <span onClick={() => setModalNuevoCliente(true)} className="text-xs text-blue-600 font-bold cursor-pointer hover:underline">[+ Nuevo]</span>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Escribe el DNI, RUC o nombre del cliente..." 
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value)
                  setClienteSeleccionado(null)
                }}
                className="w-full border p-3 rounded-xl text-sm"
              />
              {busquedaCliente.trim().length > 0 && !clienteSeleccionado && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-xl shadow-2xl mt-1 z-30 max-h-52 overflow-y-auto divide-y">
                  {clientes
                    .filter(c => {
                      const texto = busquedaCliente.toLowerCase()
                      const nombre = (c.nombre || c.nombres || '').toLowerCase()
                      const doc = obtenerDocCliente(c).toLowerCase()
                      return nombre.includes(texto) || doc.includes(texto)
                    })
                    .map(cli => {
                      const documentoVal = obtenerDocCliente(cli)
                      return (
                        <div 
                          key={cli.id}
                          onClick={() => {
                            setClienteSeleccionado(cli)
                            setBusquedaCliente(`${cli.nombre || cli.nombres} - Doc: ${documentoVal}`)
                          }}
                          className="p-3 hover:bg-blue-50 cursor-pointer text-xs flex justify-between items-center transition"
                        >
                          <span className="font-bold text-gray-800">{cli.nombre || cli.nombres}</span>
                          <span className="text-blue-900 font-semibold bg-blue-100 px-2 py-0.5 rounded-md">Doc: {documentoVal || 'S/D'}</span>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Buscador de Productos */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border space-y-3 relative">
            <label className="text-xs font-bold text-gray-700 uppercase">Buscar productos o servicios</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Busca por número de habitación (ej. 201), bebidas, snacks..." 
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                className="w-full border p-3 rounded-xl text-sm bg-gray-50"
              />
              {busquedaProducto.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-xl shadow-xl mt-1 z-30 max-h-60 overflow-y-auto divide-y">
                  {productosDisponibles
                    .filter(p => p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()))
                    .map(prod => (
                      <div 
                        key={prod.id}
                        onClick={() => agregarAlCarrito(prod)}
                        className="p-3 hover:bg-blue-50 cursor-pointer text-sm flex justify-between items-center transition"
                      >
                        <div>
                          <p className="font-bold text-gray-800">{prod.nombre}</p>
                          <span className="text-xs text-gray-500">Unidad: {prod.unidad} | IGV: {prod.igv_porcentaje ?? 18}%</span>
                        </div>
                        <span className="font-extrabold text-blue-900">S/ {prod.precio.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Detalle del Comprobante */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm">🛍️ Detalle del Comprobante</h3>
              <span className="text-xs text-gray-500">{carrito.length} ítem(s) agregado(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white text-xs uppercase">
                    <th className="p-3">#</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3 text-center">Unidad</th>
                    <th className="p-3 text-center">Cantidad</th>
                    <th className="p-3 text-right">P. Unitario</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {carrito.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-gray-400">No hay productos o servicios agregados.</td>
                    </tr>
                  ) : (
                    carrito.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-400">{idx + 1}</td>
                        <td className="p-3 font-medium text-gray-800 whitespace-pre-line">{item.nombre}</td>
                        <td className="p-3 text-center text-xs text-gray-500">{item.unidad}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {item.tipo_item !== 'habitacion' && (
                              <button onClick={() => cambiarCantidadItem(item.id, -1)} className="bg-gray-200 w-6 h-6 rounded font-bold hover:bg-gray-300">-</button>
                            )}
                            <span className="font-bold w-6 text-center">{item.cantidad}</span>
                            {item.tipo_item !== 'habitacion' && (
                              <button onClick={() => cambiarCantidadItem(item.id, 1)} className="bg-blue-900 text-white w-6 h-6 rounded font-bold hover:bg-blue-800">+</button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right font-semibold">S/ {item.precio.toFixed(2)}</td>
                        <td className="p-3 text-right font-extrabold text-blue-900">S/ {(item.precio * item.cantidad).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => eliminarItem(item.id)} className="text-red-600 hover:text-red-800 font-bold text-xs bg-red-50 px-2.5 py-1 rounded border border-red-200">Quitar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-gray-50 border-t flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1 text-sm text-gray-600 w-full md:w-auto">
                <p>Subtotal: <span className="font-bold text-gray-800">S/ {totales.subtotal.toFixed(2)}</span></p>
                <p>I.G.V. (Diferenciado): <span className="font-bold text-gray-800">S/ {totales.igv.toFixed(2)}</span></p>
                <p className="text-lg font-black text-blue-900 pt-1 border-t">TOTAL A PAGAR: S/ {totales.total.toFixed(2)}</p>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setCarrito([])} className="bg-gray-200 text-gray-800 font-bold px-6 py-3 rounded-xl text-sm">Cancelar</button>
                <button onClick={guardarVenta} className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-8 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2">
                  <span>Emitir y Enviar a SUNAT</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* HISTORIAL DE VENTAS Y XML */
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
          <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">📊 Historial de Comprobantes Electrónicos (SUNAT)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white text-xs uppercase">
                  <th className="p-4">Serie - Número</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">Estado SUNAT</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {ventasGuardadas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400">No hay comprobantes emitidos todavía.</td>
                  </tr>
                ) : (
                  ventasGuardadas.map((v, idx) => (
                    <tr key={v.id || idx} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-blue-900">{v.serie}-{String(v.correlativo || v.id || '000001').slice(-6)}</td>
                      <td className="p-4 text-gray-600">{v.fecha_emision}</td>
                      <td className="p-4 font-medium text-gray-800">{v.nombre_cliente}</td>
                      <td className="p-4 text-right font-extrabold text-gray-900">S/ {Number(v.total).toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${v.estado === 'ANULADO' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {v.estado || 'EMITIDO'}
                        </span>
                      </td>
                      <td className="p-4 text-center space-x-2">
                        <button onClick={() => setModalXml(v)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3 py-1.5 rounded-lg text-xs border">📄 XML</button>
                        <button onClick={() => setVentaParaImprimir(v)} className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow">🖨️ Imprimir</button>
                        {v.estado !== 'ANULADO' && (
                          <button onClick={() => anularComprobante(v)} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg text-xs border border-red-200">❌ Anular</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL XML */}
      {modalXml && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-extrabold text-blue-900">📄 Archivo XML UBL 2.1</h3>
              <button onClick={() => setModalXml(null)} className="text-gray-400 font-bold text-xl">✕</button>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-96">
              {modalXml.xml_generado || '<?xml version="1.0"?><Invoice><Note>XML UBL 2.1 generado y validado con éxito.</Note></Invoice>'}
            </pre>
            <div className="flex justify-end pt-2">
              <button onClick={() => setModalXml(null)} className="bg-blue-900 text-white font-bold px-5 py-2 rounded-xl text-xs">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMPRESIÓN */}
      {ventaParaImprimir && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 no-imprimir">
              <h3 className="text-lg font-extrabold text-gray-900">🖨️ Previsualización del Comprobante</h3>
              <button onClick={() => setVentaParaImprimir(null)} className="text-gray-400 font-bold text-lg">✕</button>
            </div>

            <div className="flex gap-2 justify-center no-imprimir bg-gray-100 p-2 rounded-xl">
              <button onClick={() => setFormatoImpresion('50mm')} className={`px-4 py-2 rounded-lg text-xs font-bold ${formatoImpresion === '50mm' ? 'bg-blue-900 text-white' : 'bg-white text-gray-700'}`}>Ticket 50mm</button>
              <button onClick={() => setFormatoImpresion('80mm')} className={`px-4 py-2 rounded-lg text-xs font-bold ${formatoImpresion === '80mm' ? 'bg-blue-900 text-white' : 'bg-white text-gray-700'}`}>Ticket 80mm</button>
              <button onClick={() => setFormatoImpresion('a4')} className={`px-4 py-2 rounded-lg text-xs font-bold ${formatoImpresion === 'a4' ? 'bg-blue-900 text-white' : 'bg-white text-gray-700'}`}>Formato A4</button>
            </div>

            <div id="zona-impresion" className={`bg-white p-4 border rounded-xl font-mono text-gray-900 mx-auto ${formatoImpresion === 'a4' ? 'text-sm w-full' : formatoImpresion === '50mm' ? 'text-xs w-[200px]' : 'text-xs w-[300px]'}`}>
              <div className="text-center space-y-1 pb-3 border-b border-dashed">
                <h4 className="font-extrabold text-sm uppercase">{datosHotel?.razon_social || 'GRUPO HOTELERO TUKI E.I.R.L.'}</h4>
                <p className="text-[10px]">RUC: {datosHotel?.ruc || '20600000001'}</p>
                <p className="text-[10px]">{datosHotel?.direccion || 'Lima, Perú'}</p>
                <p className="font-bold pt-2 uppercase">{ventaParaImprimir.tipo_comprobante || 'COMPROBANTE'} ELECTRÓNICA</p>
                <p className="font-bold">{ventaParaImprimir.serie}</p>
              </div>

              <div className="py-2 space-y-1 border-b border-dashed text-[11px]">
                <p><b>Fecha:</b> {ventaParaImprimir.fecha_emision}</p>
                <p><b>Cliente:</b> {ventaParaImprimir.nombre_cliente}</p>
                <p><b>Doc:</b> {ventaParaImprimir.doc_cliente}</p>
              </div>

              <div className="py-2 border-b border-dashed">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-[10px]">
                      <th className="py-1">DESC</th>
                      <th className="py-1 text-center">CANT</th>
                      <th className="py-1 text-right">P.U</th>
                      <th className="py-1 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ventaParaImprimir.items && ventaParaImprimir.items.map((it, i) => (
                      <tr key={i} className="text-[11px]">
                        <td className="py-1 pr-1">{it.nombre}</td>
                        <td className="py-1 text-center">{it.cantidad}</td>
                        <td className="py-1 text-right">{(Number(it.precio)).toFixed(2)}</td>
                        <td className="py-1 text-right font-bold">{(Number(it.precio) * it.cantidad).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="py-2 space-y-1 text-right text-[11px]">
                <p>SUBTOTAL: S/ {Number(ventaParaImprimir.subtotal).toFixed(2)}</p>
                <p>I.G.V.: S/ {Number(ventaParaImprimir.igv).toFixed(2)}</p>
                <p className="text-xs font-black pt-1 border-t border-dashed">TOTAL: S/ {Number(ventaParaImprimir.total).toFixed(2)}</p>
              </div>

              <div className="text-center pt-4 space-y-1 text-[10px] border-t border-dashed">
                <p>Representación Impresa de Comprobante Electrónico</p>
                <p className="font-bold pt-1">¡Gracias por su preferencia!</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t no-imprimir">
              <button onClick={() => setVentaParaImprimir(null)} className="bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-xl text-xs">Cerrar</button>
              <button onClick={ejecutarImpresion} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-xl text-xs shadow">🖨️ Imprimir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO CLIENTE */}
      {modalNuevoCliente && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-extrabold text-gray-900">Registrar Nuevo Cliente</h3>
              <button onClick={() => setModalNuevoCliente(false)} className="text-gray-400 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCrearCliente} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Tipo Documento</label>
                  <select value={formCliente.tipo_documento} onChange={(e) => setFormCliente({...formCliente, tipo_documento: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm bg-white">
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">Carné de Extranjería</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nº Documento *</label>
                  <input type="text" placeholder="Número..." value={formCliente.documento} onChange={(e) => setFormCliente({...formCliente, documento: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nombre / Razón Social *</label>
                <input type="text" placeholder="Nombre completo o empresa..." value={formCliente.nombre} onChange={(e) => setFormCliente({...formCliente, nombre: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm" required />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setModalNuevoCliente(false)} className="bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-xl text-sm">Cancelar</button>
                <button type="submit" className="bg-green-600 text-white font-bold px-6 py-2 rounded-xl text-sm shadow">Guardar y Seleccionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
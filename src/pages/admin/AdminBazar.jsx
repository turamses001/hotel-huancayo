import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminBazar() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalNuevo, setModalNuevo] = useState(false)

  // Estado para el Modal de Análisis de Inventario y Costos
  const [modalInventario, setModalInventario] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [historialCompras, setHistorialCompras] = useState([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  
  // Formulario para reabastecer stock y costos
  const [cantidadIngreso, setCantidadIngreso] = useState('')
  const [costoUnitarioIngreso, setCostoUnitarioIngreso] = useState('')

  // Formulario de Nuevo Producto
  const [formData, setFormData] = useState({
    unidad: 'NIU',
    nombre: '',
    stock: 20,
    precio_venta: '',
    costo_unitario: '',
    igv_porcentaje: 18
  })

  useEffect(() => {
    cargarProductosYHabitaciones()
  }, [])

  async function cargarProductosYHabitaciones() {
    setCargando(true)
    
    const { data: prodData, error: prodError } = await supabase.from('productos').select('*').order('created_at', { ascending: false })
    const { data: habsData } = await supabase.from('habitaciones').select('*')

    let listaCombinada = []

    if (prodData && prodData.length > 0) {
      prodData.forEach(p => {
        listaCombinada.push({
          ...p,
          igv_porcentaje: p.igv_porcentaje !== undefined ? p.igv_porcentaje : (p.tiene_igv ? 18 : 0),
          costo_unitario: Number(p.costo_unitario || 0)
        })
      })
    }

    if (habsData && habsData.length > 0) {
      habsData.forEach(hab => {
        const nroHab = hab.numero || hab.nro || hab.id || 'N/D'
        const tipoHab = hab.tipo || hab.tipo_habitacion || 'Habitación'
        const precioHab = Number(hab.precio || hab.precio_noche || hab.precio_base || 80.00)

        listaCombinada.push({
          id: 'hab-fisica-' + hab.id,
          unidad: 'ZZ',
          nombre: `Habitación ${nroHab}\n${tipoHab} (Noche)`,
          stock: 1,
          precio_venta: precioHab,
          costo_unitario: 0,
          igv_porcentaje: 10,
          es_habitacion_fisica: true
        })
      })
    }

    setProductos(listaCombinada)
    if (prodError) {
      console.log('Error cargando productos:', prodError.message)
    }
    setCargando(false)
  }

  const abrirAnalisisInventario = async (prod) => {
    if (prod.es_habitacion_fisica) {
      alert("Las habitaciones físicas son servicios de alojamiento y no manejan inventario de almacén.")
      return
    }

    setProductoSeleccionado(prod)
    setModalInventario(true)
    setCantidadIngreso('')
    setCostoUnitarioIngreso(prod.costo_unitario || '')
    setCargandoHistorial(true)

    // Cargar historial de compras desde la tabla dedicada
    try {
      const { data, error } = await supabase
        .from('historial_compras')
        .select('*')
        .eq('producto_id', prod.id)
        .order('created_at', { ascending: false })

      if (error) {
        setHistorialCompras([])
      } else {
        setHistorialCompras(data || [])
      }
    } catch {
      setHistorialCompras([])
    } finally {
      setCargandoHistorial(false)
    }
  }

  // Registrar compra / ingreso de mercadería
  const registrarIngresoStock = async (e) => {
    e.preventDefault()
    const cant = parseInt(cantidadIngreso)
    const costo = parseFloat(costoUnitarioIngreso)

    if (!cant || cant <= 0 || isNaN(costo) || costo < 0) {
      alert("Por favor ingresa una cantidad y un costo unitario válidos.")
      return
    }

    const nuevoStockTotal = (productoSeleccionado.stock || 0) + cant

    // 1. Insertar registro en la tabla de historial_compras
    const { error: errorHistorial } = await supabase.from('historial_compras').insert([{
      producto_id: productoSeleccionado.id,
      cantidad: cant,
      costo_unitario: costo,
      total: cant * costo
    }])

    if (errorHistorial) {
      alert("Error al registrar el historial: " + errorHistorial.message)
      return
    }

    // 2. Actualizar el stock total y el último costo unitario en la tabla productos
    const { error: errorUpdate } = await supabase
      .from('productos')
      .update({ 
        stock: nuevoStockTotal,
        costo_unitario: costo
      })
      .eq('id', productoSeleccionado.id)

    if (errorUpdate) {
      alert("Error al actualizar stock del producto: " + errorUpdate.message)
      return
    }

    alert(`¡Abastecimiento registrado con éxito!\nNuevo Stock: ${nuevoStockTotal} | Costo Unitario: S/ ${costo.toFixed(2)}`)
    setCantidadIngreso('')
    setModalInventario(false)
    cargarProductosYHabitaciones()
  }

  const cambiarIgvProducto = async (id, nuevoIgv) => {
    if (String(id).startsWith('hab-fisica-')) {
      setProductos(productos.map(p => p.id === id ? { ...p, igv_porcentaje: Number(nuevoIgv) } : p))
      return
    }

    const { error } = await supabase
      .from('productos')
      .update({ igv_porcentaje: Number(nuevoIgv) })
      .eq('id', id)

    if (error) {
      alert("Error al actualizar el IGV: " + error.message)
    } else {
      setProductos(productos.map(p => p.id === id ? { ...p, igv_porcentaje: Number(nuevoIgv) } : p))
    }
  }

  const handleCrearProducto = async (e) => {
    e.preventDefault()
    if (!formData.nombre || !formData.precio_venta) {
      alert("Por favor completa los campos obligatorios (Nombre y Precio Venta).")
      return
    }

    const { error } = await supabase.from('productos').insert([{
      unidad: formData.unidad,
      nombre: formData.nombre,
      stock: parseInt(formData.stock) || 0,
      precio_venta: parseFloat(formData.precio_venta),
      costo_unitario: parseFloat(formData.costo_unitario) || 0,
      igv_porcentaje: Number(formData.igv_porcentaje),
      tiene_igv: Number(formData.igv_porcentaje) > 0,
      activo: true
    }])

    if (error) {
      alert("Error al registrar el producto o servicio: " + error.message)
    } else {
      alert("¡Producto o servicio registrado con éxito!")
      setModalNuevo(false)
      setFormData({
        unidad: 'NIU',
        nombre: '',
        stock: 20,
        precio_venta: '',
        costo_unitario: '',
        igv_porcentaje: 18
      })
      cargarProductosYHabitaciones()
    }
  }

  const productosFiltrados = productos.filter(p => {
    if (!busqueda) return true
    return p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  })

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📦</span>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">PRODUCTOS Y SERVICIOS</h2>
            <p className="text-xs text-gray-500 mt-0.5">Control de inventario, costos, precios de venta y tributación con IGV diferenciado.</p>
          </div>
        </div>

        <button 
          onClick={() => setModalNuevo(true)}
          className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-5 py-2 rounded-xl shadow-lg transition text-sm flex items-center gap-1.5"
        >
          <span>+ Nuevo Producto / Servicio</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border mb-6 space-y-4">
        <h3 className="font-bold text-gray-800 text-sm">Listado General y Control de Almacén</h3>
        <div className="flex-1 w-full relative">
          <input 
            type="text" 
            placeholder="Buscar por número de habitación, nombre de producto o servicio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border p-3 rounded-xl text-sm bg-gray-50 pl-10"
          />
          <span className="absolute left-3.5 top-3.5 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-xs uppercase font-bold border-b">
                <th className="p-4 w-12">#</th>
                <th className="p-4">Nombre / Descripción</th>
                <th className="p-4 text-center">Unidad</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 text-right">Costo Unit.</th>
                <th className="p-4 text-right">Precio Venta</th>
                <th className="p-4 text-center">Tasa IGV</th>
                <th className="p-4 text-center">Inventario</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {cargando ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-400 font-semibold">Cargando inventario...</td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-400">No se encontraron registros.</td>
                </tr>
              ) : (
                productosFiltrados.map((prod, idx) => (
                  <tr key={prod.id} className="hover:bg-gray-50 text-gray-700">
                    <td className="p-4 font-bold text-gray-400">{idx + 1}</td>
                    <td className="p-4 font-bold text-gray-900 whitespace-pre-line">
                      {prod.nombre} 
                      {prod.es_habitacion_fisica && (
                        <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Habitación Física
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center text-xs font-semibold text-gray-500">{prod.unidad}</td>
                    <td className="p-4 text-center font-bold">
                      <span className={`px-2.5 py-1 rounded-full text-xs ${prod.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {prod.stock}
                      </span>
                    </td>
                    <td className="p-4 text-right text-gray-600 font-medium">
                      {prod.es_habitacion_fisica ? '—' : `S/ ${Number(prod.costo_unitario || 0).toFixed(2)}`}
                    </td>
                    <td className="p-4 text-right font-extrabold text-blue-900">S/ {Number(prod.precio_venta).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <select 
                        value={prod.igv_porcentaje ?? 18}
                        onChange={(e) => cambiarIgvProducto(prod.id, e.target.value)}
                        className={`text-xs font-extrabold px-2.5 py-1.5 rounded-lg border shadow-sm ${
                          Number(prod.igv_porcentaje) === 10 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          Number(prod.igv_porcentaje) === 18 ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        <option value="18">18% (General)</option>
                        <option value="10">10% (Hoteles)</option>
                        <option value="0">0% (Exonerado)</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      {!prod.es_habitacion_fisica ? (
                        <button 
                          onClick={() => abrirAnalisisInventario(prod)}
                          title="Análisis de Inventario y Costos"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow transition flex items-center gap-1 mx-auto"
                        >
                          <span>📊 Análisis</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ANÁLISIS DE INVENTARIO Y COSTOS */}
      {modalInventario && productoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-indigo-900">📊 Análisis de Inventario y Costos</h3>
                <p className="text-xs text-gray-500 font-semibold">{productoSeleccionado.nombre}</p>
              </div>
              <button onClick={() => setModalInventario(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-center">
                <span className="text-[11px] font-extrabold text-blue-800 uppercase block">Stock Actual</span>
                <span className="text-2xl font-black text-blue-900">{productoSeleccionado.stock} un.</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-center">
                <span className="text-[11px] font-extrabold text-indigo-800 uppercase block">Costo Unitario</span>
                <span className="text-2xl font-black text-indigo-900">S/ {Number(productoSeleccionado.costo_unitario || 0).toFixed(2)}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center">
                <span className="text-[11px] font-extrabold text-emerald-800 uppercase block">Precio Venta</span>
                <span className="text-2xl font-black text-emerald-900">S/ {Number(productoSeleccionado.precio_venta).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-gray-50 border p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-gray-700">➕ Registrar Abastecimiento (Nuevo Lote / Compra)</h4>
              <form onSubmit={registrarIngresoStock} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Cantidad a Agregar</label>
                  <input 
                    type="number"
                    min="1"
                    placeholder="Ej. 50"
                    value={cantidadIngreso}
                    onChange={(e) => setCantidadIngreso(e.target.value)}
                    className="w-full border p-2.5 rounded-xl text-xs font-bold bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Costo Unitario (S/)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={costoUnitarioIngreso}
                    onChange={(e) => setCostoUnitarioIngreso(e.target.value)}
                    className="w-full border p-2.5 rounded-xl text-xs font-bold bg-white"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow transition"
                  >
                    Guardar Ingreso
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase text-gray-600">🕒 Historial de Compras y Lotes</h4>
              {cargandoHistorial ? (
                <p className="text-center py-4 text-xs text-gray-400 font-bold">Cargando historial...</p>
              ) : historialCompras.length === 0 ? (
                <p className="text-center py-6 text-xs text-gray-400 border rounded-xl bg-gray-50/50">No hay registros de compras anteriores para este producto.</p>
              ) : (
                <div className="border rounded-2xl overflow-hidden divide-y text-xs max-h-44 overflow-y-auto">
                  {historialCompras.map((mov, i) => (
                    <div key={i} className="p-3 flex justify-between items-center bg-white">
                      <div>
                        <span className="font-bold text-gray-800 block">Compra de lote ({mov.cantidad} unidades)</span>
                        <span className="text-[10px] text-gray-400">{new Date(mov.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-indigo-900 block">+{mov.cantidad} un. (S/ {Number(mov.costo_unitario).toFixed(2)} c/u)</span>
                        <span className="text-[11px] text-gray-500 font-medium">Total: S/ {Number(mov.total).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button 
                type="button" 
                onClick={() => setModalInventario(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-5 py-2.5 rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PRODUCTO / SERVICIO */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-extrabold text-gray-900">Registrar Nuevo Producto o Servicio</h3>
              <button onClick={() => setModalNuevo(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCrearProducto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Unidad</label>
                <select 
                  value={formData.unidad}
                  onChange={(e) => setFormData({...formData, unidad: e.target.value})}
                  className="w-full border p-2.5 rounded-xl text-sm bg-white"
                >
                  <option value="NIU">NIU (Unidad)</option>
                  <option value="ZZ">ZZ (Servicio)</option>
                  <option value="LTR">LTR (Litros)</option>
                  <option value="KGM">KGM (Kilogramos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nombre o Descripción *</label>
                <input 
                  type="text" 
                  placeholder="Ej. Cerveza Cusqueña 330ml"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full border p-2.5 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Stock Inicial</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Costo Unit. (S/)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.costo_unitario}
                    onChange={(e) => setFormData({...formData, costo_unitario: e.target.value})}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Precio Venta *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.precio_venta}
                    onChange={(e) => setFormData({...formData, precio_venta: e.target.value})}
                    className="w-full border p-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Porcentaje de IGV Aplicable *</label>
                <select 
                  value={formData.igv_porcentaje}
                  onChange={(e) => setFormData({...formData, igv_porcentaje: Number(e.target.value)})}
                  className="w-full border p-2.5 rounded-xl text-sm bg-white font-bold text-blue-900"
                >
                  <option value="18">18% (Tasa General)</option>
                  <option value="10">10% (Tasa Reducida - Hoteles/Restaurantes)</option>
                  <option value="0">0% (Exonerado / Inafecto)</option>
                </select>
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
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
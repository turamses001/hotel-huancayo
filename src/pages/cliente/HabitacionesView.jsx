import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function HabitacionesView() {
  const [tiposHabitacion, setTiposHabitacion] = useState([])
  const [cantidades, setCantidades] = useState({})
  const [cargando, setCargando] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [indicesFotos, setIndicesFotos] = useState({})

  const obtenerFechaLocal = (diasOffset = 0) => {
    const d = new Date()
    d.setDate(d.getDate() + diasOffset)
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
  }

  const hoyStr = obtenerFechaLocal(0)
  const llegada = searchParams.get('llegada') || hoyStr
  const salida = searchParams.get('salida') || obtenerFechaLocal(1)

  useEffect(() => {
    async function calcularDisponibilidadConRecepcion() {
      setCargando(true)

      const { data: tiposData } = await supabase.from('tipos_habitacion').select('*')
      const { data: habsData } = await supabase.from('habitaciones').select('*')
      const { data: reservasData } = await supabase.from('reservas').select('*').eq('estado', 'Confirmada')

      if (tiposData) {
        const listaProcesada = tiposData.map(tipo => {
          const fisicasTotales = habsData ? habsData.filter(h => h.tipo === tipo.nombre && h.estado !== 'Mantenimiento').length : 3

          let ocupadasRecepcionHoy = 0
          if (llegada === hoyStr && habsData) {
            ocupadasRecepcionHoy = habsData.filter(h => h.tipo === tipo.nombre && (h.estado === 'Ocupada' || h.estado === 'Ocupado' || h.estado === 'Limpieza')).length
          }

          let reservadasEnFechas = 0
          if (reservasData) {
            reservasData.forEach(res => {
              if (res.tipo_habitacion === tipo.nombre) {
                if (res.fecha_ingreso < salida && res.fecha_salida > llegada) {
                  reservadasEnFechas += (res.cantidad || 1)
                }
              }
            })
          }

          const stockLibre = Math.max(0, fisicasTotales - ocupadasRecepcionHoy - reservadasEnFechas)

          const fotosArray = [
            tipo.foto_url,
            tipo.foto_2,
            tipo.foto_3,
            tipo.foto_4,
            tipo.foto_5
          ].filter(url => url && url.trim() !== '')

          return {
            nombre: tipo.nombre,
            precio: tipo.precio_base,
            fotos: fotosArray.length > 0 ? fotosArray : ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"],
            caracteristicas: tipo.caracteristicas || [],
            stock: stockLibre
          }
        })

        setTiposHabitacion(listaProcesada)
      }
      setCargando(false)
    }
    calcularDisponibilidadConRecepcion()
  }, [llegada, salida, hoyStr])

  const cambiarFoto = (nombreHabitacion, totalFotos, direccion, e) => {
    e.stopPropagation()
    setIndicesFotos(prev => {
      const actual = prev[nombreHabitacion] || 0
      let nuevo = actual + direccion
      if (nuevo < 0) nuevo = totalFotos - 1
      if (nuevo >= totalFotos) nuevo = 0
      return { ...prev, [nombreHabitacion]: nuevo }
    })
  }

  const obtenerIconoCaracteristica = (carac) => {
    const c = carac.toLowerCase()
    if (c.includes('jacuzzi') || c.includes('hidromasaje')) return '🛁'
    if (c.includes('wi-fi') || c.includes('internet') || c.includes('wifi')) return '📶'
    if (c.includes('tv') || c.includes('smart')) return '📺'
    if (c.includes('cama') || c.includes('king') || c.includes('queen')) return '🛏️'
    if (c.includes('agua caliente') || c.includes('ducha')) return '🚿'
    if (c.includes('vista') || c.includes('calle')) return '🏙️'
    if (c.includes('desayuno')) return '☕'
    if (c.includes('ropero') || c.includes('mesa') || c.includes('butacas') || c.includes('alfombrado')) return '🛋️'
    return '✨'
  }

  const handleCambioFechas = (nuevoIngreso, nuevaSalida) => {
    setSearchParams({ llegada: nuevoIngreso, salida: nuevaSalida })
  }

  const handleCambioCantidad = (tipo, delta, maxStock) => {
    const actual = cantidades[tipo] || 0
    const nuevo = Math.max(0, Math.min(maxStock, actual + delta))
    setCantidades({ ...cantidades, [tipo]: nuevo })
  }

  const totalHabitacionesSeleccionadas = Object.values(cantidades).reduce((a, b) => a + b, 0)

  const handleIrAReserva = () => {
    if (totalHabitacionesSeleccionadas === 0) {
      alert("Por favor selecciona al menos una habitación para continuar.")
      return
    }
    const seleccionQuery = encodeURIComponent(JSON.stringify(cantidades))
    navigate(`/reserva-carrito?seleccion=${seleccionQuery}&llegada=${llegada}&salida=${salida}`)
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 pb-32">
      
      {/* CABECERA STICKY: Se queda pegada al hacer scroll */}
      <div className="sticky top-4 z-30 bg-white/90 backdrop-blur-md shadow-lg border border-gray-200/80 rounded-3xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
        <div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900">Nuestras Habitaciones y Suites</h3>
          <p className="text-xs md:text-sm text-gray-600 mt-0.5">Disponibilidad en tiempo real conectada con la recepción del hotel.</p>
        </div>
        
        {/* Selector de Fechas */}
        <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-2xl flex flex-wrap gap-4 items-center shadow-inner">
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Ingreso</label>
            <input 
              type="date" 
              min={hoyStr}
              value={llegada}
              onChange={(e) => {
                const nuevaIngreso = e.target.value
                let nuevaSalida = salida
                if (nuevaIngreso >= salida) {
                  const d = new Date(nuevaIngreso)
                  d.setDate(d.getDate() + 1)
                  nuevaSalida = d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
                }
                handleCambioFechas(nuevaIngreso, nuevaSalida)
              }}
              className="text-xs font-bold text-gray-800 bg-white p-2 rounded-xl border border-gray-200 outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Salida</label>
            <input 
              type="date" 
              min={llegada}
              value={salida}
              onChange={(e) => handleCambioFechas(llegada, e.target.value)}
              className="text-xs font-bold text-gray-800 bg-white p-2 rounded-xl border border-gray-200 outline-none shadow-sm"
            />
          </div>
        </div>
      </div>

      {cargando ? (
        <p className="text-center text-gray-500 text-xl font-bold py-12 animate-pulse">Sincronizando disponibilidad...</p>
      ) : (
        <div className="space-y-6">
          {tiposHabitacion.map((info) => {
            const cantidadElegida = cantidades[info.nombre] || 0
            const fotoIndex = indicesFotos[info.nombre] || 0
            const totalFotos = info.fotos.length

            return (
              <div 
                key={info.nombre} 
                className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row items-stretch hover:shadow-2xl transition"
              >
                {/* IZQUIERDA: Carrusel de Fotos */}
                <div className="w-full md:w-80 h-64 md:h-auto relative group bg-gray-900 shrink-0">
                  <img 
                    src={info.fotos[fotoIndex]} 
                    alt={info.nombre} 
                    className="w-full h-full object-cover transition-all duration-300" 
                  />
                  
                  <span className={`absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full uppercase shadow backdrop-blur-md z-10 ${info.stock > 0 ? 'bg-white/90 text-green-800' : 'bg-white/90 text-red-800'}`}>
                    {info.stock > 0 ? `${info.stock} disponibles` : 'Agotado'}
                  </span>

                  <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm z-10">
                    📷 {fotoIndex + 1} / {totalFotos}
                  </span>

                  {totalFotos > 1 && (
                    <>
                      <button 
                        onClick={(e) => cambiarFoto(info.nombre, totalFotos, -1, e)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow font-bold text-lg z-20"
                        title="Foto anterior"
                      >
                        ‹
                      </button>
                      <button 
                        onClick={(e) => cambiarFoto(info.nombre, totalFotos, 1, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow font-bold text-lg z-20"
                        title="Siguiente foto"
                      >
                        ›
                      </button>
                      
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center gap-1.5 z-20">
                        {info.fotos.map((_, idx) => (
                          <span 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all ${idx === fotoIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/60'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                
                {/* CENTRO: Detalles y Características con Íconos */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-blue-900 tracking-wider uppercase">Habitación</span>
                    <h4 className="text-2xl font-black text-gray-900 mt-1">{info.nombre}</h4>
                    
                    <p className="text-sm text-gray-600 mt-2">
                      Espacio confortable equipado para garantizar una estancia placentera con todas las comodidades.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {info.caracteristicas.length === 0 ? (
                        <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border">✨ Incluye servicios básicos del hotel</span>
                      ) : (
                        info.caracteristicas.map((carac, idx) => (
                          <div 
                            key={idx} 
                            className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm"
                          >
                            <span>{obtenerIconoCaracteristica(carac)}</span>
                            <span>{carac}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* DERECHA: Tarifa, Precio y Selector de Cantidad */}
                <div className="p-6 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col justify-between items-end min-w-[260px]">
                  <div className="text-right w-full">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Tarifa por noche</span>
                    <span className="text-3xl font-black text-blue-900">S/ {info.precio}</span>
                    <span className="text-xs text-gray-500 block mt-0.5">Impuestos incluidos</span>
                  </div>

                  <div className="w-full mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">Cantidad:</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleCambioCantidad(info.nombre, -1, info.stock)}
                        disabled={cantidadElegida === 0 || info.stock === 0}
                        className="bg-gray-200 text-gray-800 w-9 h-9 rounded-xl font-black hover:bg-gray-300 disabled:opacity-40 transition shadow-sm"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold w-6 text-center text-gray-900">{cantidadElegida}</span>
                      <button 
                        onClick={() => handleCambioCantidad(info.nombre, 1, info.stock)}
                        disabled={cantidadElegida >= info.stock || info.stock === 0}
                        className="bg-black text-white w-9 h-9 rounded-xl font-black hover:bg-gray-800 disabled:opacity-40 transition shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Barra inferior flotante */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t shadow-2xl py-4 px-6 z-40 flex justify-between items-center max-w-4xl mx-auto rounded-t-3xl">
        <div>
          <p className="text-xs text-gray-500 font-semibold">Fechas: {llegada} al {salida}</p>
          <p className="text-lg font-black text-black">{totalHabitacionesSeleccionadas} habitaciones seleccionadas</p>
        </div>
        <button 
          onClick={handleIrAReserva}
          className="bg-black hover:bg-gray-800 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg transition text-base flex items-center gap-2"
        >
          <span>Continuar con la Reserva</span>
          <span>➔</span>
        </button>
      </div>
    </div>
  )
}
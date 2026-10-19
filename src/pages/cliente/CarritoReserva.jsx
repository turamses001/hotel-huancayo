import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function CarritoReserva() {
  const [searchParams] = useSearchParams()
  const [clientePerfil, setClientePerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  const seleccionJson = searchParams.get('seleccion') || '{}'
  const [llegada, setLlegada] = useState(searchParams.get('llegada') || '')
  const [salida, setSalida] = useState(searchParams.get('salida') || '')
  const [observaciones, setObservaciones] = useState('')
  const [paso, setPaso] = useState(1)

  const preciosReferencia = {
    'Habitación Matrimonial': 120,
    'Habitación Doble Cama': 160,
    'Habitación con Jacuzzi': 250
  }

  let selecciones = {}
  try {
    selecciones = JSON.parse(decodeURIComponent(seleccionJson))
  } catch (e) {
    selecciones = {}
  }

  const numeroWhatsApp = "51999888777"
  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function cargarDatosPerfil() {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session) {
          alert("Debes iniciar sesión para completar tu reserva.")
          navigate('/cliente-auth')
          return
        }

        const { data: perfil } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', sessionData.session.user.id)
          .single()

        if (perfil) {
          setClientePerfil(perfil)
        } else {
          setClientePerfil({
            nombres: sessionData.session.user.email.split('@')[0],
            apellidos: '',
            dni: 'Registrado Web'
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    cargarDatosPerfil()
  }, [navigate])

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-bold text-blue-900 animate-pulse">Cargando resumen...</p>
      </div>
    )
  }

  let totalPagar = 0
  const itemsResumen = Object.entries(selecciones)
    .filter(([_, cant]) => cant > 0)
    .map(([tipo, cant]) => {
      const precioUni = preciosReferencia[tipo] || 120
      const subtotal = precioUni * cant
      totalPagar += subtotal
      return { tipo, cant, subtotal }
    })

  const handleEnviarWhatsAppYRegistrar = async () => {
    // Registrar reserva como Pendiente de Pago en Supabase
    for (const item of itemsResumen) {
      await supabase.from('reservas').insert([
        {
          tipo_habitacion: item.tipo,
          cantidad: item.cant,
          cliente_nombre: `${clientePerfil.nombres} ${clientePerfil.apellidos || ''}`.trim(),
          cliente_documento: clientePerfil.dni || 'Web',
          fecha_ingreso: llegada,
          fecha_salida: salida,
          observaciones: observaciones || 'Reserva web con Yape pendiente de confirmación',
          estado: 'Pendiente de Pago'
        }
      ])
    }

    const detalleTexto = itemsResumen.map(i => `${i.cant}x ${i.tipo}`).join(', ')
    const mensajeWA = `Hola Hotel Huancayo, soy ${clientePerfil.nombres} ${clientePerfil.apellidos || ''} (DNI: ${clientePerfil.dni || 'Web'}). Deseo confirmar mi reserva por: ${detalleTexto}. Fechas: del ${llegada} al ${salida}. Obs: ${observaciones || 'Ninguna'}. Monto total: S/ ${totalPagar}. Adjunto mi comprobante de Yape.`
    const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensajeWA)}`
    
    window.open(linkWhatsApp, '_blank')
    navigate('/app/habitaciones')
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-900 text-white p-6 text-center">
          <h2 className="text-3xl font-bold">Resumen de tu Reserva</h2>
          <p className="mt-1 text-blue-200 font-medium">
            Cliente: {clientePerfil.nombres} {clientePerfil.apellidos} | DNI: {clientePerfil.dni}
          </p>
        </div>

        <div className="p-8">
          {paso === 1 ? (
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b pb-2">1. Detalle de habitaciones seleccionadas</h3>
              
              <div className="space-y-3">
                {itemsResumen.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-xl border flex justify-between items-center">
                    <span className="text-base font-bold text-gray-800">{item.cant}x {item.tipo}</span>
                    <span className="text-lg font-black text-blue-900">S/ {item.subtotal}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">Fecha de Ingreso</label>
                  <input 
                    type="date" 
                    min={hoy}
                    value={llegada} 
                    onChange={(e) => setLlegada(e.target.value)} 
                    className="w-full border rounded-lg p-3" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">Fecha de Salida</label>
                  <input 
                    type="date" 
                    min={llegada || hoy}
                    value={salida} 
                    onChange={(e) => setSalida(e.target.value)} 
                    className="w-full border rounded-lg p-3" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">Observaciones respecto a tu llegada</label>
                <textarea 
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full border rounded-xl p-3 outline-none focus:border-blue-900 text-sm"
                  placeholder="Ej. Llegaremos aprox. a las 8:00 pm, requerimos cochera..."
                  rows="2"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center">
                <span className="font-bold text-gray-700 text-lg">Monto Total:</span>
                <span className="text-3xl font-black text-blue-900">S/ {totalPagar}</span>
              </div>

              <div className="flex gap-4 pt-2">
                <Link to="/app/habitaciones" className="w-1/3 text-center bg-gray-200 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-300 transition flex items-center justify-center">
                  Modificar
                </Link>
                <button 
                  onClick={() => setPaso(2)}
                  disabled={itemsResumen.length === 0 || !llegada || !salida}
                  className="w-2/3 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:bg-gray-300 transition shadow"
                >
                  Continuar al Pago Yape
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-bold text-gray-800">2. Pago con Yape y Confirmación</h3>
              <p className="text-gray-600">Realiza el depósito de <b>S/ {totalPagar}</b> escaneando el QR</p>
              
              <img src="https://via.placeholder.com/250x250.png?text=QR+YAPE+HOTEL+HUANCAYO" alt="QR Yape" className="mx-auto rounded-xl shadow border-4 border-purple-600 w-56 h-56 object-cover" />
              
              <div className="flex gap-4 pt-4">
                <button onClick={() => setPaso(1)} className="w-1/3 bg-gray-200 font-bold py-3 rounded-xl hover:bg-gray-300">Atrás</button>
                <button 
                  onClick={handleEnviarWhatsAppYRegistrar}
                  className="w-2/3 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>💬 Enviar a WhatsApp y Registrar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
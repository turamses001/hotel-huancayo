import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Reserva() {
  const { id } = useParams() // Captura el ID de la URL
  const [habitacion, setHabitacion] = useState(null)
  const [paso, setPaso] = useState(1) // Paso 1: Fechas | Paso 2: Pago
  
  // Datos del formulario
  const [llegada, setLlegada] = useState('')
  const [salida, setSalida] = useState('')
  
  // Tu número de WhatsApp real (cámbialo aquí)
  const numeroWhatsApp = "51999888777" 

  useEffect(() => {
    async function traerHabitacion() {
      const { data, error } = await supabase
        .from('habitaciones')
        .select('*')
        .eq('numero', id)
        .single() // Solo queremos una habitación
      
      if (!error) setHabitacion(data)
    }
    traerHabitacion()
  }, [id])

  if (!habitacion) return <div className="text-center p-10 text-xl font-bold">Cargando detalles...</div>

  // Generar el mensaje automático para WhatsApp
  const mensajeWA = `Hola Hotel Huancayo, quiero confirmar mi reserva para la Habitación ${habitacion.numero} (${habitacion.tipo}). Fechas: ${llegada} al ${salida}. Monto a pagar: S/ ${habitacion.precio}. ¡Aquí envío mi comprobante de Yape!`
  const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensajeWA)}`

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        
        {/* Cabecera superior */}
        <div className="bg-blue-900 text-white p-6 text-center">
          <h2 className="text-3xl font-bold">Completar Reserva</h2>
          <p className="mt-2 text-blue-200">Habitación {habitacion.numero} - {habitacion.tipo}</p>
        </div>

        <div className="p-8">
          {paso === 1 ? (
            /* PASO 1: Selector de Fechas */
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b pb-2">1. Elige tus fechas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Check-in (Llegada)</label>
                  <input 
                    type="date" 
                    value={llegada}
                    onChange={(e) => setLlegada(e.target.value)}
                    className="w-full border rounded-lg p-3"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Check-out (Salida)</label>
                  <input 
                    type="date" 
                    value={salida}
                    onChange={(e) => setSalida(e.target.value)}
                    className="w-full border rounded-lg p-3"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center mt-6">
                <span className="font-bold text-gray-700">Total a pagar:</span>
                <span className="text-2xl font-black text-blue-900">S/ {habitacion.precio}</span>
              </div>

              <div className="flex gap-4 mt-8">
                <Link to="/" className="w-1/3 text-center bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300">
                  Volver
                </Link>
                <button 
                  onClick={() => setPaso(2)}
                  disabled={!llegada || !salida} // Se desactiva si no pone fechas
                  className="w-2/3 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  Continuar al Pago
                </button>
              </div>
            </div>
          ) : (
            /* PASO 2: Pago con Yape */
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-bold text-gray-800">2. Realiza tu pago</h3>
              <p className="text-gray-600">Escanea el código QR desde tu app de Yape para pagar <b>S/ {habitacion.precio}</b></p>
              
              {/* Aquí va tu QR real. Por ahora uso una imagen de prueba */}
              <img 
                src="https://via.placeholder.com/300x300.png?text=TU+C%C3%93DIGO+QR+YAPE+AQU%C3%8D" 
                alt="QR Yape" 
                className="mx-auto rounded-lg shadow-md border-4 border-purple-600 w-64 h-64"
              />
              
              <div className="bg-purple-100 text-purple-900 p-4 rounded-lg inline-block font-bold">
                Yape a nombre de: Hotel Huancayo SAC
              </div>

              <p className="text-sm text-gray-500 mt-4">
                Una vez realizado el pago, presiona el botón para enviarnos la captura por WhatsApp y confirmar tu reserva.
              </p>

              <div className="flex gap-4 mt-6">
                <button 
                  onClick={() => setPaso(1)}
                  className="w-1/3 bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300"
                >
                  Atrás
                </button>
                <a 
                  href={linkWhatsApp} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-2/3 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  <span>💬 Validar por WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Reserva() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [habitacion, setHabitacion] = useState(null)
  const [paso, setPaso] = useState(1)
  
  const tipoParam = searchParams.get('tipo') || 'Matrimonial'
  const cantidadParam = parseInt(searchParams.get('cant')) || 1
  const llegadaParam = searchParams.get('llegada') || ''
  const salidaParam = searchParams.get('salida') || ''

  const [llegada, setLlegada] = useState(llegadaParam)
  const [salida, setSalida] = useState(llegadaParam ? salidaParam : '')
  const [clientePerfil, setClientePerfil] = useState(null)
  const navigate = useNavigate()
  
  const numeroWhatsApp = "51999888777" 
  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function verificarYCargar() {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        alert("Debes iniciar sesión para realizar una reserva.")
        navigate('/cliente-auth')
        return
      }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single()
      
      if (perfil) setClientePerfil(perfil)

      const { data: hab, error } = await supabase
        .from('habitaciones')
        .select('*')
        .eq('numero', id)
        .single()
      
      if (!error) setHabitacion(hab)
    }
    verificarYCargar()
  }, [id, navigate])

  if (!habitacion || !clientePerfil) return <div className="text-center p-10 text-xl font-bold">Verificando credenciales...</div>

  const precioTotal = habitacion.precio * cantidadParam

  const mensajeWA = `Hola Hotel Huancayo, soy ${clientePerfil.nombres} ${clientePerfil.apellidos} (DNI: ${clientePerfil.dni}). Deseo confirmar mi reserva por ${cantidadParam} habitación(es) tipo ${tipoParam}. Fechas: ${llegada} al ${salida}. Monto Total: S/ ${precioTotal}. Adjunto mi comprobante de Yape.`
  const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensajeWA)}`

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-900 text-white p-6 text-center">
          <h2 className="text-3xl font-bold">Completar Reserva</h2>
          <p className="mt-1 text-blue-200">Cliente: {clientePerfil.nombres} {clientePerfil.apellidos} (DNI: {clientePerfil.dni})</p>
          <p className="mt-1 text-sm text-blue-300">{cantidadParam}x {tipoParam}</p>
        </div>

        <div className="p-8">
          {paso === 1 ? (
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b pb-2">1. Selecciona tus fechas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Check-in</label>
                  <input 
                    type="date" 
                    min={hoy}
                    value={llegada} 
                    onChange={(e) => setLlegada(e.target.value)} 
                    className="w-full border rounded-lg p-3" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Check-out</label>
                  <input 
                    type="date" 
                    min={llegada || hoy}
                    value={salida} 
                    onChange={(e) => setSalida(e.target.value)} 
                    className="w-full border rounded-lg p-3" 
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 block">Cantidad seleccionada</span>
                  <span className="font-bold text-gray-800">{cantidadParam} habitación(es)</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Total a pagar</span>
                  <span className="text-2xl font-black text-blue-900">S/ {precioTotal}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Link to="/app/habitaciones" className="w-1/3 text-center bg-gray-200 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-300">
                  Cancelar
                </Link>
                <button 
                  onClick={() => setPaso(2)}
                  disabled={!llegada || !salida}
                  className="w-2/3 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:bg-gray-300 transition"
                >
                  Continuar al Pago
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-bold text-gray-800">2. Pago con Yape</h3>
              <p className="text-gray-600">Escanea el código QR y paga <b>S/ {precioTotal}</b> por tus {cantidadParam} habitaciones</p>
              
              <img src="https://via.placeholder.com/250x250.png?text=QR+YAPE+HOTEL+HUANCAYO" alt="QR Yape" className="mx-auto rounded-xl shadow border-4 border-purple-600 w-56 h-56 object-cover" />
              
              <div className="flex gap-4 pt-4">
                <button onClick={() => setPaso(1)} className="w-1/3 bg-gray-200 font-bold py-3 rounded-xl hover:bg-gray-300">Atrás</button>
                <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" className="w-2/3 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 flex items-center justify-center gap-2 shadow-lg">
                  <span>💬 Enviar Reserva y Voucher</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
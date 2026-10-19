import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function ClienteAuth() {
  const [esRegistro, setEsRegistro] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [dni, setDni] = useState('')
  const [mayorEdad, setMayorEdad] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (esRegistro && !mayorEdad) {
      setError("Debes ser mayor de 18 años para registrarte y reservar.")
      return
    }

    if (esRegistro) {
      // Registrar en Supabase Auth
      const { data, error: errAuth } = await supabase.auth.signUp({ email, password })
      if (errAuth) {
        setError(errAuth.message)
        return
      }
      
      // Guardar datos adicionales en la tabla perfiles
      if (data?.user) {
        await supabase.from('perfiles').insert([
          { id: data.user.id, nombres, apellidos, dni, correo: email }
        ])
      }
      alert("¡Registro exitoso! Ya puedes iniciar sesión.")
      setEsRegistro(false)
    } else {
      // Iniciar sesión
      const { error: errLogin } = await supabase.auth.signInWithPassword({ email, password })
      if (errLogin) {
        setError(errLogin.message)
      } else {
        navigate('/app')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h2 className="text-3xl font-extrabold text-blue-900 text-center mb-6">
          {esRegistro ? "Registro de Cliente" : "Iniciar Sesión"}
        </h2>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4 font-bold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {esRegistro && (
            <>
              <div>
                <label className="block text-gray-700 font-bold mb-1">Nombres</label>
                <input type="text" value={nombres} onChange={e => setNombres(e.target.value)} className="w-full border p-3 rounded-lg" required />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1">Apellidos</label>
                <input type="text" value={apellidos} onChange={e => setApellidos(e.target.value)} className="w-full border p-3 rounded-lg" required />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1">DNI</label>
                <input type="text" maxLength="8" value={dni} onChange={e => setDni(e.target.value)} className="w-full border p-3 rounded-lg" required />
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-700 font-bold mb-1">Correo Electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-3 rounded-lg" required />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-3 rounded-lg" required />
          </div>

          {esRegistro && (
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="mayor" checked={mayorEdad} onChange={e => setMayorEdad(e.target.checked)} className="w-5 h-5 text-blue-900 rounded" required />
              <label htmlFor="mayor" className="text-sm font-semibold text-gray-700">Confirmo que soy mayor de 18 años</label>
            </div>
          )}

          <button type="submit" className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition shadow-lg mt-4">
            {esRegistro ? "Registrarse" : "Ingresar"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button onClick={() => setEsRegistro(!esRegistro)} className="text-blue-700 font-bold text-sm hover:underline">
            {esRegistro ? "¿Ya tienes cuenta? Inicia sesión aquí" : "¿No tienes cuenta? Regístrate aquí"}
          </button>
        </div>
      </div>
    </div>
  )
}
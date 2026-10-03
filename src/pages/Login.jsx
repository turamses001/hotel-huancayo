import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate() // Herramienta para saltar a otra pantalla

  const handleLogin = async (e) => {
    e.preventDefault() // Evita que la página se recargue al enviar el formulario
    setError(null)
    
    // Le preguntamos a Supabase si el usuario existe
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Correo o contraseña incorrectos")
    } else {
      // Si todo está bien, lo enviamos al panel de control
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center text-blue-900 mb-6">Acceso Admin</h2>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center font-bold">{error}</p>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full border p-2 rounded focus:outline-none focus:border-blue-500" 
              required 
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full border p-2 rounded focus:outline-none focus:border-blue-500" 
              required 
            />
          </div>
          <button type="submit" className="w-full bg-blue-900 text-white font-bold py-2 rounded hover:bg-blue-800 transition mt-4">
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  )
}
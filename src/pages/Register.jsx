// src/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Trophy, User, Shield } from 'lucide-react'
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

export default function Register() {
  const { register } = useAuth()
  const navigate      = useNavigate()

  const [form, setForm]       = useState({ displayName: '', email: '', password: '', confirm: '', groupInput: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.displayName.trim()) { toast.error('Ingresa tu nombre'); return }
    if (!form.groupInput.trim()) { toast.error('Ingresa el código o nombre de tu grupo'); return }
    if (form.password.length < 6) { toast.error('Contraseña mínimo 6 caracteres'); return }
    if (form.password !== form.confirm) { toast.error('Las contraseñas no coinciden'); return }

    setLoading(true)
    try {
      const targetGroup = form.groupInput.trim().toUpperCase()
      let finalGroupId = targetGroup

      // 1. Validar si el grupo ingresado existe en la base de datos
      const groupsRef = collection(db, 'groups')
      const qByName = query(groupsRef, where('name', '==', targetGroup.toLowerCase()))
      const qById   = query(groupsRef, where('code', '==', targetGroup))

      const [snapName, snapId] = await Promise.all([
        getDocs(qByName),
        getDocs(qById)
      ])

      if (!snapName.empty) {
        const groupData = snapName.docs[0].data()
        finalGroupId = groupData.code || snapName.docs[0].id
      } else if (!snapId.empty) {
        const groupData = snapId.docs[0].data()
        finalGroupId = groupData.code || snapId.docs[0].id
      } else {
        toast.error('El grupo especificado no existe. Verifica el nombre o código con tu administrador.')
        setLoading(false)
        return
      }

      // 2. Crear el usuario en Firebase Authentication usando tu función nativa
      const userCredential = await register({ 
        email: form.email, 
        password: form.password, 
        displayName: form.displayName.trim() 
      })
      
      // Si register retorna la credencial directamente, extraemos el usuario
      const newUser = userCredential?.user || userCredential

      if (!newUser || !newUser.uid) {
        throw new Error('No se pudo obtener el UID del usuario registrado.')
      }

      // 3. Inicializar el documento completo en la colección 'users' de Firestore sin omitir nada
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        displayName: form.displayName.trim(),
        email: form.email.trim().toLowerCase(),
        coins: 500,               // Tus 500 monedas de bienvenida
        totalPoints: 0,           // Puntos totales iniciales
        jornadaPoints: 0,         // Puntos por jornada iniciales
        streak: 0,                // Racha inicial
        groupId: finalGroupId.toUpperCase(), // Sincronizado a la comunidad privada
        createdAt: new Date().toISOString()
      })

      toast.success('¡Cuenta creada! Bienvenido a MundialF 🎉')
      navigate('/home', { replace: true })
    } catch (err) {
      console.error(err)
      toast.error(firebaseError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#0a0e1a] flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#00ff7f0d] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#fbbf2411] rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#111827] border border-[#1e2d3d] mb-4">
            <Trophy className="w-8 h-8 text-[#00ff7f]" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Mundial<span className="neon-text">F</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Únete al juego</p>
        </div>

        {/* Coins banner */}
        <div className="flex items-center gap-2 bg-[#fbbf2411] border border-[#fbbf2433] rounded-xl px-4 py-3 mb-6">
          <span className="text-xl">🪙</span>
          <p className="text-xs text-[#fbbf24] font-medium">
            Recibe <strong>500 monedas</strong> de bienvenida al registrarte
          </p>
        </div>

        <div className="card p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6">Crear cuenta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Nombre de usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  className="input-field pl-9"
                  required
                />
              </div>
            </div>

            {/* Código o Nombre del Grupo */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Código o Nombre del Grupo Privado
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  name="groupInput"
                  value={form.groupInput}
                  onChange={handleChange}
                  placeholder="Ej: FUT o PJFUUL"
                  className="input-field pl-9 uppercase"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                className="input-field"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Repite la contraseña"
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0a0e1a] border-t-transparent rounded-full animate-spin" />
                  Creando cuenta...
                </>
              ) : 'Crear cuenta gratis'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#00ff7f] font-semibold hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

function firebaseError(code) {
  const map = {
    'auth/email-already-in-use': 'Este email ya está registrado',
    'auth/invalid-email':        'Email inválido',
    'auth/weak-password':        'Contraseña muy débil',
  }
  return map[code] || 'Error al crear cuenta'
}
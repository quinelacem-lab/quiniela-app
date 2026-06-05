'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [modo, setModo] = useState('login')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!email.trim() || !email.includes('@')) { setError('Ingresa un correo válido.'); return }
    if (!password) { setError('Ingresa tu contraseña.'); return }

    if (modo === 'register') {
      if (!nombre.trim()) { setError('Ingresa tu nombre.'); return }
      if (password.length < 4) { setError('La contraseña debe tener al menos 4 caracteres.'); return }
      if (password !== passwordConfirm) { setError('Las contraseñas no coinciden.'); return }
    }

    setLoading(true)
    const body = modo === 'login'
      ? { action: 'login', email, password }
      : { action: 'register', nombre, email, password }

    const res = await fetch('/api/participantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false); return }

    localStorage.setItem('quiniela_user', JSON.stringify({ id: data.id, nombre: data.nombre, email: data.email }))
    if (data.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      router.push('/admin')
    } else {
      router.push('/quiniela')
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    border: '1.5px solid #dde8dd', borderRadius: 10,
    fontSize: 14, outline: 'none',
    color: '#1a2e22', background: '#fafcfa'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#1a3a2a', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 1rem'
          }}>⚽</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a3a2a', marginBottom: 4 }}>Quiniela</h1>
          <p style={{ fontSize: 13, color: '#6a8a76' }}>
            {modo === 'login' ? 'Inicia sesión para participar' : 'Crea tu cuenta para participar'}
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #dde8dd', padding: '1.5rem' }}>

          <div style={{ display: 'flex', gap: 6, background: '#e4ede4', borderRadius: 10, padding: 4, marginBottom: '1.25rem' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setModo(m); setError('') }} style={{
                flex: 1, padding: '8px', fontSize: 13, fontWeight: 600,
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: modo === m ? '#1a3a2a' : 'transparent',
                color: modo === m ? '#c9a84c' : '#4a7a5a'
              }}>
                {m === 'login' ? 'Iniciar sesión' : 'Registrarme'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modo === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6a8a76', marginBottom: 6, fontWeight: 500 }}>Nombre completo</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" style={inputStyle} />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#6a8a76', marginBottom: 6, fontWeight: 500 }}>Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#6a8a76', marginBottom: 6, fontWeight: 500 }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 4 caracteres" style={inputStyle} />
            </div>
            {modo === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6a8a76', marginBottom: 6, fontWeight: 500 }}>Confirmar contraseña</label>
                <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="Repite tu contraseña" onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={inputStyle} />
              </div>
            )}
          </div>

          {error && <p style={{ color: '#b84a4a', fontSize: 12, marginTop: '0.75rem' }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '12px', marginTop: '1.25rem',
              background: loading ? '#4a7a5a' : '#1a3a2a',
              color: '#c9a84c', border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Cargando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#8aaa96', marginTop: '1rem' }}>
          Cierre de quiniela: 10 de junio, 11:59 PM
        </p>
      </div>
    </div>
  )
}
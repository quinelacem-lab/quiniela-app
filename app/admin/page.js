'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const V = '#1a3a2a'
const VM = '#2d5a3d'
const VB = '#dde8dd'
const VT = '#7dab8a'
const DO = '#c9a84c'
const DC = '#fdf3dc'
const DT = '#8a6010'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [partidos, setPartidos] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('partidos')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const u = localStorage.getItem('quiniela_user')
    if (!u) { router.push('/'); return }
    const parsed = JSON.parse(u)
    if (parsed.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) { router.push('/quiniela'); return }
    setUser(parsed)
    loadData()
  }, [])

  async function loadData() {
    const [resPartidos, resConfig] = await Promise.all([
      fetch('/api/partidos'),
      fetch('/api/config')
    ])
    const [dataPartidos, dataConfig] = await Promise.all([
      resPartidos.json(),
      resConfig.json()
    ])
    setPartidos(dataPartidos)
    setConfig(dataConfig)
    setLoading(false)
  }

  function updatePartido(id, field, value) {
    setPartidos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  async function guardarResultado(partido) {
    setSaving(true)
    setMsg('')
    const h = parseInt(partido.goles_local)
    const a = parseInt(partido.goles_visitante)
    if (isNaN(h) || isNaN(a)) { setMsg('Ingresa ambos goles.'); setSaving(false); return }
    const resultado_oficial = h > a ? 'local' : h < a ? 'visitante' : 'empate'
    const res = await fetch('/api/partidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: partido.id, goles_local: h, goles_visitante: a, resultado_oficial })
    })
    const data = await res.json()
    if (data.error) { setMsg('Error: ' + data.error); setSaving(false); return }
    setPartidos(prev => prev.map(p => p.id === partido.id ? { ...p, ...data } : p))
    setMsg(`✓ ${partido.local} vs ${partido.visitante} guardado`)
    setSaving(false)
  }

  async function toggleExacto(partido) {
    const res = await fetch('/api/partidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: partido.id, resultado_exacto: !partido.resultado_exacto })
    })
    const data = await res.json()
    if (!data.error) setPartidos(prev => prev.map(p => p.id === partido.id ? { ...p, ...data } : p))
  }

  async function guardarConfig() {
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    const data = await res.json()
    if (data.error) { setMsg('Error: ' + data.error); setSaving(false); return }
    setConfig(data)
    setMsg('✓ Configuración guardada')
    setSaving(false)
  }

  function logout() {
    localStorage.removeItem('quiniela_user')
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: VT, fontSize: 14 }}>Cargando panel...</p>
    </div>
  )

  const tabs = ['partidos', 'equipos', 'config', 'tabla']
  const tabLabel = { partidos: '⚽ Resultados', equipos: '🗂 Partidos', config: '⚙️ Config', tabla: '🏆 Tabla' }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '1rem' }}>

      <div style={{
        background: V, borderRadius: 16,
        padding: '16px 20px', display: 'flex',
        alignItems: 'center', gap: 12, marginBottom: 12
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: DO, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0
        }}>⚙️</div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>Panel Admin</p>
          <p style={{ color: VT, fontSize: 11, marginTop: 2 }}>{user?.nombre}</p>
        </div>
        <button onClick={() => router.push('/reporte')} style={{
          background: DO, color: V, border: 'none',
          borderRadius: 10, padding: '6px 12px',
          fontSize: 11, fontWeight: 700, cursor: 'pointer', marginRight: 6
        }}>
          🖨 Reporte
        </button>
        <button onClick={() => router.push('/quiniela')} style={{
          background: VM, color: '#fff', border: 'none',
          borderRadius: 10, padding: '6px 12px',
          fontSize: 11, fontWeight: 700, cursor: 'pointer', marginRight: 6
        }}>
          Ver quiniela
        </button>
        <button onClick={logout} style={{ fontSize: 11, color: VT, background: 'none', border: 'none', cursor: 'pointer' }}>
          Salir
        </button>
      </div>

      {msg && (
        <div style={{
          background: msg.startsWith('✓') ? '#f0f7f2' : '#fdf0f0',
          color: msg.startsWith('✓') ? '#2a5a3a' : '#b84a4a',
          border: `1px solid ${msg.startsWith('✓') ? VB : '#f0c0c0'}`,
          borderRadius: 10, padding: '10px 14px',
          fontSize: 13, marginBottom: 12
        }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, background: '#e4ede4', borderRadius: 12, padding: 4, marginBottom: 12 }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 600,
            borderRadius: 10, border: 'none', cursor: 'pointer',
            background: activeTab === tab ? V : 'transparent',
            color: activeTab === tab ? DO : '#4a7a5a'
          }}>
            {tabLabel[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'partidos' && (
        <div>
          <p style={{ fontSize: 12, color: '#6a8a76', marginBottom: 12 }}>
            Activa resultado exacto y registra los marcadores reales.
          </p>
          {partidos.map(partido => (
            <div key={partido.id} style={{
              background: '#fff', borderRadius: 14,
              border: `1px solid ${VB}`, padding: '14px 16px', marginBottom: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1a2e22' }}>
                    {partido.local} vs {partido.visitante}
                  </p>
                  <p style={{ fontSize: 11, color: '#8aaa96' }}>Grupo {partido.grupo} · {partido.fecha}</p>
                </div>
                {partido.resultado_oficial && (
                  <span style={{ background: '#f0f7f2', color: '#2a5a3a', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                    {partido.goles_local} - {partido.goles_visitante}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  onClick={() => toggleExacto(partido)}
                  style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: partido.resultado_exacto ? DO : '#dde8dd',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', padding: '0 3px',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    transform: partido.resultado_exacto ? 'translateX(18px)' : 'translateX(0)',
                    transition: 'transform 0.2s'
                  }} />
                </div>
                <span style={{ fontSize: 12, color: '#6a8a76' }}>Resultado exacto</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number" min="0" max="20"
                  value={partido.goles_local ?? ''}
                  onChange={e => updatePartido(partido.id, 'goles_local', e.target.value)}
                  placeholder="Local"
                  style={{
                    width: 56, height: 36, textAlign: 'center',
                    fontSize: 15, fontWeight: 700,
                    border: `1.5px solid ${VB}`, borderRadius: 8,
                    color: '#1a2e22', background: '#fafcfa', outline: 'none'
                  }}
                />
                <span style={{ color: '#aac5b4', fontSize: 14 }}>-</span>
                <input
                  type="number" min="0" max="20"
                  value={partido.goles_visitante ?? ''}
                  onChange={e => updatePartido(partido.id, 'goles_visitante', e.target.value)}
                  placeholder="Visitante"
                  style={{
                    width: 56, height: 36, textAlign: 'center',
                    fontSize: 15, fontWeight: 700,
                    border: `1.5px solid ${VB}`, borderRadius: 8,
                    color: '#1a2e22', background: '#fafcfa', outline: 'none'
                  }}
                />
                <button
                  onClick={() => guardarResultado(partido)}
                  disabled={saving}
                  style={{
                    marginLeft: 4, background: V, color: DO,
                    border: 'none', borderRadius: 10,
                    padding: '8px 16px', fontSize: 12,
                    fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Aplicar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'equipos' && (
        <GestorPartidos partidos={partidos} setPartidos={setPartidos} setMsg={setMsg} />
      )}

      {activeTab === 'config' && config && (
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${VB}`, padding: '1.25rem' }}>
          {[
            { label: 'Nombre de la quiniela', field: 'nombre', type: 'text' },
            { label: 'Correo del admin', field: 'admin_email', type: 'email' },
          ].map(({ label, field, type }) => (
            <div key={field} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#6a8a76', marginBottom: 6, fontWeight: 500 }}>{label}</label>
              <input
                type={type}
                value={config[field]}
                onChange={e => setConfig({ ...config, [field]: e.target.value })}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: `1.5px solid ${VB}`, borderRadius: 10,
                  fontSize: 14, outline: 'none',
                  color: '#1a2e22', background: '#fafcfa'
                }}
              />
            </div>
          ))}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 12, color: '#6a8a76', marginBottom: 6, fontWeight: 500 }}>Fecha de cierre</label>
            <input
              type="datetime-local"
              value={config.fecha_cierre ? config.fecha_cierre.slice(0, 16) : ''}
              onChange={e => setConfig({ ...config, fecha_cierre: e.target.value })}
              style={{
                width: '100%', padding: '10px 12px',
                border: `1.5px solid ${VB}`, borderRadius: 10,
                fontSize: 14, outline: 'none',
                color: '#1a2e22', background: '#fafcfa'
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
            {[
              { label: 'Puntos por acierto', field: 'puntos_acierto' },
              { label: 'Puntos por exacto', field: 'puntos_exacto' }
            ].map(({ label, field }) => (
              <div key={field}>
                <label style={{ display: 'block', fontSize: 12, color: '#6a8a76', marginBottom: 6, fontWeight: 500 }}>{label}</label>
                <input
                  type="number" min="1"
                  value={config[field]}
                  onChange={e => setConfig({ ...config, [field]: parseInt(e.target.value) })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: `1.5px solid ${VB}`, borderRadius: 10,
                    fontSize: 14, outline: 'none',
                    color: '#1a2e22', background: '#fafcfa'
                  }}
                />
              </div>
            ))}
          </div>
          <button onClick={guardarConfig} disabled={saving} style={{
            width: '100%', padding: '12px',
            background: V, color: DO,
            border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 700, cursor: 'pointer'
          }}>
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      )}

      {activeTab === 'tabla' && <AdminTabla />}
    </div>
  )
}

function AdminTabla() {
  const [tabla, setTabla] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tabla').then(r => r.json()).then(d => { setTabla(d); setLoading(false) })
  }, [])

  if (loading) return <p style={{ textAlign: 'center', color: '#8aaa96', fontSize: 13, padding: '2rem' }}>Cargando...</p>

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #dde8dd', overflow: 'hidden' }}>
      {tabla.length === 0 && (
        <p style={{ textAlign: 'center', color: '#8aaa96', fontSize: 13, padding: '2rem' }}>Aún no hay participantes.</p>
      )}
      {tabla.map((p, i) => (
        <div key={p.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px',
          borderBottom: i < tabla.length - 1 ? '1px solid #f0f4f0' : 'none'
        }}>
          <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{medals[i] || i + 1}</span>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#1a3a2a', color: '#c9a84c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, flexShrink: 0
          }}>
            {p.nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1a2e22' }}>{p.nombre}</p>
            <p style={{ fontSize: 11, color: '#8aaa96' }}>{p.email}</p>
            <p style={{ fontSize: 11, color: '#8aaa96' }}>{p.aciertos} aciertos · {p.exactos} exactos · {p.picks} picks</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1a3a2a' }}>{p.puntos}</p>
            <p style={{ fontSize: 10, color: '#8aaa96' }}>pts</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function GestorPartidos({ partidos, setPartidos, setMsg }) {
  const [form, setForm] = useState({ local: '', visitante: '', grupo: '', fecha: '', resultado_exacto: false })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)

  async function crearPartido() {
    if (!form.local || !form.visitante || !form.grupo || !form.fecha) {
      setMsg('Completa todos los campos del partido.'); return
    }
    setSaving(true)
    const res = await fetch('/api/partidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...form })
    })
    const data = await res.json()
    if (data.error) { setMsg('Error: ' + data.error); setSaving(false); return }
    setPartidos(prev => [...prev, data])
    setForm({ local: '', visitante: '', grupo: '', fecha: '', resultado_exacto: false })
    setMsg('✓ Partido creado')
    setSaving(false)
  }

  async function eliminarPartido(partido) {
    const res = await fetch(`/api/partidos/${partido.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.error) { setMsg('Error: ' + data.error); return }
    setPartidos(prev => prev.filter(p => p.id !== partido.id))
    setMsg(`✓ ${partido.local} vs ${partido.visitante} eliminado`)
    setConfirm(null)
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: `1.5px solid ${VB}`, borderRadius: 10,
    fontSize: 13, outline: 'none',
    color: '#1a2e22', background: '#fafcfa'
  }

  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${VB}`, padding: '1.25rem', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: V, marginBottom: 14 }}>Agregar partido</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#6a8a76', marginBottom: 4, fontWeight: 500 }}>Local</label>
            <input style={inputStyle} placeholder="Ej: México" value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#6a8a76', marginBottom: 4, fontWeight: 500 }}>Visitante</label>
            <input style={inputStyle} placeholder="Ej: Sudáfrica" value={form.visitante} onChange={e => setForm({ ...form, visitante: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#6a8a76', marginBottom: 4, fontWeight: 500 }}>Grupo</label>
            <input style={inputStyle} placeholder="Ej: A" value={form.grupo} onChange={e => setForm({ ...form, grupo: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#6a8a76', marginBottom: 4, fontWeight: 500 }}>Fecha</label>
            <input style={inputStyle} placeholder="Ej: 11 jun" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            onClick={() => setForm({ ...form, resultado_exacto: !form.resultado_exacto })}
            style={{
              width: 40, height: 22, borderRadius: 11,
              background: form.resultado_exacto ? DO : '#dde8dd',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', padding: '0 3px',
              transition: 'background 0.2s'
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transform: form.resultado_exacto ? 'translateX(18px)' : 'translateX(0)',
              transition: 'transform 0.2s'
            }} />
          </div>
          <span style={{ fontSize: 12, color: '#6a8a76' }}>Activar resultado exacto</span>
        </div>
        <button
          onClick={crearPartido}
          disabled={saving}
          style={{
            width: '100%', padding: '11px',
            background: V, color: DO,
            border: 'none', borderRadius: 12,
            fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}
        >
          {saving ? 'Guardando...' : '+ Agregar partido'}
        </button>
      </div>

      <p style={{ fontSize: 11, color: '#6a8a76', marginBottom: 10 }}>
        {partidos.length} partido{partidos.length !== 1 ? 's' : ''} en la quiniela
      </p>

      {partidos.map(partido => (
        <div key={partido.id} style={{
          background: '#fff', borderRadius: 12,
          border: `1px solid ${VB}`, padding: '12px 16px',
          marginBottom: 8, display: 'flex',
          alignItems: 'center', gap: 10
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1a2e22' }}>
              {partido.local} vs {partido.visitante}
              {partido.resultado_exacto && (
                <span style={{ marginLeft: 6, fontSize: 11, color: DT, background: DC, padding: '1px 6px', borderRadius: 10 }}>
                  ⭐ exacto
                </span>
              )}
            </p>
            <p style={{ fontSize: 11, color: '#8aaa96' }}>Grupo {partido.grupo} · {partido.fecha}</p>
          </div>
          {confirm === partido.id ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => eliminarPartido(partido)}
                style={{ background: '#b84a4a', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirm(null)}
                style={{ background: '#f0f4f0', color: '#4a7a5a', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(partido.id)}
              style={{ background: '#fdf0f0', color: '#b84a4a', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer' }}
            >
              Eliminar
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
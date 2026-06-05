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

export default function QuinielaPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [partidos, setPartidos] = useState([])
  const [config, setConfig] = useState(null)
  const [picks, setPicks] = useState({})
  const [exactos, setExactos] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('quiniela')

  useEffect(() => {
    const u = localStorage.getItem('quiniela_user')
    if (!u) { router.push('/'); return }
    const parsed = JSON.parse(u)
    setUser(parsed)
    loadData(parsed)
  }, [])

  async function loadData(u) {
    const [resPartidos, resConfig, resQuiniela] = await Promise.all([
      fetch('/api/partidos'),
      fetch('/api/config'),
      fetch(`/api/quinielas?participante_id=${u.id}`)
    ])
    const [dataPartidos, dataConfig, dataQuiniela] = await Promise.all([
      resPartidos.json(),
      resConfig.json(),
      resQuiniela.json()
    ])
    setPartidos(dataPartidos)
    setConfig(dataConfig)
    const picksObj = {}
    const exactosObj = {}
    dataQuiniela.forEach(q => {
      picksObj[q.partido_id] = q.pick
      if (q.goles_local_exacto !== null || q.goles_visitante_exacto !== null) {
        exactosObj[q.partido_id] = {
          local: q.goles_local_exacto ?? '',
          visitante: q.goles_visitante_exacto ?? ''
        }
      }
    })
    setPicks(picksObj)
    setExactos(exactosObj)
    setLoading(false)
  }

  function isClosed() {
    if (!config) return false
    return new Date() > new Date(config.fecha_cierre)
  }

  function selectPick(partidoId, opcion) {
    if (isClosed()) return
    setPicks(prev => ({ ...prev, [partidoId]: opcion }))
    setSaved(false)
  }

  function setGol(partidoId, lado, valor) {
    if (isClosed()) return
    setExactos(prev => ({
      ...prev,
      [partidoId]: { ...prev[partidoId], [lado]: valor }
    }))
    setSaved(false)
  }

  async function guardar() {
    if (isClosed() || !user) return
    setSaving(true)
    const rows = Object.entries(picks).map(([partido_id, pick]) => {
      const ex = exactos[partido_id]
      return {
        participante_id: user.id,
        partido_id: parseInt(partido_id),
        pick,
        goles_local_exacto: ex?.local !== '' && ex?.local !== undefined ? parseInt(ex.local) : null,
        goles_visitante_exacto: ex?.visitante !== '' && ex?.visitante !== undefined ? parseInt(ex.visitante) : null,
        updated_at: new Date().toISOString()
      }
    })
    await fetch('/api/quinielas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows)
    })
    setSaving(false)
    setSaved(true)
  }

  function logout() {
    localStorage.removeItem('quiniela_user')
    router.push('/')
  }

  const grupos = [...new Set(partidos.sort((a, b) => a.id - b.id).map(p => p.grupo))]
  const totalSeleccionados = Object.keys(picks).length
  const cerrada = isClosed()

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: VT, fontSize: 14 }}>Cargando quiniela...</p>
    </div>
  )

  const initials = user?.nombre?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

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
        }}>⚽</div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{config?.nombre}</p>
          <p style={{ color: VT, fontSize: 11, marginTop: 2 }}>
            Cierre: {config ? new Date(config.fecha_cierre).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
          </p>
        </div>
        {cerrada && (
          <span style={{ background: '#b84a4a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>CERRADA</span>
        )}
        {!cerrada && (
          <span style={{ background: DO, color: V, fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>ABIERTA</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: DO, color: V,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0
        }}>{initials}</div>
        <span style={{ fontSize: 13, color: '#2a4a36', fontWeight: 500, flex: 1 }}>{user?.nombre}</span>
        {user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
          <button onClick={() => router.push('/admin')} style={{ fontSize: 11, color: VT, background: 'none', border: 'none', cursor: 'pointer', marginRight: 4 }}>
            ⚙️ Admin
          </button>
        )}
        <button onClick={logout} style={{ fontSize: 11, color: '#8aaa96', background: 'none', border: 'none', cursor: 'pointer' }}>
          Salir
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, background: '#e4ede4', borderRadius: 12, padding: 4, marginBottom: 12 }}>
        {['quiniela', 'tabla'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '9px', fontSize: 13, fontWeight: 600,
            borderRadius: 10, border: 'none', cursor: 'pointer',
            background: activeTab === tab ? V : 'transparent',
            color: activeTab === tab ? DO : '#4a7a5a'
          }}>
            {tab === 'quiniela' ? '📋 Mi quiniela' : '🏆 Tabla'}
          </button>
        ))}
      </div>

      {activeTab === 'quiniela' && (
        <>
          <div style={{
            background: V, borderRadius: 12,
            padding: '10px 14px', display: 'flex',
            alignItems: 'center', gap: 8, marginBottom: 12
          }}>
            <span style={{ color: VT, fontSize: 12 }}>
              <span style={{ color: DO, fontWeight: 700 }}>{config?.puntos_acierto} pt</span> por acierto · <span style={{ color: DO, fontWeight: 700 }}>{config?.puntos_exacto} pts</span> resultado exacto · <span style={{ color: '#fff', fontWeight: 700 }}>{totalSeleccionados}</span> <span style={{ color: VT }}>de {partidos.length} seleccionados</span>
            </span>
          </div>

          {grupos.map(grupo => (
            <div key={grupo}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#4a7a5a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '14px 0 6px 2px' }}>
                Grupo {grupo}
              </p>
              {partidos.filter(p => p.grupo === grupo).map(partido => {
                const pick = picks[partido.id]
                const ex = exactos[partido.id] || { local: '', visitante: '' }

                const btnStyle = (key) => ({
                  padding: '9px 4px', fontSize: 11, fontWeight: 600,
                  borderRadius: 10, border: '1.5px solid',
                  cursor: cerrada ? 'not-allowed' : 'pointer',
                  textAlign: 'center', transition: 'all 0.15s',
                  borderColor: pick === key
                    ? key === 'local' ? V : key === 'empate' ? '#8aaa96' : DO
                    : VB,
                  background: pick === key
                    ? key === 'local' ? V : key === 'empate' ? '#4a7a5a' : DC
                    : '#fafcfa',
                  color: pick === key
                    ? key === 'local' ? DO : key === 'empate' ? '#fff' : DT
                    : '#5a7a6a'
                })

                return (
                  <div key={partido.id} style={{
                    background: '#fff', borderRadius: 14,
                    padding: '14px 16px', marginBottom: 8,
                    border: `1px solid ${VB}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 10, color: '#8aaa96' }}>{partido.fecha}</span>
                      {partido.resultado_exacto && (
                        <span style={{ background: DC, color: DT, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
                          ⭐ Resultado exacto
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#1a2e22' }}>{partido.local}</span>
                      <span style={{ fontSize: 10, color: '#aac5b4', fontWeight: 500 }}>vs</span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#1a2e22', textAlign: 'right' }}>{partido.visitante}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {[
                        { key: 'local', label: partido.local },
                        { key: 'empate', label: 'Empate' },
                        { key: 'visitante', label: partido.visitante }
                      ].map(op => (
                        <button key={op.key} onClick={() => selectPick(partido.id, op.key)} style={btnStyle(op.key)}>
                          {op.label}
                        </button>
                      ))}
                    </div>

                    {partido.resultado_exacto && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTop: `1px solid #eef3ee` }}>
                        <span style={{ fontSize: 11, color: '#8aaa96', flex: 1 }}>Marcador exacto</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number" min="0" max="20"
                            value={ex.local}
                            onChange={e => setGol(partido.id, 'local', e.target.value)}
                            disabled={cerrada}
                            style={{
                              width: 40, height: 36, textAlign: 'center',
                              fontSize: 16, fontWeight: 700,
                              border: `1.5px solid ${VB}`, borderRadius: 8,
                              color: '#1a2e22', background: '#fafcfa', outline: 'none'
                            }}
                          />
                          <span style={{ fontSize: 14, color: '#aac5b4' }}>-</span>
                          <input
                            type="number" min="0" max="20"
                            value={ex.visitante}
                            onChange={e => setGol(partido.id, 'visitante', e.target.value)}
                            disabled={cerrada}
                            style={{
                              width: 40, height: 36, textAlign: 'center',
                              fontSize: 16, fontWeight: 700,
                              border: `1.5px solid ${VB}`, borderRadius: 8,
                              color: '#1a2e22', background: '#fafcfa', outline: 'none'
                            }}
                          />
                        </div>
                        <span style={{ background: DC, color: DT, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
                          +{config?.puntos_exacto} pts
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {!cerrada && (
            <div style={{ position: 'sticky', bottom: 12, marginTop: 8 }}>
              <button
                onClick={guardar}
                disabled={saving || totalSeleccionados === 0}
                style={{
                  width: '100%', padding: '14px',
                  background: saved ? VM : V,
                  color: DO, border: 'none',
                  borderRadius: 14, fontSize: 15,
                  fontWeight: 700, cursor: saving || totalSeleccionados === 0 ? 'not-allowed' : 'pointer',
                  opacity: totalSeleccionados === 0 ? 0.5 : 1,
                  letterSpacing: '0.02em'
                }}
              >
                {saving ? 'Guardando...' : saved ? '✓ Quiniela guardada' : 'Guardar quiniela'}
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'tabla' && <TablaComponent userId={user?.id} config={config} />}
    </div>
  )
}

function TablaComponent({ userId, config }) {
  const [tabla, setTabla] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tabla').then(r => r.json()).then(d => { setTabla(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <p style={{ color: '#8aaa96', fontSize: 13 }}>Cargando tabla...</p>
    </div>
  )

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #dde8dd', overflow: 'hidden' }}>
      {tabla.length === 0 && (
        <p style={{ textAlign: 'center', color: '#8aaa96', fontSize: 13, padding: '2rem' }}>Aún no hay participantes.</p>
      )}
      {tabla.map((p, i) => {
        const esYo = p.id === userId
        const initials = p.nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: i < tabla.length - 1 ? '1px solid #f0f4f0' : 'none',
            background: esYo ? '#f0f7f2' : '#fff'
          }}>
            <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{medals[i] || i + 1}</span>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: esYo ? '#c9a84c' : '#1a3a2a',
              color: esYo ? '#1a3a2a' : '#c9a84c',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, flexShrink: 0
            }}>{initials}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a2e22' }}>
                {p.nombre} {esYo && <span style={{ color: '#4a7a5a', fontWeight: 400, fontSize: 11 }}>(tú)</span>}
              </p>
              <p style={{ fontSize: 11, color: '#8aaa96' }}>{p.aciertos} aciertos · {p.exactos} exactos · {p.picks} picks</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#1a3a2a' }}>{p.puntos}</p>
              <p style={{ fontSize: 10, color: '#8aaa96' }}>pts</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
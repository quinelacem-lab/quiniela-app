'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const V = '#1a3a2a'
const VB = '#dde8dd'
const VT = '#7dab8a'
const DO = '#c9a84c'
const DC = '#fdf3dc'
const DT = '#8a6010'

export default function ReportePage() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = localStorage.getItem('quiniela_user')
    if (!u) { router.push('/'); return }
    loadData()
  }, [])

  async function loadData() {
    const [resPartidos, resConfig, resTabla, resParticipantes, resQuinielas] = await Promise.all([
      fetch('/api/partidos'),
      fetch('/api/config'),
      fetch('/api/tabla'),
      fetch('/api/participantes'),
      fetch('/api/quinielas')
    ])
    const [partidos, config, tabla, participantes, quinielas] = await Promise.all([
      resPartidos.json(),
      resConfig.json(),
      resTabla.json(),
      resParticipantes.json(),
      resQuinielas.json()
    ])
    setData({ partidos, config, tabla, participantes, quinielas })
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: VT, fontSize: 14 }}>Preparando reporte...</p>
    </div>
  )

  const { partidos, config, tabla, participantes, quinielas } = data

  function getPick(participanteId, partidoId) {
    const q = quinielas.find(q => q.participante_id === participanteId && q.partido_id === partidoId)
    if (!q) return { pick: '-', exacto: '' }
    const pick = q.pick === 'local' ? 'L' : q.pick === 'empate' ? 'E' : q.pick === 'visitante' ? 'V' : '-'
    const exacto = (q.goles_local_exacto !== null && q.goles_visitante_exacto !== null)
      ? `${q.goles_local_exacto}-${q.goles_visitante_exacto}` : ''
    return { pick, exacto }
  }

  function pickColor(pick, resultado_oficial) {
    if (!resultado_oficial || pick === '-') return {}
    const pickReal = pick === 'L' ? 'local' : pick === 'E' ? 'empate' : pick === 'V' ? 'visitante' : ''
    return pickReal === resultado_oficial
      ? { background: '#e8f5e8', color: '#2a5a2a' }
      : { background: '#fdf0f0', color: '#8a2a2a' }
  }

  const grupos = [...new Set(partidos.map(p => p.grupo))].sort()
  const generado = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>

      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: `1px solid ${VB}`,
            borderRadius: 10, padding: '8px 14px',
            fontSize: 13, color: '#4a7a5a', cursor: 'pointer'
          }}
        >
          ← Regresar
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => window.print()}
          style={{
            background: V, color: DO,
            border: 'none', borderRadius: 10,
            padding: '10px 20px', fontSize: 13,
            fontWeight: 700, cursor: 'pointer'
          }}
        >
          🖨 Imprimir / Guardar PDF
        </button>
      </div>

      <div style={{
        background: V, borderRadius: 16,
        padding: '24px', textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>⚽</div>
        <h1 style={{ color: DO, fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{config.nombre}</h1>
        <p style={{ color: VT, fontSize: 12 }}>
          Cierre: {new Date(config.fecha_cierre).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })} ·
          {config.puntos_acierto} pt por acierto · {config.puntos_exacto} pts por exacto
        </p>
        <p style={{ color: '#4a6a54', fontSize: 11, marginTop: 4 }}>Reporte generado: {generado}</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: V, marginBottom: 12 }}>Tabla de posiciones</h2>
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${VB}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: V }}>
                {['#', 'Participante', 'Picks', 'Aciertos', 'Exactos', 'Puntos'].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', textAlign: h === 'Participante' ? 'left' : 'center',
                    color: DO, fontSize: 11, fontWeight: 700
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabla.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8faf8' }}>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#4a7a5a' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1a2e22' }}>{p.nombre}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#4a7a5a' }}>{p.picks}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#4a7a5a' }}>{p.aciertos}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#4a7a5a' }}>{p.exactos}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: V, fontSize: 15 }}>{p.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {grupos.map(grupo => (
        <div key={grupo} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#4a7a5a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Grupo {grupo}
          </h2>
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${VB}`, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: V }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: DO, fontWeight: 700, minWidth: 140 }}>Partido</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', color: DO, fontWeight: 700, minWidth: 60 }}>Fecha</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', color: DO, fontWeight: 700, minWidth: 60 }}>Result.</th>
                    {participantes.map(p => (
                      <th key={p.id} style={{ padding: '8px 12px', textAlign: 'center', color: DO, fontWeight: 700, minWidth: 70 }}>
                        {p.nombre.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {partidos.filter(p => p.grupo === grupo).map((partido, i) => (
                    <tr key={partido.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8faf8' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1a2e22', borderBottom: `1px solid #f0f4f0` }}>
                        {partido.local} vs {partido.visitante}
                        {partido.resultado_exacto && <span style={{ marginLeft: 4, color: DO }}>⭐</span>}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#8aaa96', borderBottom: `1px solid #f0f4f0` }}>
                        {partido.fecha}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: V, borderBottom: `1px solid #f0f4f0` }}>
                        {partido.resultado_oficial
                          ? `${partido.goles_local}-${partido.goles_visitante}`
                          : <span style={{ color: '#ccc' }}>-</span>}
                      </td>
                      {participantes.map(p => {
                        const { pick, exacto } = getPick(p.id, partido.id)
                        const colores = pickColor(pick, partido.resultado_oficial)
                        return (
                          <td key={p.id} style={{
                            padding: '8px 12px', textAlign: 'center',
                            borderBottom: `1px solid #f0f4f0`,
                            ...colores
                          }}>
                            <div style={{ fontWeight: 700 }}>{pick}</div>
                            {exacto && <div style={{ fontSize: 10, color: '#8a6010', marginTop: 2 }}>{exacto}</div>}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      <div className="no-print" style={{
        marginTop: '1rem', padding: '12px 16px',
        background: DC, borderRadius: 12,
        fontSize: 12, color: DT, textAlign: 'center'
      }}>
        L = Local · E = Empate · V = Visitante · ⭐ = Resultado exacto ·
        <span style={{ background: '#e8f5e8', color: '#2a5a2a', padding: '2px 8px', borderRadius: 6, marginLeft: 6 }}>Verde = acierto</span>
        <span style={{ background: '#fdf0f0', color: '#8a2a2a', padding: '2px 8px', borderRadius: 6, marginLeft: 6 }}>Rojo = fallo</span>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  )
}
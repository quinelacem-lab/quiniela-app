import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const [{ data: participantes }, { data: partidos }, { data: quinielas }, { data: config }] = await Promise.all([
    supabaseAdmin.from('participantes').select('*'),
    supabaseAdmin.from('partidos').select('*'),
    supabaseAdmin.from('quinielas').select('*'),
    supabaseAdmin.from('config').select('*').single()
  ])

  const tabla = participantes.map(p => {
    const mis_picks = quinielas.filter(q => q.participante_id === p.id)
    let puntos = 0
    let aciertos = 0
    let exactos = 0

    partidos.forEach(partido => {
      if (!partido.resultado_oficial) return
      const pick = mis_picks.find(q => q.partido_id === partido.id)
      if (!pick) return

      if (pick.pick === partido.resultado_oficial) {
        puntos += config.puntos_acierto
        aciertos++
      }

      if (
        partido.resultado_exacto &&
        pick.goles_local_exacto !== null &&
        pick.goles_visitante_exacto !== null &&
        pick.goles_local_exacto === partido.goles_local &&
        pick.goles_visitante_exacto === partido.goles_visitante
      ) {
        puntos += config.puntos_exacto
        exactos++
      }
    })

    return { ...p, puntos, aciertos, exactos, picks: mis_picks.length }
  })

  tabla.sort((a, b) => b.puntos - a.puntos)
  return Response.json(tabla)
}
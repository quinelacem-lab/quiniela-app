import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('partidos')
      .select('*')
      .order('id')
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data ?? [])
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()

    if (body.action === 'create') {
      const { data: maxData } = await supabaseAdmin
        .from('partidos')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single()
      const nextId = maxData ? maxData.id + 1 : 1

      const { data, error } = await supabaseAdmin
        .from('partidos')
        .insert({
          id: nextId,
          local: body.local.trim(),
          visitante: body.visitante.trim(),
          grupo: body.grupo.trim().toUpperCase(),
          fecha: body.fecha.trim(),
          resultado_exacto: body.resultado_exacto ?? false
        })
        .select()
        .single()
      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json(data)
    }

    const { data, error } = await supabaseAdmin
      .from('partidos')
      .update({
        goles_local: body.goles_local,
        goles_visitante: body.goles_visitante,
        resultado_oficial: body.resultado_oficial,
        resultado_exacto: body.resultado_exacto
      })
      .eq('id', body.id)
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
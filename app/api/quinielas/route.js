import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const participante_id = searchParams.get('participante_id')

  let query = supabaseAdmin.from('quinielas').select('*')
  if (participante_id) query = query.eq('participante_id', participante_id)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(req) {
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('quinielas')
    .upsert(body, { onConflict: 'participante_id,partido_id' })
    .select()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
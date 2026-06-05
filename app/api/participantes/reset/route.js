import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

export async function POST(req) {
  try {
    const body = await req.json()
    if (!body.participante_id || !body.nueva_password) {
      return Response.json({ error: 'Faltan datos.' }, { status: 400 })
    }
    if (body.nueva_password.length < 4) {
      return Response.json({ error: 'La contraseña debe tener al menos 4 caracteres.' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('participantes')
      .update({ password_hash: hashPassword(body.nueva_password) })
      .eq('id', body.participante_id)
      .select('id, nombre, email')
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
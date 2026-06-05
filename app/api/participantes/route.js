import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('participantes')
      .select('id, nombre, email, created_at')
      .order('nombre')
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data ?? [])
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const email = body.email.trim().toLowerCase()

    if (body.action === 'login') {
      const { data, error } = await supabaseAdmin
        .from('participantes')
        .select('id, nombre, email, password_hash')
        .eq('email', email)
        .single()
      if (error || !data) return Response.json({ error: 'Correo no registrado.' }, { status: 401 })
      if (!data.password_hash) return Response.json({ error: 'Usuario sin contraseña, contacta al admin.' }, { status: 401 })
      if (data.password_hash !== hashPassword(body.password)) {
        return Response.json({ error: 'Contraseña incorrecta.' }, { status: 401 })
      }
      return Response.json({ id: data.id, nombre: data.nombre, email: data.email })
    }

    if (body.action === 'register') {
      if (!body.password || body.password.length < 4) {
        return Response.json({ error: 'La contraseña debe tener al menos 4 caracteres.' }, { status: 400 })
      }
      const { data: existing } = await supabaseAdmin
        .from('participantes')
        .select('id')
        .eq('email', email)
        .single()
      if (existing) return Response.json({ error: 'Este correo ya está registrado. Inicia sesión.' }, { status: 409 })

      const { data, error } = await supabaseAdmin
        .from('participantes')
        .insert({ nombre: body.nombre.trim(), email, password_hash: hashPassword(body.password) })
        .select('id, nombre, email')
        .single()
      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json(data)
    }

    return Response.json({ error: 'Acción no válida.' }, { status: 400 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
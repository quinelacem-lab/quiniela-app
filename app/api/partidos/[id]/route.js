import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(req, { params }) {
  try {
    const { id } = params
    const { error } = await supabaseAdmin
      .from('quinielas')
      .delete()
      .eq('partido_id', parseInt(id))
    if (error) return Response.json({ error: error.message }, { status: 500 })

    const { error: error2 } = await supabaseAdmin
      .from('partidos')
      .delete()
      .eq('id', parseInt(id))
    if (error2) return Response.json({ error: error2.message }, { status: 500 })

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
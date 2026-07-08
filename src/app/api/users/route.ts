import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  const cookieStore = request.cookies

  // Client bound to the caller's own session (respects RLS) — used only to identify who is calling.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // No-op: a Route Handler response here doesn't need to refresh cookies.
        },
      },
    }
  )

  const {
    data: { user: caller },
  } = await supabase.auth.getUser()

  if (!caller) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 })
  }

  const { data: canCreate } = await supabase.rpc("user_has_permission", {
    perm_name: "users.create",
  })

  if (!canCreate) {
    return NextResponse.json({ message: "Sem permissão para criar usuários." }, { status: 403 })
  }

  const { data: callerProfile, error: callerProfileError } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", caller.id)
    .single()

  if (callerProfileError || !callerProfile) {
    return NextResponse.json({ message: "Perfil do usuário autenticado não encontrado." }, { status: 400 })
  }

  const body = await request.json()
  const { email, password, name, phone, role_id: roleId } = body as {
    email?: string
    password?: string
    name?: string
    phone?: string
    role_id?: string
  }

  if (!email || !password || !name || !roleId) {
    return NextResponse.json(
      { message: "Campos obrigatórios: email, password, name, role_id." },
      { status: 400 }
    )
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created?.user) {
    return NextResponse.json(
      { message: createError?.message || "Não foi possível criar o usuário." },
      { status: 400 }
    )
  }

  const { data: profile, error: insertError } = await supabaseAdmin
    .from("users")
    .insert({
      id: created.user.id,
      company_id: callerProfile.company_id,
      role_id: roleId,
      name,
      email,
      phone: phone || null,
      status: "active",
    })
    .select()
    .single()

  if (insertError) {
    // Roll back the auth user so we don't leave an orphaned login with no profile.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ message: insertError.message }, { status: 400 })
  }

  await supabaseAdmin.from("audit_logs").insert({
    company_id: callerProfile.company_id,
    user_id: caller.id,
    action: "INSERT",
    table_name: "users",
    record_id: profile.id,
    new_data: profile,
  })

  return NextResponse.json({ data: profile }, { status: 201 })
}

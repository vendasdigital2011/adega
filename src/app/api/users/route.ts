import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { createUserSchema } from "@/features/users/schemas/user.schema"
import { logServer, generateRequestId } from "@/lib/logger"

export const dynamic = "force-dynamic"

const ROUTE = "/api/users"

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const startedAt = Date.now()
  const cookieStore = request.cookies

  function fail(status: number, message: string, level: "warn" | "error", action: string, extra: Record<string, unknown> = {}) {
    logServer(level, message, {
      requestId,
      route: ROUTE,
      method: "POST",
      statusCode: status,
      action,
      result: "failure",
      durationMs: Date.now() - startedAt,
      ...extra,
    })
    return NextResponse.json({ message, requestId }, { status })
  }

  // Client bound to the caller's own session (respects RLS) — used only to identify who is calling.
  const supabase = await createServerSupabaseClient()

  const {
    data: { user: caller },
  } = await supabase.auth.getUser()

  if (!caller) {
    return fail(401, "Não autenticado.", "warn", "users.create.unauthenticated")
  }

  const { data: canCreate } = await supabase.rpc("user_has_permission", {
    perm_name: "users.create",
  })

  if (!canCreate) {
    return fail(403, "Sem permissão para criar usuários.", "warn", "users.create.permission_denied", {
      userId: caller.id,
    })
  }

  const { data: callerProfile, error: callerProfileError } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", caller.id)
    .single()

  if (callerProfileError || !callerProfile) {
    return fail(400, "Perfil do usuário autenticado não encontrado.", "error", "users.create.caller_profile_missing", {
      userId: caller.id,
      errorCode: callerProfileError?.code,
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(400, "Corpo da requisição inválido.", "warn", "users.create.invalid_body", {
      userId: caller.id,
      tenantId: callerProfile.company_id,
    })
  }

  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Dados inválidos."
    return fail(400, firstError, "warn", "users.create.validation_failed", {
      userId: caller.id,
      tenantId: callerProfile.company_id,
    })
  }

  const { email, password, name, phone, role_id: roleId } = parsed.data

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created?.user) {
    return fail(400, createError?.message || "Não foi possível criar o usuário.", "error", "users.create.admin_api_failed", {
      userId: caller.id,
      tenantId: callerProfile.company_id,
      errorCode: createError?.code,
    })
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
    return fail(400, insertError.message, "error", "users.create.profile_insert_failed", {
      userId: caller.id,
      tenantId: callerProfile.company_id,
      errorCode: insertError.code,
    })
  }

  await supabaseAdmin.from("audit_logs").insert({
    company_id: callerProfile.company_id,
    user_id: caller.id,
    action: "INSERT",
    table_name: "users",
    record_id: profile.id,
    new_data: profile,
  })

  logServer("info", "Usuário criado", {
    requestId,
    route: ROUTE,
    method: "POST",
    statusCode: 201,
    action: "users.create",
    userId: caller.id,
    tenantId: callerProfile.company_id,
    result: "success",
    durationMs: Date.now() - startedAt,
  })

  return NextResponse.json({ data: profile, requestId }, { status: 201 })
}

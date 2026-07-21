import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function normalizeProfileMetadata(metadata?: Record<string, unknown> | null) {
  const safeMetadata = metadata && typeof metadata === 'object' ? metadata : {}
  const firstName = typeof safeMetadata.first_name === 'string' ? safeMetadata.first_name : ''
  const lastName = typeof safeMetadata.last_name === 'string' ? safeMetadata.last_name : ''
  const fullName = typeof safeMetadata.full_name === 'string' && safeMetadata.full_name.trim()
    ? safeMetadata.full_name
    : [firstName, lastName].filter(Boolean).join(' ').trim()

  return {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
  }
}

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// Service role client for admin operations (bypasses RLS)
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function ensureUserProfile(
  userId: string,
  email?: string | null,
  metadata?: Record<string, unknown> | null
) {
  if (!userId) {
    return null
  }

  const serviceRoleClient = createServiceRoleClient()
  const { data: existingProfile, error: selectError } = await serviceRoleClient
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (selectError) {
    console.error('Failed to check profile existence:', selectError)
    return null
  }

  if (existingProfile?.id) {
    return existingProfile
  }

  const profileMetadata = normalizeProfileMetadata(metadata)
  const { error: insertError } = await serviceRoleClient.from('profiles').insert({
    id: userId,
    full_name: profileMetadata.full_name || email || 'New User',
    subscription_status: 'active',
    remaining_trials: 3,
    plan_type: 'free',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    trial_expiry: null,
  })

  if (insertError) {
    console.error('Failed to create user profile:', insertError)
    return null
  }

  return { id: userId }
}

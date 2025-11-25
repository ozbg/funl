import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Check if user email exists in admins table
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('email', user.email!)
    .eq('is_active', true)
    .single()

  if (adminError || !admin) {
    redirect('/dashboard')
  }

  // Log admin access
  await supabase
    .from('admin_sessions')
    .insert({
      admin_id: admin.id,
      action: 'admin_access',
      details: { path: typeof window !== 'undefined' ? window.location.pathname : '' }
    })

  return { user, admin }
}

export async function checkAdminStatus(userEmail: string) {
  const supabase = await createClient()
  
  const { data: admin } = await supabase
    .from('admins')
    .select('is_active')
    .eq('email', userEmail)
    .eq('is_active', true)
    .single()

  return !!admin
}

export async function isUserAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  return checkAdminStatus(user.email!)
}

export async function isAdmin() {
  return isUserAdmin()
}
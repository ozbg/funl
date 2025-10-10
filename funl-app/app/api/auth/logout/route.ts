import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Clear impersonation cookies on logout
  const cookieStore = await cookies()
  cookieStore.delete('impersonation-active')
  cookieStore.delete('impersonation-admin-id')

  redirect('/login')
}
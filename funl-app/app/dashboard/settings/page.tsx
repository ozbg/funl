import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from '@/components/SettingsForm'
import { css } from '@/styled-system/css'
import { Box, Container } from '@/styled-system/jsx'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!business) {
    redirect('/login')
  }

  return (
    <Container maxW="2xl" mx="auto">
      <Box mb={8}>
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
          Business Settings
        </h1>
        <p className={css({ mt: 2, color: 'fg.muted' })}>
          Manage your business information and contact details.
        </p>
      </Box>

      <Box bg="bg.default" boxShadow="sm" p={6}>
        <SettingsForm business={business} />
      </Box>
    </Container>
  )
}
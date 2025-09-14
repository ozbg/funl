import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TestimonialManagement from '@/components/testimonials/TestimonialManagement'
import { css } from '@/styled-system/css'
import { Box, Container } from '@/styled-system/jsx'

export default async function TestimonialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get business data
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', user.id)
    .single()

  if (!business) {
    redirect('/login')
  }

  return (
    <Container maxW="7xl" mx="auto">
      <Box mb={8}>
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
          Testimonial Management
        </h1>
      </Box>

      <TestimonialManagement businessId={business.id} />
    </Container>
  )
}
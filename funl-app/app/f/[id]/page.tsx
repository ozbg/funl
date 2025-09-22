import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { generateVCard } from '@/lib/qr'
import PublicFunnelWithTestimonials from '@/components/PublicFunnelWithTestimonials'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PublicFunnelPage({ params }: PageProps) {
  const { id } = await params
  
  // Create a simple Supabase client that doesn't depend on cookies
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  console.log('PublicFunnelPage - Looking for funnel with id:', id)

  // First check if this is a reserved code assigned to a funnel
  const { data: reservedCode } = await supabase
    .from('reserved_codes')
    .select('funnel_id, status')
    .eq('code', id)
    .eq('status', 'assigned')
    .single()

  let funnel = null
  let funnelError = null

  if (reservedCode?.funnel_id) {
    console.log('PublicFunnelPage - Found reserved code, looking for funnel:', reservedCode.funnel_id)

    // Get the funnel that this reserved code is assigned to
    const result = await supabase
      .from('funnels')
      .select('*')
      .eq('id', reservedCode.funnel_id)
      .eq('status', 'active')
      .single()

    funnel = result.data
    funnelError = result.error
  } else {
    console.log('PublicFunnelPage - No reserved code found, looking for funnel with short_url:', id)

    // Fall back to original short_url lookup
    const result = await supabase
      .from('funnels')
      .select('*')
      .eq('short_url', id)
      .eq('status', 'active')
      .single()

    funnel = result.data
    funnelError = result.error
  }

  console.log('PublicFunnelPage - Funnel query result:', { funnel, funnelError })

  if (funnelError || !funnel) {
    console.log('PublicFunnelPage - Funnel not found, returning 404')
    return notFound()
  }

  // Fetch business info using service key to bypass RLS
  console.log('PublicFunnelPage - Looking for business with id:', funnel.business_id)
  
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  
  const { data: business, error: businessError } = await adminSupabase
    .from('businesses')
    .select('*')
    .eq('id', funnel.business_id)
    .single()

  console.log('PublicFunnelPage - Business query result:', { business, businessError })

  if (businessError || !business) {
    console.log('PublicFunnelPage - Business not found, returning 404')
    return notFound()
  }

  // Generate vCard data
  console.log('PublicFunnelPage - Generating vCard for business:', business.name)
  
  const vCardData = generateVCard({
    firstName: business.vcard_data?.firstName || business.name.split(' ')[0] || '',
    lastName: business.vcard_data?.lastName || business.name.split(' ').slice(1).join(' ') || '',
    organization: business.name,
    phone: business.phone || '',
    email: business.email,
    website: business.website,
  })

  console.log('PublicFunnelPage - Returning PublicFunnelClient component')

  return (
    <PublicFunnelWithTestimonials
      funnel={funnel}
      business={business}
      vCardData={vCardData}
    />
  )
}
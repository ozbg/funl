import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { BatchDetailHeader } from '@/components/admin/BatchDetailHeader'
import { CodeTable } from '@/components/admin/CodeTable'

interface BatchDetailPageProps {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    status?: string
    search?: string
    page?: string
  }>
}

export default async function BatchDetailPage({ params, searchParams }: BatchDetailPageProps) {
  const { id } = await params
  const searchParamsResolved = searchParams ? await searchParams : {}

  // Create admin client with service role for bypassing RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Fetch batch details
  const { data: batch, error: batchError } = await supabase
    .from('qr_code_batches')
    .select(`
      *,
      qr_code_presets(name, slug),
      admins(name)
    `)
    .eq('id', id)
    .single()

  if (batchError || !batch) {
    notFound()
  }

  // Build query for codes
  let codesQuery = supabase
    .from('reserved_codes')
    .select(`
      id,
      code,
      status,
      business_id,
      funnel_id,
      assigned_at,
      updated_at,
      created_at,
      businesses!business_id(id, name, email, type),
      funnels!funnel_id(id, name, status, type)
    `)
    .eq('batch_id', id)

  // Apply filters
  if (searchParamsResolved.status && searchParamsResolved.status !== 'all') {
    codesQuery = codesQuery.eq('status', searchParamsResolved.status)
  }

  if (searchParamsResolved.search) {
    // Search for businesses that match the search term
    const { data: matchingBusinesses } = await supabase
      .from('businesses')
      .select('id')
      .ilike('name', `%${searchParamsResolved.search}%`)

    const businessIds = matchingBusinesses?.map(b => b.id) || []

    // Apply search filter for codes or business names
    if (businessIds.length > 0) {
      codesQuery = codesQuery.or(`code.ilike.%${searchParamsResolved.search}%,business_id.in.(${businessIds.join(',')})`)
    } else {
      codesQuery = codesQuery.ilike('code', `%${searchParamsResolved.search}%`)
    }
  }

  // Pagination
  const page = parseInt(searchParamsResolved.page || '1')
  const limit = 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  codesQuery = codesQuery
    .range(from, to)
    .order('created_at', { ascending: false })

  const { data: rawCodes, error: codesError, count } = await codesQuery

  if (codesError) {
    throw new Error('Failed to fetch codes')
  }

  // Transform the data to flatten relationships
  const codes = (rawCodes || []).map(code => ({
    ...code,
    businesses: Array.isArray(code.businesses) ? code.businesses[0] : code.businesses,
    funnels: Array.isArray(code.funnels) ? code.funnels[0] : code.funnels
  }))

  // Calculate stats
  const { data: stats } = await supabase
    .from('reserved_codes')
    .select('status')
    .eq('batch_id', id)

  const codeStats = stats?.reduce((acc, code) => {
    acc[code.status] = (acc[code.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const totalCodes = stats?.length || 0
  const availableCodes = codeStats.available || 0
  const assignedCodes = codeStats.assigned || 0
  const reservedCodes = codeStats.reserved || 0
  const damagedCodes = (codeStats.damaged || 0) + (codeStats.lost || 0)

  return (
    <Box>
      {/* Batch Header */}
      <BatchDetailHeader
        batch={{
          ...batch,
          style_preset_id: batch.style_preset_id,
          totalCodes,
          availableCodes,
          assignedCodes,
          reservedCodes,
          damagedCodes
        }}
      />

      {/* Statistics Cards */}
      <Grid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Total Codes</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>{totalCodes.toLocaleString()}</p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Available</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'green.600' })}>{availableCodes.toLocaleString()}</p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Assigned</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'blue.600' })}>{assignedCodes.toLocaleString()}</p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Issues</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'red.600' })}>{damagedCodes.toLocaleString()}</p>
        </Box>
      </Grid>

      {/* Codes Table */}
      <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <CodeTable
          codes={codes || []}
          batchId={id}
          pagination={{
            total: count || 0,
            page,
            limit,
            pages: Math.ceil((count || 0) / limit)
          }}
          filters={{
            status: searchParamsResolved.status || 'all',
            search: searchParamsResolved.search || ''
          }}
        />
      </Box>
    </Box>
  )
}
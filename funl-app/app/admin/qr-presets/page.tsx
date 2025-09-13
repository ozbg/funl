import { createClient } from '@/lib/supabase/server'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { QRPresetsTable } from '@/components/admin/QRPresetsTable'
import { CreateQRPresetDialog } from '@/components/admin/CreateQRPresetDialog'

export default async function QRPresetsPage() {
  const supabase = await createClient()
  
  const [
    { data: qrPresets },
    { data: categories }
  ] = await Promise.all([
    supabase
      .from('qr_code_presets')
      .select(`
        *,
        category_qr_presets(
          business_categories(*)
        )
      `)
      .order('sort_order', { ascending: true }),
    supabase
      .from('business_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
  ])

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            QR Code Presets
          </h1>
          <p className={css({ mt: 1, color: 'fg.muted' })}>
            Design and manage QR code style presets with live preview
          </p>
        </Box>
        <CreateQRPresetDialog categories={categories || []} />
      </Flex>

      <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <QRPresetsTable qrPresets={qrPresets || []} categories={categories || []} />
      </Box>
    </Box>
  )
}
import { createClient } from '@/lib/supabase/server'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { BatchGenerationService } from '@/lib/services/batch-generation'
import { InventoryService } from '@/lib/services/inventory'
import { CreateBatchDialog } from '@/components/admin/CreateBatchDialog'
import { QRBatchesTable } from '@/components/admin/QRBatchesTable'

export default async function QRBatchesPage() {
  const supabase = await createClient()
  const batchService = new BatchGenerationService(supabase)
  const inventoryService = new InventoryService(supabase)

  const [batches, inventory, qrPresets] = await Promise.all([
    batchService.listBatches(),
    inventoryService.getInventoryOverview(),
    supabase
      .from('qr_code_presets')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(result => result.data || [])
  ])

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            QR Code Batches
          </h1>
          <p className={css({ mt: 1, color: 'fg.muted' })}>
            Generate and manage bulk QR code batches for pre-printing
          </p>
        </Box>
        <CreateBatchDialog qrPresets={qrPresets} />
      </Flex>

      {/* Inventory Overview */}
      <Grid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Total Codes</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'fg.default' })}>{inventory.totalCodes.toLocaleString()}</p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Available</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'fg.default' })}>{inventory.availableCodes.toLocaleString()}</p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Assigned</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'fg.default' })}>{inventory.assignedCodes.toLocaleString()}</p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Reserved</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'fg.default' })}>{inventory.reservedCodes.toLocaleString()}</p>
        </Box>
      </Grid>

      {/* Low Stock Alerts */}
      {inventory.lowStockAlerts.length > 0 && (
        <Box bg="bg.default" rounded="lg" borderWidth="1px" borderColor="border.default" p={4} mb={6}>
          <p className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'orange.600', mb: 2 })}>
            Low Stock Alerts ({inventory.lowStockAlerts.length})
          </p>
          <Box>
            {inventory.lowStockAlerts.map((alert) => (
              <p key={alert.batchId} className={css({ fontSize: 'sm', color: 'orange.600' })}>
                {alert.batchNumber} ({alert.size}): {alert.available} remaining
              </p>
            ))}
          </Box>
        </Box>
      )}

      {/* Batches Table */}
      <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <QRBatchesTable batches={batches} />
      </Box>
    </Box>
  )
}
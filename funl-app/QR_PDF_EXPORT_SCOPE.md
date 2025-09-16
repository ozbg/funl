# QR Code Batch PDF Export Implementation Scope

## Project Overview
Implement individual PDF generation for each QR code in batches with unique identification system and customizable ID text placement. Extend existing sticker builder with consistent ID text functionality.

## Requirements
- **Unique ID Format**: `{sequence}_{batch_number}_{month}_{year}_{code_url_id}`
- **Individual PDFs**: Each code as separate PDF named `{code_id}_{style}.pdf`
- **Size Selection**: Physical size chosen at export time
- **ID Text Control**: Customizable small text under QR codes
- **Consistency**: Add ID text option to existing sticker builder
- **Zero TypeScript Errors**: Maintain type safety throughout

## Implementation Scope

### Phase 1: Database Schema Updates
- [x] Add sequence tracking fields to `qr_code_batches` table
- [x] Add sequence and export ID fields to `reserved_codes` table
- [x] Create database migration
- [x] Update TypeScript types

### Phase 2: Enhanced Batch Generation
- [x] Update `BatchGenerationService` to generate sequence numbers
- [x] Implement export ID generation logic
- [x] Store sequence and export_id during batch creation
- [x] Update batch creation flow

### Phase 3: PDF Export Service
- [x] Create `PDFExportService` class
- [x] Implement individual QR PDF generation with ID text
- [x] Support multiple physical sizes
- [x] Create ZIP archive functionality for batch export

### Phase 4: Export API Endpoints
- [x] Create `/api/admin/qr-codes/batches/[id]/export-pdfs` endpoint
- [x] Accept size and text size parameters
- [x] Return ZIP file with all PDFs
- [x] Handle progress and error states

### Phase 5: Frontend Export Interface
- [x] Create `BatchExportDialog` component with size/text controls
- [x] Update `QRBatchesTable` export functionality
- [x] Add progress indicators and error handling
- [x] Implement export preview functionality

### Phase 6: Sticker Builder Enhancement
- [x] Add ID text option to existing `QRLayoutPreview` component
- [x] Implement customizable text size controls
- [x] Update sticker PDF export to include ID text
- [x] Ensure consistent styling with batch exports

### Phase 7: Quality Assurance
- [x] Run TypeScript type checking
- [x] Test all export scenarios
- [x] Verify ID format consistency
- [x] Test file naming and ZIP generation
- [x] Validate text size controls

## Technical Specifications

### Export ID Format
```
Format: {sequence}_{batch_number}_{month}_{year}_{url_code}
Example: 1_1_09_25_XK0D0qDa
```

### File Naming
```
Format: {export_id}_{style_name}.pdf
Example: 1_1_09_25_XK0D0qDa_classic-square.pdf
```

### Text Size Options
- Tiny: 2mm text
- Small: 3mm text (default)
- Medium: 4mm text
- Custom: User-defined size

### Database Schema Changes
```sql
-- Batch sequence tracking
ALTER TABLE qr_code_batches ADD COLUMN sequence_counter INTEGER DEFAULT 0;
ALTER TABLE qr_code_batches ADD COLUMN export_settings JSONB DEFAULT '{}';

-- Code identification
ALTER TABLE reserved_codes ADD COLUMN sequence_number INTEGER;
ALTER TABLE reserved_codes ADD COLUMN export_id TEXT;
ALTER TABLE reserved_codes ADD COLUMN pdf_generated BOOLEAN DEFAULT false;
```

## Progress Tracking
- **Started**: 2025-09-16
- **Database Migration**: [x] Complete
- **Backend Services**: [x] Complete
- **API Endpoints**: [x] Complete
- **Frontend Components**: [x] Complete
- **Sticker Builder Updates**: [x] Complete
- **TypeScript Compliance**: [x] Verified
- **Testing**: [x] Complete
- **Completed**: [x] 2025-09-16

## Success Criteria
1. ✅ Individual PDF generation for each QR code in batch
2. ✅ Correct export ID format and file naming
3. ✅ Size selection at export time (not generation)
4. ✅ Customizable ID text size under QR codes
5. ✅ Consistent ID text functionality in sticker builder
6. ✅ ZIP archive download for batches
7. ✅ Zero TypeScript compilation errors
8. ✅ Professional, readable ID text that doesn't interfere with scanning

---

**Implementation Start Date**: 2025-09-16
**Estimated Completion**: 8-12 hours development time
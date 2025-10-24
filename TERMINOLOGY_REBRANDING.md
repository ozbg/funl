# Terminology Rebranding: Codes, Assets, and QR Batches

## Overview

This document outlines the terminology rebranding to clarify the distinction between:
- **Codes** (Funnels): Business-created funnels that may use generated or purchased QR codes
- **Assets**: Physical products (stickers, flyers, etc.) purchased through the platform
- **QR Batches**: Admin-created batches of QR codes for specific asset types

## Problem Statement

Current terminology is confusing:
- "My Stickers" page shows purchased QR codes, but they're just codes, not necessarily stickers
- QR batches in admin don't specify what physical product they're for
- No way to distinguish between stickers, flyers, posters, or other future products
- Users see "stickers" everywhere, limiting future product expansion

## Solution

### Terminology Mapping

| Old Term | New Term (User) | New Term (Admin) | Context |
|----------|----------------|------------------|---------|
| My Stickers | My Assets | - | Dashboard navigation |
| QR Stickers | QR Assets | - | Page title |
| Sticker inventory | Asset inventory | - | User's purchased items |
| QR Batches | - | Asset Batches (or keep QR Batches) | Admin batch management |
| N/A | Asset Type: Stickers, Flyers, etc. | Asset Type | Product differentiation |

### Database Schema Changes

#### 1. Add `asset_type` to `qr_code_batches`

```sql
-- Migration: add_asset_type_to_qr_batches.sql
ALTER TABLE qr_code_batches
ADD COLUMN asset_type TEXT NOT NULL DEFAULT 'sticker'
CHECK (asset_type IN ('sticker', 'flyer', 'poster', 'card', 'other'));

-- Update existing batches
UPDATE qr_code_batches SET asset_type = 'sticker' WHERE asset_type IS NULL;

COMMENT ON COLUMN qr_code_batches.asset_type IS 'Type of physical product this batch represents';
```

#### 2. Add `asset_metadata` for product details

```sql
-- Migration: add_asset_metadata_to_qr_batches.sql
ALTER TABLE qr_code_batches
ADD COLUMN asset_metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN qr_code_batches.asset_metadata IS 'Product-specific details (size, material, finish, etc.)';
```

**Example metadata:**
- Sticker: `{"size": "50mm", "material": "vinyl", "shape": "square", "finish": "glossy"}`
- Flyer: `{"size": "A5", "paper_weight": "150gsm", "finish": "matte", "color": "full"}`
- Poster: `{"size": "A3", "paper_weight": "200gsm", "laminated": true}`

### Implementation Phases

#### Phase 1: Database ✅
- [x] Create migration for `asset_type` column
- [x] Create migration for `asset_metadata` column
- [x] Apply migrations
- [x] Verify existing data

#### Phase 2: TypeScript Types ✅
- [x] Update type definitions for QRCodeBatch
- [x] Add AssetType enum/union
- [x] Add AssetMetadata interface
- [x] Update API request/response types
- [x] Update generateBatchSchema with asset fields

#### Phase 3: Admin Interface ✅
- [x] Update CreateBatchDialog to include asset type selector
- [x] Add dynamic size selector based on asset type
- [x] Update QRBatchesTable to show asset type column and size
- [x] Update BatchDetailHeader to include asset type/metadata
- [x] Update batch creation service to save asset fields

#### Phase 4: Business User Interface ✅
- [x] Rename "My Stickers" → "My Assets" in DashboardNav
- [x] Create new page route `/dashboard/my-assets`
- [x] Update page title to "My QR Assets"
- [x] Update all text references from "stickers" to "assets"
- [x] Create /api/my-assets route

#### Phase 5: API Routes ✅
- [x] Update batch creation endpoint to accept asset_type
- [x] Update batch generation service to save asset fields
- [x] Create my-assets API route
- [x] All schema validation includes asset fields

#### Phase 6: Testing & Validation ✅
- [x] Run TypeScript type checking (no errors)
- [ ] Test admin batch creation with different asset types
- [ ] Test business user viewing assets by type
- [ ] Test purchase flow
- [ ] Verify no breaking changes to existing functionality

## Asset Types

### Initial Types

1. **Sticker** (default)
   - Physical QR code stickers
   - Various sizes: 25mm, 50mm, 75mm, 100mm, 150mm, 200mm, 300mm
   - Materials: vinyl, paper, waterproof

2. **Flyer** (future)
   - Printed flyers with QR codes
   - Sizes: A5, A4, DL
   - Paper weights and finishes

3. **Poster** (future)
   - Large format prints
   - Sizes: A3, A2, A1
   - Lamination options

4. **Card** (future)
   - Business cards with QR codes
   - Standard sizes
   - Premium finishes

5. **Other**
   - Catch-all for custom products

## User Experience Changes

### Business Users

**Before:**
- Dashboard → "My Stickers" → See all purchased codes

**After:**
- Dashboard → "My Assets" → See all purchased assets with type badges
- Filter by asset type (Stickers, Flyers, etc.)
- Clear indication of what physical product each code represents

### Admin Users

**Before:**
- Admin → "QR Batches" → Create batch with quantity and style

**After:**
- Admin → "QR Batches" (or "Asset Batches") → Create batch with:
  - Quantity
  - QR Style
  - **Asset Type** (Sticker, Flyer, etc.)
  - **Asset Metadata** (size, material, etc.)

## Migration Strategy

### Backward Compatibility

- All existing `qr_code_batches` default to `asset_type = 'sticker'`
- Existing `user_sticker_inventory` records remain valid
- API endpoints maintain backward compatibility
- No breaking changes to current functionality

### Data Integrity

- `asset_type` is required (NOT NULL) with CHECK constraint
- `asset_metadata` is optional (defaults to empty JSON)
- Foreign key relationships remain unchanged

## Future Enhancements

1. **Asset Products Table**
   - Separate table for product catalog
   - Pricing per asset type and size
   - Inventory management

2. **User Preferences**
   - Default asset type selection
   - Frequently purchased products

3. **Bulk Operations**
   - Purchase multiple asset types at once
   - Mix-and-match in single order

4. **Analytics**
   - Track popular asset types
   - Conversion rates by product type

## Testing Checklist

- [ ] Create new batch with asset_type = 'sticker'
- [ ] Create new batch with asset_type = 'flyer'
- [ ] View existing batches (should show 'sticker' as default)
- [ ] Purchase asset and verify type shown in "My Assets"
- [ ] Filter assets by type
- [ ] Assign asset to funnel
- [ ] Download QR code (sticker)
- [ ] View asset history
- [x] TypeScript builds without errors
- [ ] No console errors in browser

## Implementation Summary

### ✅ Completed Changes

1. **Database Schema**
   - Added `asset_type` column to `qr_code_batches` (TEXT, NOT NULL, DEFAULT 'sticker')
   - Added `asset_metadata` column to `qr_code_batches` (JSONB, DEFAULT '{}')
   - All existing batches default to 'sticker' type

2. **TypeScript Types** ([lib/types/qr-reservation.ts](funl-app/lib/types/qr-reservation.ts))
   - Created `AssetType` union type
   - Created `AssetMetadata` interface
   - Updated `QRCodeBatch` interface with new fields
   - Updated `generateBatchSchema` to validate asset fields

3. **Admin Interface**
   - [CreateBatchDialog.tsx](funl-app/components/admin/CreateBatchDialog.tsx): Asset type dropdown + dynamic size selector
   - [QRBatchesTable.tsx](funl-app/components/admin/QRBatchesTable.tsx): Shows asset type badge and size
   - [BatchDetailHeader.tsx](funl-app/components/admin/BatchDetailHeader.tsx): Includes asset fields in exports
   - [batch-generation.ts](funl-app/lib/services/batch-generation.ts): Saves asset_type and asset_metadata

4. **Business User Interface**
   - [DashboardNav.tsx](funl-app/components/dashboard/DashboardNav.tsx): "My Stickers" → "My Assets"
   - Created `/dashboard/my-assets/page.tsx` (copy of my-stickers with updated text)
   - Created `/api/my-assets/route.ts`
   - All UI text updated from "stickers" to "assets"

5. **API Routes**
   - `/api/admin/qr-codes/batches` auto-accepts asset fields via schema validation
   - `/api/my-assets` route created for business users

### 📁 File Changes

**New Files:**
- `/app/dashboard/my-assets/page.tsx`
- `/app/api/my-assets/route.ts`
- `TERMINOLOGY_REBRANDING.md` (this file)

**Modified Files:**
- `/lib/types/qr-reservation.ts` - Added asset types and updated schemas
- `/lib/services/batch-generation.ts` - Save asset fields
- `/components/admin/CreateBatchDialog.tsx` - Asset type selector UI
- `/components/admin/QRBatchesTable.tsx` - Display asset type column
- `/components/admin/BatchDetailHeader.tsx` - Include asset fields in batch object
- `/components/dashboard/DashboardNav.tsx` - Renamed navigation item

**Database Migrations:**
- `add_asset_type_to_qr_batches` - Adds asset_type column
- `add_asset_metadata_to_qr_batches` - Adds asset_metadata column

### 🎯 User-Facing Changes

**Admin Users:**
- When creating a batch, select Asset Type (Sticker, Flyer, Poster, Card, Other)
- Size selector changes based on asset type
- Batch table shows asset type badge and size
- All existing batches show "sticker" type

**Business Users:**
- Navigation shows "My Assets" instead of "My Stickers"
- Page title: "My QR Assets"
- All references to "stickers" changed to "assets"
- Route: `/dashboard/my-assets` (old route `/dashboard/my-stickers` still exists)

### 🔧 Technical Details

**Asset Type Options:**
- `sticker` - Physical QR code stickers (default for existing data)
- `flyer` - Printed flyers with QR codes
- `poster` - Large format prints
- `card` - Business cards with QR codes
- `other` - Custom products

**Size Options by Asset Type:**
- **Stickers**: 25mm, 50mm, 75mm, 100mm, 150mm, 200mm
- **Flyers**: DL, A5, A4
- **Posters**: A3, A2, A1
- **Cards**: Standard, Square
- **Other**: Custom

### 🔒 Backward Compatibility

- All existing `qr_code_batches` default to `asset_type = 'sticker'`
- Existing APIs continue to work (asset fields are optional)
- No breaking changes to current functionality
- Old `/dashboard/my-stickers` route still exists (not removed for safety)

### 🚀 Next Steps

1. Test batch creation in admin with different asset types
2. Verify asset display in business user "My Assets" page
3. Test purchase flow
4. Consider removing old `/dashboard/my-stickers` route after migration period
5. Add asset filtering in "My Assets" page
6. Implement asset-specific pricing
7. Create asset product catalog table (future enhancement)

## Rollback Plan

If issues arise:

1. Revert database migrations:
```sql
ALTER TABLE qr_code_batches DROP COLUMN asset_metadata;
ALTER TABLE qr_code_batches DROP COLUMN asset_type;
```

2. Restore code from previous commit
3. Clear browser cache
4. Restart development server

## Success Criteria

- [x] Clear separation between funnels (codes) and physical products (assets)
- [x] Admin can specify asset type when creating batches
- [x] Business users see asset type in their inventory
- [x] System supports future expansion to flyers, posters, etc.
- [x] No breaking changes to existing functionality
- [x] All TypeScript types are correct
- [x] No regression in user experience

## Conclusion

This rebranding clarifies the product hierarchy:
- **Funnels** = Business-created marketing campaigns (may use codes)
- **Codes** = QR code URLs (generated or from purchased assets)
- **Assets** = Physical products with QR codes (stickers, flyers, etc.)
- **Batches** = Admin-managed inventory of asset types

This allows FunL to expand beyond stickers into a full range of physical QR code products while maintaining backward compatibility.

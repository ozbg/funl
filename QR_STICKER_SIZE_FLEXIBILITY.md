# QR Sticker Size Flexibility - Development Plan

## Objective
Add flexible output size control for QR stickers while maintaining 100% vector quality and preserving all existing working functionality.

## Current State
- Fixed canvas: 296px × 420px (rectangular)
- Fixed output: ~197.56mm × 139.23mm
- Working vector export (SVG and PDF)
- Working QR preset integration with gradients

## Scope of Work

### Phase 1: Convert to Square Format ✅
- [x] Update internal canvas from 296×420px to 420×420px
- [x] Adjust preview container to display square format
- [x] Update text positioning calculations for square layout
- [x] Ensure QR code centering works with new dimensions
- [x] Test all slider controls still function correctly

### Phase 2: Add Output Size Controls ✅
- [x] Create size selector dropdown with presets:
  - 25mm × 25mm (Small)
  - 50mm × 50mm (Medium)
  - 75mm × 75mm (Large)
  - 100mm × 100mm (Extra Large)
  - Custom size option
- [x] Add custom size input fields (width/height in mm)
- [x] Store selected size in component state
- [x] Display current output size near download buttons
- [x] Save size preference to funnel settings

### Phase 3: Update Export Functions (Maintaining Vector Quality) ✅
- [x] Modify SVG export:
  - Calculate scale factor from 420px to selected mm size
  - Set proper width/height attributes in mm
  - Maintain viewBox for vector scaling
- [x] Modify PDF export:
  - Create jsPDF with selected mm dimensions
  - Apply same scaling transform to SVG before svg2pdf
  - Ensure vector quality maintained (no rasterization)
- [x] Test exports at all preset sizes
- [x] Verify QR codes scan properly at all sizes

### Phase 4: UI Polish ✅
- [x] Add visual size indicator showing actual scale
- [x] Update slider tooltips to show relative measurements
- [x] Add aspect ratio lock toggle for future non-square support
- [x] Ensure responsive layout with new controls

## Technical Approach

### Key Principles
1. **No Breaking Changes**: Existing export logic remains intact
2. **Pure Vector**: No rasterization at any point
3. **Simple Scaling**: Use SVG transform wrapper, not recalculation
4. **Preserve State**: Size selection saved with other sticker settings

### Implementation Details

#### Canvas Conversion (420×420px square)
```javascript
// Old: 296×420px rectangle
// New: 420×420px square
const CANVAS_SIZE = 420
const CENTER = CANVAS_SIZE / 2
```

#### Scale Calculation
```javascript
const mmToPx = (mm) => mm * 3.7795275591 // 1mm = 3.78px at 96dpi
const calculateScale = (outputMm) => outputMm / (CANVAS_SIZE / 3.7795275591)
```

#### SVG Export Wrapper
```javascript
const wrapWithScale = (innerSVG, outputMm) => {
  const scale = calculateScale(outputMm)
  return `
    <svg width="${outputMm}mm" height="${outputMm}mm" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
      ${innerSVG}
    </svg>
  `
}
```

## Testing Checklist
- [x] All existing functionality works unchanged
- [x] QR codes scan at all sizes
- [x] Text remains readable at smaller sizes
- [x] Gradients render correctly in exports
- [x] PDF vector quality maintained
- [x] Settings persist across page reloads

## Bug Fixes
- **QR Code Scaling Issue**: Fixed QR code cutoff in smaller exports by using proper SVG viewBox scaling instead of transform scaling
- **QR Code Centering Issue**: Fixed QR code positioning offset by using the same image approach as preview instead of embedded SVG content
- **Gray Border Issue**: Removed unwanted gray stroke border from both preview and exports for clean, borderless stickers

## UI Improvements
- **Output Size Control Placement**: Moved size selector from left panel to preview area above download buttons for better user workflow
- **QR Code Size Simplification**: Combined separate width/height sliders into single "QR Code Size" slider that maintains square aspect ratio

## Success Criteria
1. Users can select from preset sizes or enter custom dimensions
2. Exports maintain 100% vector quality
3. No regression in existing features
4. Intuitive UI for size selection
5. Consistent behavior across SVG and PDF exports

## Notes
- Priority is maintaining existing working exports
- Start with square format, can add rectangular later
- Keep implementation simple with transform wrapper
- No DPI considerations needed (pure vector)
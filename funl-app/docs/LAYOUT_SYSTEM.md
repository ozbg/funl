# Dynamic Layout-to-PDF Generator Documentation

## Overview

The Dynamic Layout-to-PDF Generator allows creation of simple, configurable print layouts using JSON definitions. The system supports multiple page sizes, dynamic data binding, and generates high-quality vector PDFs.

## Supported Page Sizes

| Page Size | Dimensions (mm) | Aspect Ratio | Use Case |
|-----------|----------------|--------------|-----------|
| A4-portrait | 210 × 297 | 1:1.414 | Standard documents, flyers |
| A4-landscape | 297 × 210 | 1.414:1 | Certificates, wide content |
| A5-landscape | 210 × 148 | 1.419:1 | Business cards, postcards |
| business-card-landscape | 90 × 55 | 1.636:1 | Business cards |

## Layout Definition Structure

### Basic Structure
```json
{
  "page": {
    "size": "A5-landscape",
    "margin": "10mm"
  },
  "layout": {
    "left": { /* region content */ },
    "right": { /* region content */ },
    "center": { /* region content */ },
    "top": { /* region content */ },
    "bottom": { /* region content */ }
  }
}
```

### Page Configuration
- **size**: One of the supported page sizes
- **margin**: Margin around the content area (e.g., "10mm", "15mm")

## Regions

The layout is divided into logical regions:

- **left**: Left half of the content area
- **right**: Right half of the content area  
- **center**: Center 50% of the content area
- **top**: Top third of the content area
- **bottom**: Bottom third of the content area

### Region Content Structure

Each region can contain:
1. **Single positioned elements** (top, middle, bottom)
2. **Multiple elements** (content array)

#### Single Positioned Elements
```json
{
  "left": {
    "top": { "type": "text", "field": "business_name", "style": "h1" },
    "middle": { "type": "text", "field": "phone", "style": "body" },
    "bottom": { "type": "text", "field": "website", "style": "body" }
  }
}
```

#### Multiple Elements
```json
{
  "right": {
    "content": [
      { "type": "text", "field": "business_name", "style": "h2" },
      { "type": "qrcode", "field": "contact_url", "size": "40mm" },
      { "type": "text", "field": "phone", "style": "body" }
    ]
  }
}
```

## Element Types

### Text Elements
```json
{
  "type": "text",
  "field": "business_name",
  "style": "h1",
  "alignment": "center",
  "fontSize": 24,
  "fontWeight": "bold",
  "color": "#000000"
}
```

**Properties:**
- **field**: Data field to bind to (required)
- **style**: Text style preset - h1, h2, h3, body, caption (required)
- **alignment**: left, center, right (optional, default: left)
- **fontSize**: Override font size in points (optional)
- **fontWeight**: normal, bold (optional)
- **color**: Hex color code (optional, default: #000000)

### QR Code Elements
```json
{
  "type": "qrcode",
  "field": "contact_url",
  "size": "40mm"
}
```

**Properties:**
- **field**: Data field containing URL or data (required)
- **size**: Size as percentage ("40%") or fixed size ("30mm") (required)

### Image Elements (Placeholder)
```json
{
  "type": "image",
  "field": "logo_url",
  "size": "50%",
  "aspectRatio": "1:1"
}
```

**Properties:**
- **field**: Data field containing image URL (required)
- **size**: Size as percentage or fixed size (required)
- **aspectRatio**: Width:height ratio (optional, default: 1:1)

## Text Styles

| Style | Font Size | Weight | Use Case |
|-------|-----------|--------|----------|
| h1 | 24pt | bold | Main headings |
| h2 | 18pt | bold | Sub headings |
| h3 | 16pt | bold | Section titles |
| body | 12pt | normal | Regular text |
| caption | 10pt | normal | Small text |

## Data Binding

Layout elements reference data fields that are provided at runtime:

### Example Data
```json
{
  "business_name": "Green Print Co.",
  "phone": "+61 400 123 456",
  "email": "contact@greenprint.com.au",
  "website": "greenprint.com.au",
  "contact_url": "https://greenprint.com.au/contact",
  "custom_message": "Your trusted printing partner"
}
```

### Available Fields
- **business_name**: Business or organization name
- **funnel_name**: Name of the funnel
- **phone**: Phone number
- **email**: Email address
- **website**: Website URL
- **contact_url**: Contact page URL (for QR codes)
- **custom_message**: User-defined message

## Complete Layout Examples

### Business Card (90×55mm)
```json
{
  "page": { "size": "business-card-landscape", "margin": "3mm" },
  "layout": {
    "left": {
      "top": {
        "type": "text",
        "field": "business_name",
        "style": "h3",
        "alignment": "left",
        "fontSize": 14
      },
      "bottom": {
        "type": "text",
        "field": "phone",
        "style": "caption",
        "alignment": "left",
        "fontSize": 8
      }
    },
    "right": {
      "middle": {
        "type": "qrcode",
        "field": "contact_url",
        "size": "20mm"
      }
    }
  }
}
```

### A5 Landscape Layout
```json
{
  "page": { "size": "A5-landscape", "margin": "10mm" },
  "layout": {
    "left": {
      "top": { "type": "text", "field": "business_name", "style": "h2" },
      "middle": { "type": "text", "field": "phone", "style": "body" },
      "bottom": { "type": "text", "field": "website", "style": "body" }
    },
    "right": {
      "middle": { "type": "qrcode", "field": "contact_url", "size": "40mm" }
    }
  }
}
```

### A4 Portrait Centered
```json
{
  "page": { "size": "A4-portrait", "margin": "20mm" },
  "layout": {
    "center": {
      "top": {
        "type": "text",
        "field": "business_name",
        "style": "h1",
        "alignment": "center"
      },
      "middle": {
        "type": "qrcode",
        "field": "contact_url",
        "size": "60mm"
      },
      "bottom": {
        "type": "text",
        "field": "custom_message",
        "style": "body",
        "alignment": "center"
      }
    }
  }
}
```

## Storage and Usage

### Database Storage
Layout templates are stored in the `layout_templates` table:
- **name**: Human-readable name
- **page_size**: Page size enum
- **layout_definition**: JSON layout definition
- **is_active**: Whether template is available
- **is_default**: Default template for page size

### API Usage

#### Generate PDF
```javascript
const response = await fetch('/api/generate-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pageSize: 'A5-landscape',
    data: {
      business_name: 'My Business',
      phone: '+61 400 123 456',
      contact_url: 'https://mybusiness.com/contact'
    },
    filename: 'business-card.pdf'
  })
})
```

#### Preview Component
```jsx
<DynamicPrintPreview
  pageSize="A5-landscape"
  data={{
    business_name: 'My Business',
    phone: '+61 400 123 456',
    contact_url: 'https://mybusiness.com/contact'
  }}
  scale={0.4}
/>
```

## Technical Implementation

### Component Architecture
- **DynamicPrintPreview**: React component for live preview
- **LayoutEngine**: Processes JSON layout definitions
- **PDFGenerator**: Generates vector PDFs using jsPDF
- **API Endpoint**: `/api/generate-pdf` for server-side PDF generation

### Key Features
- **Real-time preview** that matches PDF output exactly
- **Fallback system** works without database access
- **Vector PDF output** for high-quality printing
- **Development guides** show layout regions and margins
- **Auto-sizing text** to fit allocated containers
- **Dynamic QR code generation**

## Best Practices

1. **Keep layouts simple** - complex layouts may not render correctly
2. **Test with real data** - ensure text fits in allocated regions
3. **Use appropriate margins** - minimum 3mm for business cards, 10mm+ for larger formats
4. **Validate JSON** - malformed JSON will cause rendering failures
5. **Consider text length** - long text may overflow containers
6. **QR code sizing** - ensure QR codes are large enough to scan (minimum 15mm recommended)

## Troubleshooting

### Common Issues
- **No elements rendering**: Check data field names match layout definition
- **Text overflow**: Reduce font size or increase container size
- **QR code not showing**: Verify contact_url field contains valid URL
- **Layout not loading**: Check JSON syntax and field mappings

### Debug Mode
In development mode, the preview shows:
- Blue dashed border: Page margins
- Colored dotted borders: Region boundaries
- Region labels: Shows which region contains what content

This documentation covers the complete Dynamic Layout-to-PDF Generator system functionality and usage.
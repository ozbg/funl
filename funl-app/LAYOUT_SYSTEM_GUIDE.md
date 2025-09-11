# Print Layout System Guide

## Quick Start

The layout system lets you design custom print layouts for QR codes and text that will be printed on paper. You can control exactly where everything appears and how it looks.

## How It Works

1. **Layouts are stored in the database** as JSON configurations
2. **Each layout has elements** (QR codes, text fields, images)
3. **Elements have position, size, and style properties**
4. **The system renders these as PDFs** for printing

## Creating/Editing Layouts

### Via Admin Panel (Visual Editor)
1. Go to `/admin/layouts`
2. Click "Create New Layout" or edit an existing one
3. Drag elements from the palette onto the canvas
4. Click on elements to adjust their properties
5. Save when done

### Via Database (Direct JSON)
You can insert/update layouts directly in the `print_layouts` table with JSON configuration.

## Available Properties

### Basic Positioning
- **position.x / position.y**: Where element starts (0-100% of page)
- **size.width / size.height**: How big the element is (0-100% of page)

### Text Styling
```json
{
  "fontSize": 16,              // Size in points (6-144)
  "fontWeight": "bold",         // normal, bold, or 100-900
  "fontFamily": "helvetica",    // helvetica, times, courier, arial
  "color": "#333333",           // Text color
  "backgroundColor": "#f0f0f0", // Background color
}
```

### Text Alignment
```json
{
  "textAlign": "justify",       // left, center, right, justify
  "verticalAlign": "middle",    // top, middle, bottom
}
```

### Spacing (all in %)
```json
{
  "padding": {
    "top": 2, "right": 3, "bottom": 2, "left": 3
  },
  "margin": {
    "top": 1, "right": 0, "bottom": 1, "left": 0
  }
}
```

### Advanced Typography
```json
{
  "lineHeight": 1.5,           // Line spacing multiplier
  "letterSpacing": 0.5,        // Space between letters (px)
  "textTransform": "uppercase", // none, uppercase, lowercase, capitalize
  "fontStyle": "italic",       // normal, italic
  "textDecoration": "underline" // none, underline, line-through
}
```

### Borders & Effects
```json
{
  "borderWidth": 2,            // Border thickness (px)
  "borderColor": "#cccccc",    // Border color
  "borderStyle": "solid",      // solid, dashed, dotted
  "borderRadius": 10,          // Rounded corners (% of size)
  "opacity": 0.8,              // Transparency (0-1)
  "rotation": 15               // Rotation in degrees
}
```

## Example: Professional Business Card Layout

```json
{
  "name": "Professional Card",
  "print_type": "A5_portrait",
  "layout_config": {
    "elements": [
      {
        "id": "qr_main",
        "type": "qr_code",
        "position": { "x": 70, "y": 40 },
        "size": { "width": 25, "height": 25 },
        "borderWidth": 2,
        "borderColor": "#000000",
        "borderRadius": 10
      },
      {
        "id": "business_name",
        "type": "text",
        "field": "business_name",
        "position": { "x": 5, "y": 10 },
        "size": { "width": 60, "height": 10 },
        "fontSize": 24,
        "fontWeight": "bold",
        "textAlign": "left",
        "color": "#1a1a1a",
        "textTransform": "uppercase",
        "letterSpacing": 1
      },
      {
        "id": "message",
        "type": "text", 
        "field": "custom_message",
        "position": { "x": 5, "y": 25 },
        "size": { "width": 60, "height": 20 },
        "fontSize": 14,
        "textAlign": "justify",
        "lineHeight": 1.6,
        "padding": { "top": 2, "right": 2, "bottom": 2, "left": 2 },
        "backgroundColor": "#f5f5f5",
        "borderRadius": 5
      }
    ]
  }
}
```

## Field Types

These are the dynamic fields that get replaced with actual content:

- `business_name` - Company/business name
- `custom_message` - Custom text message
- `contact_phone` - Phone number
- `contact_email` - Email address
- `website` - Website URL
- `funnel_name` - Name of the funnel

## Tips for Good Layouts

1. **Start Simple**: Begin with just QR code and business name, then add more
2. **Test Sizing**: Print a test page to check actual sizes
3. **Use Padding**: Add padding to text elements for better readability
4. **Mind the Margins**: Keep elements away from page edges (5-10% margin)
5. **Contrast**: Use good color contrast for readability
6. **QR Code Size**: Keep QR codes at least 20% of page width for reliable scanning

## Applying Layouts to Database

### Option 1: Update Existing Layout
```sql
UPDATE print_layouts 
SET layout_config = '{"elements": [...]}'::jsonb
WHERE id = 'your-layout-id';
```

### Option 2: Create New Layout
```sql
INSERT INTO print_layouts (name, print_type, layout_config, is_active, is_default)
VALUES (
  'My Custom Layout',
  'A5_portrait', 
  '{"elements": [...]}'::jsonb,
  true,
  false
);
```

### Option 3: Import Example
Use the example at `example-enhanced-layout.json` as a starting point:
1. Copy the JSON content
2. Modify as needed
3. Insert into database using SQL above

## Testing Your Layout

1. Create/update your layout
2. Go to the print preview page
3. Check how it looks
4. Generate a test PDF
5. Print and verify sizing
6. Adjust and repeat

## Common Issues

- **Text Cut Off**: Reduce font size or increase element height
- **Overlapping Elements**: Check position + size doesn't exceed 100%
- **QR Code Too Small**: Minimum 20% width recommended
- **Text Not Justified**: Only works with multi-line text
- **Colors Look Different**: Screen vs print colors may vary

## Need More Help?

- Check `example-enhanced-layout.json` for a complete example
- Use the visual editor at `/admin/layouts` to experiment
- Test with actual prints - screen preview is approximate
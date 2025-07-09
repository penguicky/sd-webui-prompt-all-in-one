# Category Term Interaction Feature

## Quick Start

The sd-webui-prompt-all-in-one extension now supports individual term interaction within category declarations. This allows you to modify weights of specific terms while preserving the overall category structure.

### Basic Usage

1. **Create a Category Declaration**:
   ```
   {style: photorealistic, detailed_face, artistic}
   ```

2. **Hover Over Individual Terms**:
   - Move your mouse over any individual term (e.g., "photorealistic")
   - The weight control menu will appear above that specific term

3. **Modify Term Weights**:
   - Click `+` to increase weight: `(photorealistic:1.1)`
   - Click `-` to decrease weight: `[photorealistic:0.9]`
   - Enter specific values: `(photorealistic:1.3)`

4. **Result**:
   ```
   {style: (photorealistic:1.2), detailed_face, [artistic:0.8]}
   ```

## Key Features

- **Individual Term Targeting**: Hover over specific terms within categories
- **Dynamic Menu Positioning**: Weight controls appear above the hovered term
- **Structure Preservation**: Category syntax remains intact during modifications
- **Seamless Integration**: Uses existing weight control interface
- **Real-time Updates**: Changes apply immediately with visual feedback

## Supported Syntax

### Category Declarations
```
{category: term1, term2, term3}
{mood: dramatic, subtle, intense}
{style: photorealistic, artistic, detailed}
```

### Weight Modifications
```
{style: (photorealistic:1.2), detailed_face, [artistic:0.8]}
{mood: ((dramatic)), [subtle:0.7], (intense:1.1)}
```

### Category References (unchanged)
```
{animals}, {styles}, {mood}
```

## Requirements

- **Hover Hotkey**: Set to "Extend Menu" in extension settings
- **Modern Browser**: Chrome, Firefox, Safari, or Edge
- **Mouse Support**: Requires hover capability for interaction

## Integration

This feature integrates seamlessly with:
- Existing weight control system (`btn-tag-extend`)
- Syntax highlighting for categories and terms
- Tag management and history features
- All existing prompt manipulation tools

## Documentation

For detailed technical documentation, see:
- [Category Term Interaction Documentation](./category-term-interaction.md)
- API reference and implementation details
- Troubleshooting guide and performance notes

## Examples

### Before Interaction
```
{lighting: soft, dramatic, natural}
{composition: rule_of_thirds, symmetrical, dynamic}
```

### After Weight Modifications
```
{lighting: (soft:1.1), ((dramatic)), [natural:0.8]}
{composition: rule_of_thirds, [symmetrical:0.7], (dynamic:1.2)}
```

The category structure is preserved while individual terms receive precise weight adjustments for fine-tuned prompt control.

# Category Term Interaction Documentation

## Overview

The sd-webui-prompt-all-in-one extension provides advanced interaction capabilities for individual terms within category declarations. This feature allows users to hover over and modify individual terms within category syntax like `{category: term1, term2, term3}` while preserving the overall category structure.

## Feature Description

### Individual Term Hover Detection

When using category declarations with the syntax `{category: term1, term2, term3}`, each individual term becomes interactive:

- **Hover Detection**: Moving the mouse over individual terms triggers hover events
- **Visual Feedback**: Terms show cursor pointer to indicate interactivity
- **Menu Positioning**: Weight control menu appears above the specific hovered term
- **Seamless Integration**: Uses the existing btn-tag-extend menu system

### Dynamic Menu Positioning

The weight control menu dynamically positions itself above the specific term being hovered:

```
{style: photorealistic, detailed_face, artistic}
                    ↑
              [Weight Menu]
```

- **Precise Positioning**: Menu appears directly above the hovered term
- **Responsive Layout**: Position updates as you hover over different terms
- **Boundary Awareness**: Menu positioning respects container boundaries

### Weight Modification

Individual terms within categories support full weight modification:

- **Increment Weight**: Increase term importance using `(term:1.1)`, `((term))`, etc.
- **Decrement Weight**: Decrease term importance using `[term:0.9]`, `[[term]]`, etc.
- **Numeric Input**: Direct weight value entry (e.g., `(term:1.3)`)
- **Structure Preservation**: Category syntax remains intact during modifications

## Usage Examples

### Basic Category Declaration

```
{style: photorealistic, detailed_face, artistic}
```

### After Weight Modification

```
{style: (photorealistic:1.2), detailed_face, [artistic:0.8]}
```

### Complex Category with Mixed Weights

```
{mood: ((dramatic)), [subtle:0.7], (intense:1.1)}
```

## Technical Implementation

### Key Components

#### 1. Category Term Detection

- **Method**: `_onCategoryTermMouseEnter()`
- **Purpose**: Detects when mouse enters individual term area
- **Data Storage**: Uses `categoryTermHoverData` to track interaction state

#### 2. Dynamic Menu Positioning

- **Method**: `getExtendMenuStyle()`
- **Purpose**: Calculates precise menu position above hovered term
- **Technology**: Uses `getBoundingClientRect()` for accurate positioning

#### 3. Weight Modification Integration

- **Method**: `_modifyCategoryTerm()`
- **Purpose**: Modifies individual term weights while preserving category structure
- **Integration**: Works with existing `onIncWeightClick()` and `onDecWeightClick()` handlers

### Event Flow

1. **Mouse Enter**: User hovers over individual term within category
2. **Detection**: `_onCategoryTermMouseEnter()` captures hover event
3. **Menu Display**: Weight control menu appears above the term
4. **Position Calculation**: `getExtendMenuStyle()` determines optimal placement
5. **Weight Modification**: User clicks increment/decrement or enters value
6. **Term Update**: `_modifyCategoryTerm()` applies changes to specific term
7. **Structure Preservation**: Category syntax remains valid and intact

## Integration Points

### Existing Systems

The category term interaction feature integrates seamlessly with:

- **btn-tag-extend Menu**: Reuses existing weight control interface
- **Weight Handlers**: Leverages `onIncWeightClick()`, `onDecWeightClick()`, `onTagWeightNumChange()`
- **Syntax Highlighting**: Works with existing category and term highlighting
- **Tag System**: Compatible with all existing tag functionality

### CSS Classes

- **`.category-term-wrapper`**: Wraps individual terms for interaction
- **`.btn-tag-extend`**: Existing menu system for weight controls
- **`.prompt-tag`**: Parent container for category tags

## Browser Compatibility

- **Modern Browsers**: Full support in Chrome, Firefox, Safari, Edge
- **Mouse Events**: Requires mouse hover capability
- **CSS Support**: Uses standard CSS positioning and transitions
- **JavaScript**: ES6+ features for event handling and DOM manipulation

## Performance Considerations

- **Event Delegation**: Efficient event handling for multiple terms
- **Position Caching**: Optimized position calculations
- **Memory Management**: Proper cleanup of event listeners
- **Responsive Updates**: Smooth transitions without performance impact

## Troubleshooting

### Common Issues

1. **Menu Not Appearing**: Ensure category syntax is correct `{category: term1, term2}`
2. **Positioning Issues**: Check for CSS conflicts with container positioning
3. **Weight Not Updating**: Verify term syntax allows weight modification
4. **Hover Not Detected**: Confirm mouse events are not blocked by other elements

### Debug Information

The extension provides console logging for debugging:

- Hover event detection
- Menu positioning calculations
- Weight modification operations
- Error handling and validation

## API Reference

### Methods

#### `_onCategoryTermMouseEnter(event)`

Handles mouse enter events on category term wrappers.

**Parameters:**

- `event` (MouseEvent): The mouse enter event

**Behavior:**

- Detects hover over individual terms within categories
- Extracts term metadata (ID, value, index)
- Calculates positioning for dynamic menu placement
- Activates the extend menu for the parent tag

#### `_onCategoryTermMouseLeave(event)`

Handles mouse leave events on category term wrappers.

**Parameters:**

- `event` (MouseEvent): The mouse leave event

**Behavior:**

- Cleans up category term hover state
- Ensures proper cleanup of hover data and menu state

#### `getExtendMenuStyle(tag)`

Calculates dynamic positioning for the extend menu.

**Parameters:**

- `tag` (Object): The tag object for which to calculate menu style

**Returns:**

- `Object`: CSS style object for the extend menu

**Behavior:**

- Provides dynamic positioning for category term interactions
- Falls back to default positioning for regular tags
- Manages z-index for proper menu visibility

#### `_modifyCategoryTerm(tag, termIndex, originalTermValue, action, value)`

Modifies individual terms within category declarations.

**Parameters:**

- `tag` (Object): The parent category tag object
- `termIndex` (number): Index of the term within the category
- `originalTermValue` (string): Original value of the term being modified
- `action` (string): Type of modification ("inc", "dec", or "set")
- `value` (number): Weight value or increment/decrement amount

**Behavior:**

- Parses category declaration syntax
- Modifies the specific term while preserving structure
- Reconstructs the category with updated term
- Updates hover data and re-initializes listeners

### Data Structures

#### `categoryTermHoverData`

Stores information about the currently hovered category term.

**Properties:**

- `tag` (Object): Parent tag object for integration
- `termId` (string): Unique identifier for the term
- `termValue` (string): Current term value (may include weights)
- `termIndex` (number): Position within the category
- `position` (Object): Relative positioning data
  - `top` (number): Top offset relative to parent tag
  - `left` (number): Left offset relative to parent tag
  - `width` (number): Width of the term wrapper
  - `height` (number): Height of the term wrapper

## Future Enhancements

Potential improvements for this feature:

- **Keyboard Navigation**: Arrow key support for term selection
- **Touch Support**: Mobile device compatibility
- **Batch Operations**: Multi-term weight modification
- **Custom Shortcuts**: Configurable hotkeys for common operations
- **Advanced Positioning**: Smart menu placement with collision detection
- **Term Reordering**: Drag and drop support for term arrangement
- **Bulk Weight Operations**: Apply weight changes to multiple terms simultaneously

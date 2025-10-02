# Fullstack Academy Design System

This directory contains shared design system assets that can be used across all technology modules.

## Directory Structure

```
design-system/
├── css/
│   └── design-system.css
├── scss/
│   ├── _variables.scss
│   ├── _mixins.scss
│   ├── _components.scss
│   └── design-system.scss
├── fonts/
├── icons/
├── images/
└── README.md
```

## Implementation Guidelines

### React Module
Import the CSS file directly:
```javascript
import '@fullstack-academy/design-system/css/design-system.css';
```

### Laravel Module
Include the CSS file in your Blade layout:
```html
<link rel="stylesheet" href="{{ asset('vendor/design-system/css/design-system.css') }}">
```

### Node.js Module
Link to the CSS file in your HTML:
```html
<link rel="stylesheet" href="/vendor/design-system/css/design-system.css">
```

### Tailwind CSS Module
Use the configuration as a reference for customizing Tailwind.

### SASS Module
Import the SASS files in your main stylesheet:
```scss
@import '@fullstack-academy/design-system/scss/variables';
@import '@fullstack-academy/design-system/scss/mixins';
```

## Shared Assets

This design system provides:
- Consistent color palette
- Typography system
- Spacing system
- Component styles
- Responsive grid
- Dark mode support
- Accessibility features
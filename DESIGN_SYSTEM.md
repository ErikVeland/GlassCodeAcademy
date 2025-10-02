# Fullstack Academy Design System

This document outlines the shared design system that ensures consistency across all technology-specific modules while allowing each to use its own stack.

## Design Principles

1. **Consistency**: Unified look and feel across all modules
2. **Accessibility**: WCAG 2.1 AA compliant components
3. **Responsive**: Mobile-first, responsive design
4. **Performance**: Optimized assets and minimal dependencies
5. **Flexibility**: Adaptable to different technology constraints

## Color Palette

### Primary Colors
- Primary: `#3B82F6` (Blue-500)
- Secondary: `#10B981` (Emerald-500)
- Accent: `#8B5CF6` (Violet-500)

### Neutral Colors
- Light: `#F9FAFB` (Gray-50)
- Gray: `#6B7280` (Gray-500)
- Dark: `#1F2937` (Gray-800)
- Black: `#111827` (Gray-900)

### Status Colors
- Success: `#10B981` (Emerald-500)
- Warning: `#F59E0B` (Amber-500)
- Error: `#EF4444` (Red-500)
- Info: `#3B82F6` (Blue-500)

## Typography

### Font Family
- Primary: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`

### Font Sizes
- XS: 0.75rem (12px)
- SM: 0.875rem (14px)
- Base: 1rem (16px)
- LG: 1.125rem (18px)
- XL: 1.25rem (20px)
- 2XL: 1.5rem (24px)
- 3XL: 1.875rem (30px)
- 4XL: 2.25rem (36px)

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## Spacing System

Based on an 8px grid:
- 0: 0px
- 1: 4px
- 2: 8px
- 3: 12px
- 4: 16px
- 5: 20px
- 6: 24px
- 8: 32px
- 10: 40px
- 12: 48px
- 16: 64px
- 20: 80px
- 24: 96px
- 32: 128px

## Component Library

### Buttons

#### Primary Button
```css
.btn-primary {
  background-color: #3B82F6;
  color: white;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #2563EB;
}

.btn-primary:disabled {
  background-color: #93C5FD;
  cursor: not-allowed;
}
```

#### Secondary Button
```css
.btn-secondary {
  background-color: white;
  color: #3B82F6;
  border: 1px solid #3B82F6;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #EFF6FF;
}
```

### Cards
```css
.card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
```

### Forms
```css
.form-input {
  width: 100%;
  border: 1px solid #D1D5DB;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}
```

### Alerts
```css
.alert {
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.alert-success {
  background-color: #D1FAE5;
  color: #065F46;
  border: 1px solid #10B981;
}

.alert-error {
  background-color: #FEE2E2;
  color: #991B1B;
  border: 1px solid #EF4444;
}

.alert-warning {
  background-color: #FEF3C7;
  color: #92400E;
  border: 1px solid #F59E0B;
}
```

## Layout System

### Grid
All modules should implement a 12-column responsive grid system:

```css
.container {
  width: 100%;
  margin-right: auto;
  margin-left: auto;
  padding-right: 1rem;
  padding-left: 1rem;
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

### Breakpoints
- Small: 640px
- Medium: 768px
- Large: 1024px
- XL: 1280px
- 2XL: 1536px

## Dark Mode

All modules should implement dark mode support:

```css
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --border-color: #E5E7EB;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1F2937;
    --bg-secondary: #111827;
    --text-primary: #F9FAFB;
    --text-secondary: #D1D5DB;
    --border-color: #374151;
  }
}

.dark {
  --bg-primary: #1F2937;
  --bg-secondary: #111827;
  --text-primary: #F9FAFB;
  --text-secondary: #D1D5DB;
  --border-color: #374151;
}
```

## Implementation Guidelines

### React Module
Use Styled Components or Tailwind CSS to implement the design system.

### Laravel Module
Implement using Blade components with Tailwind CSS classes.

### Node.js Module
Use plain CSS or a lightweight CSS framework that matches the design system.

### Tailwind CSS Module
Use Tailwind CSS directly with custom configuration.

### SASS Module
Implement the design system using SASS variables, mixins, and functions.

## Accessibility

All components must meet WCAG 2.1 AA standards:
- Proper semantic HTML
- Sufficient color contrast (4.5:1 for normal text)
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators

## Performance

- Optimize images and assets
- Minimize CSS and JavaScript
- Use efficient selectors
- Implement lazy loading where appropriate
- Cache static assets

## Testing

Each module should implement:
- Visual regression testing
- Cross-browser compatibility testing
- Responsive design testing
- Accessibility testing
- Performance testing

## Versioning

The design system follows semantic versioning:
- MAJOR: Breaking changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes, backward compatible

## Updates

When updating the design system:
1. Update this documentation
2. Create migration guides for breaking changes
3. Update all module implementations
4. Test across all modules
5. Release new versions of all modules

This design system ensures a consistent user experience across all technology-specific modules while allowing each module to leverage its native technology stack.
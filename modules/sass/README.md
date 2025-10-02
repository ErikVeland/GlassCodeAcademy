# SASS Module

This is the SASS learning module, built with pure HTML and SASS stylesheets.

## Features

- Responsive design using SASS stylesheets
- Interactive lessons with code examples
- Quiz system with multiple-choice questions
- Implementation of the Fullstack Academy Design System
- Mobile-friendly interface
- Modular SASS architecture with partials

## Pages

1. **Home Page** (`index.html`) - Overview of the module
2. **Lessons Page** (`lessons.html`) - List of all lessons
3. **Lesson Detail Page** (`lesson-detail.html`) - Detailed lesson content
4. **Quiz Page** (`quiz.html`) - Interactive quiz

## Design System Implementation

This module implements the Fullstack Academy Design System with:
- Consistent color palette (violet as primary color for SASS)
- Responsive grid layout
- Accessible components
- Mobile-first approach
- Modular SASS architecture

## SASS Architecture

The module uses a modular SASS architecture with the following structure:

```
scss/
├── style.scss              # Main stylesheet that imports all partials
├── _variables.scss         # Global variables and color palette
├── _mixins.scss            # Reusable mixins
├── _base.scss              # Base styles and typography
├── _components.scss        # Component styles (buttons, cards, etc.)
├── _layout.scss            # Layout styles (header, footer, etc.)
└── _utilities.scss         # Utility classes
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile SASS to CSS:
   ```bash
   npm run build
   ```

3. Watch for changes and automatically compile:
   ```bash
   npm run watch
   ```

Simply open `index.html` in a web browser to view the module.

For development, you can use any local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

## Data Structure

The module uses static HTML with mock data. In a real implementation, it would connect to a backend API.

### Lessons
```json
{
  "id": 1,
  "topic": "Basics",
  "title": "Variables and Nesting",
  "description": "Learn how to use variables and nesting in SASS.",
  "content": "Detailed explanation...",
  "codeExample": "$font-stack: Helvetica, sans-serif;\n$primary-color: #333;\n\nbody {\n  font: 100% $font-stack;\n  color: $primary-color;\n}",
  "difficulty": "Beginner"
}
```

### Questions
```json
{
  "id": 1,
  "topic": "Basics",
  "type": "multiple-choice",
  "question": "What symbol is used to declare a variable in SASS?",
  "choices": ["#", "$", "@", "&"],
  "correctAnswer": 1,
  "explanation": "Explanation of the correct answer"
}
```

## Customization

The module uses a modular SASS architecture that makes it easy to customize:

1. Modify variables in `_variables.scss` to change colors, spacing, etc.
2. Add new components in `_components.scss`
3. Create new mixins in `_mixins.scss` for reusable functionality
4. Add utility classes in `_utilities.scss`

To compile your changes:
```bash
npm run build
```

# SASS Module Implementation

This directory contains a collection of HTML/CSS examples that teach SASS concepts using SASS itself.

## Directory Structure

```
sass/
├── public/
│   ├── index.html
│   ├── lessons/
│   │   ├── variables.html
│   │   ├── nesting.html
│   │   ├── mixins.html
│   │   ├── functions.html
│   │   ├── extends.html
│   │   ├── operators.html
│   │   ├── conditionals.html
│   │   ├── loops.html
│   │   ├── partials.html
│   │   └── modules.html
│   ├── quiz/
│   │   ├── index.html
│   │   ├── questions.html
│   │   └── results.html
│   ├── examples/
│   │   ├── buttons.html
│   │   ├── cards.html
│   │   ├── forms.html
│   │   ├── navigation.html
│   │   └── layout.html
│   ├── styles/
│   │   ├── main.css (compiled)
│   │   └── main.scss (source)
│   └── scripts/
│       └── main.js
├── src/
│   ├── scss/
│   │   ├── abstracts/
│   │   │   ├── _variables.scss
│   │   │   ├── _functions.scss
│   │   │   └── _mixins.scss
│   │   ├── base/
│   │   │   ├── _reset.scss
│   │   │   ├── _typography.scss
│   │   │   └── _utilities.scss
│   │   ├── components/
│   │   │   ├── _buttons.scss
│   │   │   ├── _cards.scss
│   │   │   ├── _forms.scss
│   │   │   └── _navigation.scss
│   │   ├── layout/
│   │   │   ├── _header.scss
│   │   │   ├── _footer.scss
│   │   │   └── _grid.scss
│   │   ├── pages/
│   │   │   ├── _home.scss
│   │   │   └── _lessons.scss
│   │   ├── themes/
│   │   │   └── _dark.scss
│   │   ├── vendors/
│   │   │   └── _normalize.scss
│   │   └── main.scss
│   ├── lessons/
│   │   ├── variables.md
│   │   ├── nesting.md
│   │   └── ...
│   └── questions/
│       └── quiz.json
├── package.json
├── sass.config.js
├── README.md
└── server.js
```

## Implementation Approach

The SASS module is a static site that demonstrates SASS concepts through practical examples:

### Key Components

1. **Lessons**:
   - HTML files with compiled CSS from SASS
   - Explanations of concepts in comments or separate markdown files
   - Interactive examples showing SASS source and compiled CSS

2. **Quiz System**:
   - HTML forms for multiple-choice questions
   - JavaScript for answer validation
   - Results page with score tracking

3. **Examples**:
   - Common UI components built with SASS
   - Real-world examples of SASS usage

### Development Server

A simple Node.js server (`server.js`) serves the static files:

```javascript
const express = require('express');
const path = require('path');
const sassMiddleware = require('node-sass-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(sassMiddleware({
  src: path.join(__dirname, 'src/scss'),
  dest: path.join(__dirname, 'public/styles'),
  debug: true,
  outputStyle: 'compressed',
  prefix: '/styles'
}));

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`SASS module running on http://localhost:${PORT}`);
});
```

## Key SASS Concepts Demonstrated

### 1. Variables
- Storing values for reuse
- Color palettes
- Typography scales
- Spacing scales

### 2. Nesting
- Selector nesting
- Parent selector reference (&)
- Property nesting

### 3. Mixins
- Creating reusable blocks of code
- Parameterized mixins
- Default parameter values

### 4. Functions
- Built-in functions
- Custom functions
- String, number, color, and list functions

### 5. Extends/Inheritance
- Using @extend directive
- Placeholder selectors
- Extending vs. mixins

### 6. Operators
- Arithmetic operators
- Comparison operators
- Logical operators

### 7. Conditionals
- @if, @else if, @else directives
- Conditional imports
- Dynamic styling based on conditions

### 8. Loops
- @for loops
- @each loops
- @while loops
- Practical use cases

### 9. Partials
- Breaking code into smaller files
- Partial naming conventions
- Importing partials

### 10. Modules
- @use and @forward rules
- Namespaces
- Built-in modules

## SASS Architecture

The module follows a structured architecture:

### 7-1 Pattern
- 7 folders for organization
- 1 main file to import everything

### Folder Structure
1. **abstracts**: Variables, functions, mixins
2. **base**: Reset, typography, utilities
3. **components**: Buttons, cards, forms
4. **layout**: Header, footer, grid
5. **pages**: Page-specific styles
6. **themes**: Dark mode, color themes
7. **vendors**: Third-party styles

## Features

### 1. Interactive Examples
- Live previews of SASS code
- Side-by-side comparison of SASS and compiled CSS
- Editable examples

### 2. Responsive Design Showcase
- Examples of responsive layouts using SASS
- Media query mixins
- Breakpoint management

### 3. Component Library
- Common UI components built with SASS
- Cards, buttons, forms, navigation
- Copy-paste friendly code

### 4. Dark Mode Implementation
- SASS variables for theme switching
- CSS custom properties integration
- Persistent user preference

## Development Setup

1. Install Node.js and npm
2. Clone the repository
3. Run `npm install`
4. Run `npm start` to start the development server with SASS compilation

The module will be available at `http://localhost:3000`

## Build Process

The module uses node-sass for compilation:

### package.json scripts

```json
{
  "scripts": {
    "build": "node-sass src/scss/main.scss public/styles/main.css --output-style compressed",
    "build:watch": "node-sass src/scss/main.scss public/styles/main.css --watch --output-style compressed",
    "start": "node server.js"
  }
}
```

### SASS Configuration

```javascript
// sass.config.js
module.exports = {
  src: 'src/scss',
  dest: 'public/styles',
  options: {
    outputStyle: 'compressed',
    sourceMap: true,
    precision: 6
  }
};
```

## Key SASS Files

### _variables.scss

```scss
// Color palette
$primary-color: #3498db;
$secondary-color: #2ecc71;
$danger-color: #e74c3c;
$light-color: #f8f9fa;
$dark-color: #343a40;

// Typography
$font-family-base: 'Helvetica Neue', Arial, sans-serif;
$font-size-base: 1rem;
$line-height-base: 1.5;

// Spacing
$spacer: 1rem;
$spacers: (
  0: 0,
  1: $spacer * 0.25,
  2: $spacer * 0.5,
  3: $spacer,
  4: $spacer * 1.5,
  5: $spacer * 3
);
```

### _mixins.scss

```scss
// Responsive breakpoints
@mixin respond-to($breakpoint) {
  @if $breakpoint == 'small' {
    @media (max-width: 576px) {
      @content;
    }
  }
  @if $breakpoint == 'medium' {
    @media (max-width: 768px) {
      @content;
    }
  }
  @if $breakpoint == 'large' {
    @media (max-width: 992px) {
      @content;
    }
  }
}

// Clearfix
@mixin clearfix {
  &::after {
    content: '';
    display: table;
    clear: both;
  }
}

// Center block
@mixin center-block {
  display: block;
  margin-left: auto;
  margin-right: auto;
}
```

### _functions.scss

```scss
// Calculate em values
@function em($pixels, $context: 16px) {
  @return ($pixels / $context) * 1em;
}

// Calculate rem values
@function rem($pixels, $context: 16px) {
  @return ($pixels / $context) * 1rem;
}

// Tint color
@function tint($color, $percentage) {
  @return mix(white, $color, $percentage);
}

// Shade color
@function shade($color, $percentage) {
  @return mix(black, $color, $percentage);
}
```

## Quiz System

The quiz system demonstrates:
- Form handling with SASS-styled components
- JavaScript for answer validation
- Score calculation and display
- Results page with explanations

### Quiz Data Structure

```json
{
  "questions": [
    {
      "id": 1,
      "topic": "Variables",
      "question": "How do you declare a variable in SASS?",
      "choices": [
        "$variable-name: value;",
        "var variable-name = value;",
        "--variable-name: value;",
        "@variable variable-name: value;"
      ],
      "correctAnswer": 0,
      "explanation": "In SASS, variables are declared with a $ prefix followed by the variable name, a colon, and the value."
    }
  ]
}
```

## Real-world Examples

The module includes examples of:
- Complete website layouts
- Component libraries
- Design systems
- Responsive frameworks

## Best Practices Showcase

The module demonstrates SASS best practices:
- Proper file organization
- Meaningful variable names
- Commenting conventions
- Selector nesting limits
- Performance optimization

## Integration Examples

The module shows integration with:
- CSS frameworks (Bootstrap)
- JavaScript frameworks (React, Vue)
- Build tools (Webpack, Gulp)
- CSS architecture methodologies (BEM, SMACSS)

## Performance Optimization

The module demonstrates:
- Minification
- Source maps for development
- Selector efficiency
- File size optimization

## Future Enhancements

1. **Advanced Features**:
   - CSS Grid with SASS
   - CSS Custom Properties integration
   - SASS maps for complex data

2. **Interactive Playground**:
   - Live SASS compiler
   - Real-time preview
   - Export functionality

3. **Component Library**:
   - More comprehensive component examples
   - Accessibility-focused components
   - Animation examples with SASS

4. **Build Tool Integration**:
   - Webpack with SASS loader
   - Gulp automation
   - PostCSS integration

5. **Design Systems**:
   - Creating a design system with SASS
   - Theme customization
   - Component documentation
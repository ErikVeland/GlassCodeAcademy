# Standardized Question Template

## Overview

This template defines the standardized structure for all interview questions and assessments across the DotNetQuiz Academy platform, ensuring consistent evaluation, proper difficulty distribution, and comprehensive learning assessment.

## JSON Schema Structure

```json
{
  "id": {
    "type": "integer",
    "description": "Unique identifier for the question",
    "required": true
  },
  "topic": {
    "type": "string",
    "description": "Topic category matching lesson topics",
    "required": true,
    "examples": ["Basics", "Advanced Concepts", "Performance", "Best Practices"]
  },
  "type": {
    "type": "string",
    "enum": ["multiple-choice", "open-ended", "coding-challenge"],
    "description": "Question format type",
    "required": true
  },
  "difficulty": {
    "type": "string",
    "enum": ["Beginner", "Intermediate", "Advanced"],
    "description": "Question difficulty level",
    "required": true
  },
  "question": {
    "type": "string",
    "description": "Clear, well-formulated question text",
    "required": true,
    "minLength": 20,
    "maxLength": 300
  },
  "choices": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "Answer choices for multiple-choice questions",
    "required": "conditional",
    "minItems": 4,
    "maxItems": 4,
    "note": "Required for multiple-choice, null for open-ended"
  },
  "correctAnswer": {
    "type": "integer",
    "description": "Index of correct answer (0-3) for multiple-choice",
    "required": "conditional",
    "minimum": 0,
    "maximum": 3,
    "note": "Required for multiple-choice, null for open-ended"
  },
  "explanation": {
    "type": "string",
    "description": "Comprehensive explanation of the correct answer",
    "required": true,
    "minLength": 50,
    "maxLength": 500
  },
  "industryContext": {
    "type": "string",
    "description": "Real-world relevance and professional context",
    "required": true,
    "minLength": 30,
    "maxLength": 200
  },
  "relatedConcepts": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "Cross-references to related topics or lessons",
    "required": false
  },
  "commonMistakes": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "Common incorrect approaches and why they're wrong",
    "required": false
  },
  "tags": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "Searchable tags for content discovery",
    "required": false
  }
}
```

## Difficulty Classification Framework

### Distribution Target (Per Module)
- **Beginner**: 30% of questions (4-6 questions per 15-20 question module)
- **Intermediate**: 50% of questions (8-10 questions per module)
- **Advanced**: 20% of questions (3-4 questions per module)

### Beginner Level Characteristics
- **Knowledge Type**: Recall and basic understanding
- **Question Focus**: Definitions, syntax, basic concepts
- **Cognitive Load**: Single concept per question
- **Industry Context**: Fundamental skills every developer needs

**Question Patterns:**
- "What is [concept]?"
- "Which method/keyword is used for [basic operation]?"
- "What does [basic syntax] do?"

**Example:**
```json
{
  "difficulty": "Beginner",
  "question": "What is the purpose of the 'useState' hook in React?",
  "industryContext": "useState is fundamental to React development and is used in virtually every React component that needs to manage local state."
}
```

### Intermediate Level Characteristics
- **Knowledge Type**: Application and analysis
- **Question Focus**: Practical scenarios, best practices, problem-solving
- **Cognitive Load**: Multiple related concepts
- **Industry Context**: Common professional scenarios

**Question Patterns:**
- "How would you [solve specific problem]?"
- "What is the difference between [concept A] and [concept B]?"
- "When would you use [technique] instead of [alternative]?"

**Example:**
```json
{
  "difficulty": "Intermediate", 
  "question": "What is the difference between 'useEffect' with an empty dependency array and 'useEffect' with no dependency array?",
  "industryContext": "Understanding useEffect dependencies is crucial for preventing infinite loops and optimizing component performance in production applications."
}
```

### Advanced Level Characteristics
- **Knowledge Type**: Synthesis, evaluation, and optimization
- **Question Focus**: Architecture, performance, complex scenarios
- **Cognitive Load**: Multiple complex concepts and trade-offs
- **Industry Context**: Senior-level decision making

**Question Patterns:**
- "How would you optimize [complex scenario]?"
- "What are the trade-offs between [approach A] and [approach B]?"
- "How would you architect [complex system]?"

**Example:**
```json
{
  "difficulty": "Advanced",
  "question": "How would you implement server-side rendering with React while maintaining optimal performance for a large-scale e-commerce application?",
  "industryContext": "SSR optimization is critical for enterprise applications handling millions of users, requiring deep understanding of performance trade-offs and architecture decisions."
}
```

## Question Type Guidelines

### Multiple-Choice Questions

#### Choice Design Principles
- **Correct Answer**: Clearly correct and unambiguous
- **Distractors**: Plausible but incorrect options
- **Avoid**: "All of the above" or "None of the above" unless truly appropriate
- **Length**: Keep choices roughly equal in length
- **Clarity**: Each choice should be clear and specific

#### Choice Quality Standards
1. **One Clearly Correct Answer**: Only one option should be definitively correct
2. **Plausible Distractors**: Wrong answers should be believable to someone with incomplete knowledge
3. **No Trick Questions**: Avoid deliberately misleading or "gotcha" questions
4. **Consistent Format**: All choices should follow the same grammatical structure

**Example - Good Multiple Choice:**
```json
{
  "question": "Which React hook is used to manage component state?",
  "choices": [
    "useState",
    "useEffect", 
    "useContext",
    "useCallback"
  ],
  "correctAnswer": 0,
  "explanation": "useState is specifically designed for managing component state. useEffect handles side effects, useContext accesses context values, and useCallback memoizes functions."
}
```

**Example - Poor Multiple Choice:**
```json
{
  "question": "Which is correct about React?",
  "choices": [
    "It's good",
    "It uses components",
    "All of the above", 
    "None of the above"
  ]
  // Issues: Vague question, unclear choices, ambiguous "all/none" options
}
```

### Open-Ended Questions

#### Question Design Principles
- **Specificity**: Ask for specific information or explanations
- **Scope**: Clear boundaries on what should be included in the answer
- **Depth**: Appropriate level of detail expected
- **Practicality**: Focus on applicable knowledge

#### Answer Guidance
- **Key Points**: Explanation should outline main points expected
- **Depth**: Indicate appropriate level of detail
- **Examples**: Include concrete examples where helpful
- **Common Approaches**: Acknowledge multiple valid approaches

**Example - Good Open-Ended:**
```json
{
  "question": "Explain the concept of 'props drilling' in React and describe two approaches to avoid it.",
  "explanation": "Props drilling occurs when props are passed through multiple component layers to reach deeply nested components. Two main approaches to avoid it are: 1) Context API - allows sharing data across the component tree without explicit props, and 2) State management libraries like Redux - centralize state management. Both approaches reduce coupling and improve maintainability."
}
```

### Coding Challenge Questions (Advanced)

#### Challenge Design Principles
- **Realistic Scenarios**: Based on actual development tasks
- **Clear Requirements**: Specify expected input/output
- **Appropriate Scope**: Completable in reasonable time
- **Multiple Solutions**: Allow for different valid approaches

## Content Quality Standards

### Question Text Requirements
- **Length**: 20-300 characters
- **Clarity**: Unambiguous and specific
- **Grammar**: Professional, error-free language
- **Context**: Sufficient context to answer without ambiguity

**Quality Checklist:**
- [ ] Question is grammatically correct
- [ ] Question is specific and unambiguous
- [ ] Context is sufficient to answer
- [ ] Length is appropriate for complexity
- [ ] Professional tone and language

### Explanation Requirements
- **Length**: 50-500 characters
- **Completeness**: Addresses why answer is correct
- **Education**: Explains incorrect choices (for multiple-choice)
- **Context**: Connects to broader concepts
- **Practical Value**: Relates to real-world applications

**Explanation Structure:**
```
[Why the correct answer is correct]. [Why other options are incorrect - for multiple choice]. 
[Additional context or practical considerations]. [Connection to broader concepts or real-world applications].
```

### Industry Context Requirements
- **Relevance**: Clear connection to professional work
- **Specificity**: Concrete scenarios rather than general statements
- **Currency**: Reflects current industry practices
- **Value**: Explains why this knowledge matters professionally

## Validation Checklist

### Content Validation
- [ ] Question tests knowledge from corresponding lessons
- [ ] Difficulty level matches content complexity
- [ ] All required fields are present and properly formatted
- [ ] Question text is clear and unambiguous
- [ ] Explanation is comprehensive and educational

### Multiple-Choice Specific
- [ ] Exactly 4 choices provided
- [ ] One clearly correct answer
- [ ] Distractors are plausible but incorrect
- [ ] Choices are roughly equal in length
- [ ] No trick questions or deliberate confusion

### Educational Value
- [ ] Question assesses understanding, not memorization
- [ ] Connects to practical, professional applications
- [ ] Difficulty is appropriate for target audience
- [ ] Explanation enhances learning beyond just answering

### Technical Accuracy
- [ ] All technical information is current and accurate
- [ ] Answer reflects current best practices
- [ ] Industry context is accurate and relevant
- [ ] No deprecated or discouraged approaches

## Example Complete Questions

### Beginner Level Example
```json
{
  "id": 1,
  "topic": "React Basics",
  "type": "multiple-choice",
  "difficulty": "Beginner",
  "question": "Which method is used to render a React component to the DOM?",
  "choices": [
    "ReactDOM.render()",
    "React.render()",
    "Component.render()",
    "DOM.render()"
  ],
  "correctAnswer": 0,
  "explanation": "ReactDOM.render() is the method used to render React components to the DOM. This method is part of the react-dom package and takes a React element and a DOM container as arguments.",
  "industryContext": "ReactDOM.render() is essential for any React application and is typically called once at the application's entry point to mount the root component.",
  "relatedConcepts": ["React components", "Virtual DOM", "React application structure"],
  "tags": ["react", "dom", "rendering", "fundamentals"]
}
```

### Intermediate Level Example
```json
{
  "id": 2,
  "topic": "React Hooks",
  "type": "open-ended",
  "difficulty": "Intermediate",
  "question": "Explain the difference between useEffect with an empty dependency array and useEffect with no dependency array. When would you use each?",
  "choices": null,
  "correctAnswer": null,
  "explanation": "useEffect with an empty dependency array ([]) runs only once after the initial render, similar to componentDidMount. useEffect with no dependency array runs after every render. Use empty array for one-time setup like API calls or event listeners. Use no dependency array for effects that should run on every update, though this is less common and can cause performance issues.",
  "industryContext": "Understanding useEffect dependencies is crucial for preventing infinite loops and optimizing performance in production React applications. Incorrect dependency management is a common source of bugs.",
  "relatedConcepts": ["useEffect", "component lifecycle", "performance optimization", "dependency arrays"],
  "commonMistakes": [
    "Forgetting dependencies and causing stale closures",
    "Including unnecessary dependencies causing excessive re-renders"
  ],
  "tags": ["react", "hooks", "useEffect", "lifecycle", "performance"]
}
```

### Advanced Level Example
```json
{
  "id": 3,
  "topic": "React Performance",
  "type": "multiple-choice", 
  "difficulty": "Advanced",
  "question": "In a large React application with frequent updates, which optimization technique would be most effective for preventing unnecessary re-renders of expensive components?",
  "choices": [
    "React.memo with custom comparison function",
    "useCallback for all event handlers",
    "useMemo for all computed values",
    "PureComponent for all class components"
  ],
  "correctAnswer": 0,
  "explanation": "React.memo with a custom comparison function provides the most control over when components re-render. While useCallback and useMemo help with referential equality, React.memo prevents the entire component from re-rendering based on custom logic. PureComponent only does shallow comparison and is for class components.",
  "industryContext": "In enterprise applications with complex state and frequent updates, strategic use of React.memo can dramatically improve performance. Senior developers must understand when and how to implement these optimizations effectively.",
  "relatedConcepts": ["React.memo", "memoization", "performance optimization", "component lifecycle"],
  "commonMistakes": [
    "Overusing memoization causing more overhead than benefit",
    "Not considering the cost of comparison functions"
  ],
  "tags": ["react", "performance", "optimization", "memoization", "enterprise"]
}
```

## Module-Specific Guidelines

### Backend Technologies
- **Focus**: Architecture, security, scalability, best practices
- **Question Types**: Heavy emphasis on open-ended for complex scenarios
- **Industry Context**: Enterprise development, team collaboration, production concerns

### Frontend Technologies  
- **Focus**: User experience, performance, component design, modern patterns
- **Question Types**: Mix of multiple-choice for syntax and open-ended for architecture
- **Industry Context**: User-facing applications, cross-browser compatibility, accessibility

### Database Technologies
- **Focus**: Query optimization, data modeling, performance, integrity
- **Question Types**: Strong emphasis on practical scenarios and optimization
- **Industry Context**: Large-scale data management, performance at scale

### Testing Technologies
- **Focus**: Test strategies, quality assurance, automation, best practices
- **Question Types**: Practical scenarios and methodology questions
- **Industry Context**: Quality engineering, CI/CD, team processes

This template ensures comprehensive, fair, and educational assessments that accurately measure learning while providing valuable feedback to students across all technology modules.
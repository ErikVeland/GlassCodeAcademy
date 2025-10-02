#!/bin/bash

# Simple Content Validation Script
# Validates that all modules meet the required content thresholds using Python

echo "🔍 Validating content thresholds..."

# Check if we're in the right directory
if [ ! -f "content/registry.json" ]; then
    echo "❌ Error: content/registry.json not found. Please run this script from the project root."
    exit 1
fi

# Use Python to validate JSON files
python3 -c "
import json
import os
import sys

def validate_content():
    errors = 0
    warnings = 0
    
    # Validate registry
    try:
        with open('content/registry.json', 'r') as f:
            registry = json.load(f)
        print('✅ Registry file is valid JSON')
    except Exception as e:
        print(f'❌ Error: Failed to parse content/registry.json: {e}')
        return 1, 0
    
    # Validate lessons
    print('📋 Checking lessons...')
    for filename in os.listdir('content/lessons'):
        if filename.endswith('.json'):
            filepath = os.path.join('content/lessons', filename)
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
                module_name = filename[:-5]  # Remove .json extension
                lesson_count = len(data) if isinstance(data, list) else 0
                print(f'✅ {module_name}: {lesson_count} lessons')
                
                # Check minimum threshold
                required_lessons = 12  # Default minimum
                for module in registry.get('modules', []):
                    if module.get('slug') == module_name:
                        required_lessons = module.get('thresholds', {}).get('requiredLessons', 12)
                        break
                
                if lesson_count < required_lessons:
                    print(f'⚠️  Warning: {module_name} has {lesson_count} lessons, requires {required_lessons}')
                    warnings += 1
                    
            except Exception as e:
                print(f'❌ Error: Failed to parse {filepath}: {e}')
                errors += 1
    
    # Validate quizzes
    print('📋 Checking quizzes...')
    for filename in os.listdir('content/quizzes'):
        if filename.endswith('.json'):
            filepath = os.path.join('content/quizzes', filename)
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
                module_name = filename[:-5]  # Remove .json extension
                question_count = len(data.get('questions', []))
                print(f'✅ {module_name}: {question_count} questions')
                
                # Check minimum threshold
                required_questions = 15  # Default minimum
                for module in registry.get('modules', []):
                    if module.get('slug') == module_name:
                        required_questions = module.get('thresholds', {}).get('requiredQuestions', 15)
                        break
                
                if question_count < required_questions:
                    print(f'⚠️  Warning: {module_name} has {question_count} questions, requires {required_questions}')
                    warnings += 1
                    
                if question_count == 0:
                    print(f'❌ Error: Quiz for {module_name} has no questions')
                    errors += 1
                    
            except Exception as e:
                print(f'❌ Error: Failed to parse {filepath}: {e}')
                errors += 1
    
    return errors, warnings

if __name__ == '__main__':
    errors, warnings = validate_content()
    
    print('')
    print('📊 VALIDATION SUMMARY')
    print('===================')
    print(f'Errors: {errors}')
    print(f'Warnings: {warnings}')
    
    if errors == 0:
        if warnings == 0:
            print('✅ All content thresholds validated successfully!')
            sys.exit(0)
        else:
            print('⚠️  Validation completed with warnings.')
            sys.exit(0)
    else:
        print(f'❌ Validation failed with {errors} errors.')
        sys.exit(1)
"
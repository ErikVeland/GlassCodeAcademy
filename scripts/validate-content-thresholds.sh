#!/bin/bash

# Content Threshold Validation Script
# Validates that all modules meet the required content thresholds

echo "🔍 Validating content thresholds..."

# Check if we're in the right directory
if [ ! -f "content/registry.json" ]; then
    echo "❌ Error: content/registry.json not found. Please run this script from the project root."
    exit 1
fi

# Initialize counters
total_errors=0
total_warnings=0

# Validate each module
echo "📋 Checking modules..."
for module_file in content/lessons/*.json; do
    module_name=$(basename "$module_file" .json)
    lesson_count=$(jq 'length' "$module_file" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to parse $module_file"
        ((total_errors++))
        continue
    fi
    
    # Get required lesson count from registry
    required_lessons=$(jq -r --arg module "$module_name" '.modules[] | select(.slug == $module) | .thresholds.requiredLessons' content/registry.json 2>/dev/null)
    
    if [ -z "$required_lessons" ] || [ "$required_lessons" = "null" ]; then
        required_lessons=12  # Default minimum
    fi
    
    if [ "$lesson_count" -lt "$required_lessons" ]; then
        echo "⚠️  Warning: $module_name has $lesson_count lessons, requires $required_lessons"
        ((total_warnings++))
    else
        echo "✅ $module_name: $lesson_count lessons (required: $required_lessons)"
    fi
done

# Validate quizzes
echo "📋 Checking quizzes..."
for quiz_file in content/quizzes/*.json; do
    module_name=$(basename "$quiz_file" .json)
    question_count=$(jq '.questions | length' "$quiz_file" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to parse $quiz_file"
        ((total_errors++))
        continue
    fi
    
    # Get required question count from registry
    required_questions=$(jq -r --arg module "$module_name" '.modules[] | select(.slug == $module) | .thresholds.requiredQuestions' content/registry.json 2>/dev/null)
    
    if [ -z "$required_questions" ] || [ "$required_questions" = "null" ]; then
        required_questions=15  # Default minimum
    fi
    
    if [ "$question_count" -lt "$required_questions" ]; then
        echo "⚠️  Warning: $module_name has $question_count questions, requires $required_questions"
        ((total_warnings++))
    else
        echo "✅ $module_name: $question_count questions (required: $required_questions)"
    fi
done

# Summary
echo ""
echo "📊 VALIDATION SUMMARY"
echo "==================="
echo "Errors: $total_errors"
echo "Warnings: $total_warnings"

if [ $total_errors -eq 0 ]; then
    if [ $total_warnings -eq 0 ]; then
        echo "✅ All content thresholds validated successfully!"
        exit 0
    else
        echo "⚠️  Validation completed with warnings."
        exit 0
    fi
else
    echo "❌ Validation failed with $total_errors errors."
    exit 1
fi
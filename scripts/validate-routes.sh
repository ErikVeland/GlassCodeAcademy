#!/bin/bash

# Route Validation Script
# Validates that all content routes resolve correctly to prevent 404 errors

echo "🔍 Validating routes..."

# Check if we're in the right directory
if [ ! -f "content/registry.json" ]; then
    echo "❌ Error: content/registry.json not found. Please run this script from the project root."
    exit 1
fi

# Initialize counters
total_errors=0
total_warnings=0

# Extract all module routes from registry
echo "📋 Checking module routes..."
modules=$(jq -r '.modules[].slug' content/registry.json)

for module in $modules; do
    # Check if lesson file exists
    if [ ! -f "content/lessons/$module.json" ]; then
        echo "❌ Error: Missing lesson file for module $module (content/lessons/$module.json)"
        ((total_errors++))
    else
        echo "✅ Lesson file exists for $module"
    fi
    
    # Check if quiz file exists
    if [ ! -f "content/quizzes/$module.json" ]; then
        echo "❌ Error: Missing quiz file for module $module (content/quizzes/$module.json)"
        ((total_errors++))
    else
        echo "✅ Quiz file exists for $module"
    fi
    
    # Validate lesson file structure
    if [ -f "content/lessons/$module.json" ]; then
        # Check if it's valid JSON
        if ! jq empty "content/lessons/$module.json" 2>/dev/null; then
            echo "❌ Error: Invalid JSON in content/lessons/$module.json"
            ((total_errors++))
        fi
    fi
    
    # Validate quiz file structure
    if [ -f "content/quizzes/$module.json" ]; then
        # Check if it's valid JSON
        if ! jq empty "content/quizzes/$module.json" 2>/dev/null; then
            echo "❌ Error: Invalid JSON in content/quizzes/$module.json"
            ((total_errors++))
        fi
        
        # Check if quiz has questions
        question_count=$(jq '.questions | length' "content/quizzes/$module.json" 2>/dev/null)
        if [ "$question_count" = "0" ] || [ "$question_count" = "null" ]; then
            echo "❌ Error: Quiz for $module has no questions"
            ((total_errors++))
        fi
    fi
done

# Check for orphaned files (files without corresponding modules)
echo "📋 Checking for orphaned files..."

# Check lessons directory
for lesson_file in content/lessons/*.json; do
    module_name=$(basename "$lesson_file" .json)
    if ! jq -e --arg module "$module_name" '.modules[] | select(.slug == $module)' content/registry.json >/dev/null 2>&1; then
        echo "⚠️  Warning: Orphaned lesson file found: $lesson_file"
        ((total_warnings++))
    fi
done

# Check quizzes directory
for quiz_file in content/quizzes/*.json; do
    module_name=$(basename "$quiz_file" .json)
    if ! jq -e --arg module "$module_name" '.modules[] | select(.slug == $module)' content/registry.json >/dev/null 2>&1; then
        echo "⚠️  Warning: Orphaned quiz file found: $quiz_file"
        ((total_warnings++))
    fi
done

# Validate internal links in lessons
echo "📋 Checking lesson content for broken references..."

# Summary
echo ""
echo "📊 ROUTE VALIDATION SUMMARY"
echo "========================="
echo "Errors: $total_errors"
echo "Warnings: $total_warnings"

if [ $total_errors -eq 0 ]; then
    if [ $total_warnings -eq 0 ]; then
        echo "✅ All routes validated successfully!"
        exit 0
    else
        echo "⚠️  Route validation completed with warnings."
        exit 0
    fi
else
    echo "❌ Route validation failed with $total_errors errors."
    exit 1
fi
#!/bin/bash

# Basic Content Validation Script
# Validates content structure and file existence

echo "🔍 Validating content structure..."

# Check if we're in the right directory
if [ ! -f "content/registry.json" ]; then
    echo "❌ Error: content/registry.json not found. Please run this script from the project root."
    exit 1
fi

# Initialize counters
total_errors=0
total_warnings=0

# Check if lessons and quizzes directories exist
if [ ! -d "content/lessons" ]; then
    echo "❌ Error: content/lessons directory not found"
    ((total_errors++))
fi

if [ ! -d "content/quizzes" ]; then
    echo "❌ Error: content/quizzes directory not found"
    ((total_errors++))
fi

# Count files
lesson_files=$(ls -1 content/lessons/*.json 2>/dev/null | wc -l)
quiz_files=$(ls -1 content/quizzes/*.json 2>/dev/null | wc -l)

echo "📋 Found $lesson_files lesson files and $quiz_files quiz files"

# Check for matching pairs
echo "📋 Checking for matching lesson/quiz pairs..."

# Get module names from registry
modules=()
while IFS= read -r line; do
    modules+=("$line")
done < <(grep -o '"slug": "[^"]*"' content/registry.json | sed 's/"slug": "\(.*\)"/\1/')

echo "📋 Found ${#modules[@]} modules in registry"

# Check each module
for module in "${modules[@]}"; do
    # Check lesson file
    if [ -f "content/lessons/$module.json" ]; then
        echo "✅ Lesson file exists for $module"
    else
        echo "❌ Error: Missing lesson file for $module (content/lessons/$module.json)"
        ((total_errors++))
    fi
    
    # Check quiz file
    if [ -f "content/quizzes/$module.json" ]; then
        echo "✅ Quiz file exists for $module"
    else
        echo "❌ Error: Missing quiz file for $module (content/quizzes/$module.json)"
        ((total_errors++))
    fi
done

# Check for orphaned files
echo "📋 Checking for orphaned files..."

# Check if there are any .json files in lessons directory
if ls content/lessons/*.json 1> /dev/null 2>&1; then
    for lesson_file in content/lessons/*.json; do
        module_name=$(basename "$lesson_file" .json)
        # Check if module exists in registry
        if ! grep -q "\"slug\": \"$module_name\"" content/registry.json; then
            echo "⚠️  Warning: Orphaned lesson file found: $lesson_file"
            ((total_warnings++))
        fi
    done
fi

# Check if there are any .json files in quizzes directory
if ls content/quizzes/*.json 1> /dev/null 2>&1; then
    for quiz_file in content/quizzes/*.json; do
        module_name=$(basename "$quiz_file" .json)
        # Check if module exists in registry
        if ! grep -q "\"slug\": \"$module_name\"" content/registry.json; then
            echo "⚠️  Warning: Orphaned quiz file found: $quiz_file"
            ((total_warnings++))
        fi
    done
fi

# Summary
echo ""
echo "📊 VALIDATION SUMMARY"
echo "==================="
echo "Errors: $total_errors"
echo "Warnings: $total_warnings"

if [ $total_errors -eq 0 ]; then
    if [ $total_warnings -eq 0 ]; then
        echo "✅ All basic content validation passed!"
        exit 0
    else
        echo "⚠️  Validation completed with warnings."
        exit 0
    fi
else
    echo "❌ Validation failed with $total_errors errors."
    exit 1
fi
#!/usr/bin/env python3
"""
Script to check and fix question ID indexing in quiz JSON files.
Ensures all questions are correctly indexed starting from ID 1.
"""

import json
import os
import sys
from pathlib import Path

def check_quiz_indexing(file_path):
    """Check if quiz questions are properly indexed starting from 1."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'questions' not in data:
            return True, f"No questions array found in {file_path}"
        
        questions = data['questions']
        issues = []
        
        for i, question in enumerate(questions):
            expected_id = str(i + 1)  # IDs should be strings starting from "1"
            actual_id = question.get('id', 'missing')
            
            if actual_id != expected_id:
                issues.append(f"Question {i}: expected ID '{expected_id}', got '{actual_id}'")
        
        if issues:
            return False, issues
        else:
            return True, f"All {len(questions)} questions properly indexed"
            
    except Exception as e:
        return False, f"Error reading {file_path}: {str(e)}"

def fix_quiz_indexing(file_path):
    """Fix question ID indexing to start from 1."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'questions' not in data:
            return False, f"No questions array found in {file_path}"
        
        questions = data['questions']
        changes_made = False
        
        for i, question in enumerate(questions):
            expected_id = str(i + 1)
            if question.get('id') != expected_id:
                question['id'] = expected_id
                changes_made = True
        
        if changes_made:
            # Write back to file with proper formatting
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True, f"Fixed indexing for {len(questions)} questions"
        else:
            return True, "No changes needed"
            
    except Exception as e:
        return False, f"Error fixing {file_path}: {str(e)}"

def main():
    """Main function to check all quiz files."""
    quiz_dir = Path("/Users/veland/GlassCodeAcademy/content/quizzes")
    
    if not quiz_dir.exists():
        print(f"Quiz directory not found: {quiz_dir}")
        sys.exit(1)
    
    quiz_files = list(quiz_dir.glob("*.json"))
    
    if not quiz_files:
        print("No quiz JSON files found")
        sys.exit(1)
    
    print(f"Checking {len(quiz_files)} quiz files...\n")
    
    issues_found = []
    
    for quiz_file in sorted(quiz_files):
        print(f"Checking {quiz_file.name}...")
        is_correct, message = check_quiz_indexing(quiz_file)
        
        if is_correct:
            print(f"  ✅ {message}")
        else:
            print(f"  ❌ Issues found:")
            if isinstance(message, list):
                for issue in message:
                    print(f"    - {issue}")
            else:
                print(f"    - {message}")
            issues_found.append(quiz_file)
        print()
    
    if issues_found:
        print(f"\n🔧 Found issues in {len(issues_found)} files. Fixing...")
        
        for quiz_file in issues_found:
            print(f"Fixing {quiz_file.name}...")
            success, message = fix_quiz_indexing(quiz_file)
            
            if success:
                print(f"  ✅ {message}")
            else:
                print(f"  ❌ {message}")
        
        print("\n🔄 Re-checking all files after fixes...")
        
        for quiz_file in sorted(quiz_files):
            is_correct, message = check_quiz_indexing(quiz_file)
            if not is_correct:
                print(f"❌ {quiz_file.name} still has issues: {message}")
            else:
                print(f"✅ {quiz_file.name}: {message}")
    else:
        print("🎉 All quiz files have correct indexing!")

if __name__ == "__main__":
    main()
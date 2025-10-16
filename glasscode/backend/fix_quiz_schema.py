#!/usr/bin/env python3
"""
Quiz Schema Fixer Script

This script fixes the schema issues in quiz JSON files:
1. Converts wrapper structure to direct array format
2. Renames 'correctIndex' to 'correctAnswer' 
3. Adds missing 'type' field to questions
4. Creates backup files before making changes
"""

import json
import os
import shutil
from pathlib import Path

def fix_quiz_file(file_path):
    """Fix schema issues in a single quiz file"""
    print(f"Processing: {file_path}")
    
    # Create backup
    backup_path = str(file_path) + '.backup'
    shutil.copy2(file_path, backup_path)
    print(f"  Created backup: {backup_path}")
    
    try:
        # Read the original file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check if it has wrapper structure
        if isinstance(data, dict) and 'questions' in data:
            print("  Converting from wrapper structure to direct array")
            questions = data['questions']
        elif isinstance(data, list):
            print("  Already in direct array format")
            questions = data
        else:
            print(f"  ERROR: Unexpected data structure in {file_path}")
            return False
        
        # Fix each question
        fixed_questions = []
        changes_made = 0
        
        for i, question in enumerate(questions):
            if not isinstance(question, dict):
                print(f"  ERROR: Question {i} is not a dictionary")
                continue
                
            fixed_question = question.copy()
            
            # Fix 1: Rename correctIndex to correctAnswer
            if 'correctIndex' in fixed_question:
                fixed_question['correctAnswer'] = fixed_question.pop('correctIndex')
                changes_made += 1
            
            # Fix 2: Add missing 'type' field
            if 'type' not in fixed_question:
                # Determine type based on question content
                if 'choices' in fixed_question and len(fixed_question.get('choices', [])) > 0:
                    fixed_question['type'] = 'multiple-choice'
                else:
                    fixed_question['type'] = 'open-ended'
                changes_made += 1
            
            fixed_questions.append(fixed_question)
        
        # Write the fixed data as direct array
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(fixed_questions, f, indent=2, ensure_ascii=False)
        
        print(f"  Fixed {changes_made} issues in {len(fixed_questions)} questions")
        return True
        
    except Exception as e:
        print(f"  ERROR processing {file_path}: {str(e)}")
        # Restore backup on error
        if os.path.exists(backup_path):
            shutil.copy2(backup_path, file_path)
            print(f"  Restored from backup due to error")
        return False

def main():
    """Main function to fix all quiz files"""
    # Define the quizzes directory relative to script location
    script_dir = Path(__file__).parent.absolute()
    quizzes_dir = script_dir / ".." / ".." / "content" / "quizzes"
    
    if not quizzes_dir.exists():
        print(f"ERROR: Quizzes directory not found: {quizzes_dir}")
        return
    
    # Find all JSON files
    json_files = list(quizzes_dir.glob('*.json'))
    
    if not json_files:
        print(f"No JSON files found in {quizzes_dir}")
        return
    
    print(f"Found {len(json_files)} quiz files to process")
    print("=" * 50)
    
    success_count = 0
    error_count = 0
    
    # Process each file
    for json_file in sorted(json_files):
        if fix_quiz_file(json_file):
            success_count += 1
        else:
            error_count += 1
        print()  # Empty line for readability
    
    # Summary
    print("=" * 50)
    print(f"SUMMARY:")
    print(f"  Successfully processed: {success_count} files")
    print(f"  Errors encountered: {error_count} files")
    print(f"  Total files: {len(json_files)}")
    
    if error_count == 0:
        print("\nAll quiz files have been successfully fixed!")
    else:
        print(f"\n{error_count} files had errors. Check the output above for details.")

if __name__ == "__main__":
    main()
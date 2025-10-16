#!/usr/bin/env python3
"""
Script to fix all int ID to string ID conversions in the backend.
This script will systematically update all controllers and GraphQL types.
"""

import os
import re
import sys

def fix_file(file_path, fixes):
    """Apply fixes to a specific file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all fixes for this file
        for pattern, replacement in fixes:
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        
        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed: {file_path}")
            return True
        else:
            print(f"⏭️  No changes needed: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False

def main():
    backend_dir = "/Users/veland/GlassCodeAcademy/glasscode/backend"
    
    if not os.path.exists(backend_dir):
        print(f"❌ Backend directory not found: {backend_dir}")
        sys.exit(1)
    
    print("🔧 Starting comprehensive ID type fixes (Round 2)...")
    
    # Define fixes for each file
    file_fixes = {
        # NextJs Lessons Controller - Fix hardcoded integer IDs
        f"{backend_dir}/Controllers/NextJsLessonsController.cs": [
            # Convert all hardcoded integer IDs to strings
            (r'new Lesson \{ Id = (\d+),', r'new Lesson { Id = "\1",'),
        ],
        
        # Lessons Controller - Fix hardcoded integer IDs  
        f"{backend_dir}/Controllers/LessonsController.cs": [
            (r'new Lesson \{ Id = (\d+),', r'new Lesson { Id = "\1",'),
        ],
        
        # GraphQL Types - Fix comparison issues
        f"{backend_dir}/GraphQL/GraphQLTypes.cs": [
            # Fix comparison where interview question ID is int but parameter is string
            (r'GraphQLInterviewQuestionsController\.Questions\.FirstOrDefault\(q => q\.Id == id\)', 
             'GraphQLInterviewQuestionsController.Questions.FirstOrDefault(q => q.Id.ToString() == id)'),
            (r'DotNetInterviewQuestionsController\.Questions\.FirstOrDefault\(q => q\.Id == id\)', 
             'DotNetInterviewQuestionsController.Questions.FirstOrDefault(q => q.Id.ToString() == id)'),
            (r'ProgrammingInterviewQuestionsController\.Questions\.FirstOrDefault\(q => q\.Id == id\)', 
             'ProgrammingInterviewQuestionsController.Questions.FirstOrDefault(q => q.Id.ToString() == id)'),
            # Fix Type assignment issue
            (r'Type = question\.Type', 'Type = question.Type.ToString()'),
        ],
        
        # GraphQL Interview Questions Controller - Fix comparison
        f"{backend_dir}/Controllers/GraphQLInterviewQuestionsController.cs": [
            (r'Questions\.FirstOrDefault\(q => q\.Id == id\)', 
             'Questions.FirstOrDefault(q => q.Id.ToString() == id)'),
        ],
    }
    
    total_files_changed = 0
    
    # Apply file-specific fixes
    for file_path, fixes in file_fixes.items():
        if os.path.exists(file_path):
            if fix_file(file_path, fixes):
                total_files_changed += 1
        else:
            print(f"⚠️  File not found: {file_path}")
    
    print(f"\n🎉 Round 2 completed! {total_files_changed} files were modified.")
    print("🔍 Next step: Test the backend to ensure all fixes work correctly.")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Comprehensive script to fix ID type inconsistencies across the codebase.
"""

import os
import re
import glob

def read_file(file_path):
    """Read file content safely"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None

def write_file(file_path, content):
    """Write file content safely"""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Updated {file_path}")
        return True
    except Exception as e:
        print(f"Error writing {file_path}: {e}")
        return False

def fix_answer_submission():
    """Fix AnswerSubmission to use string QuestionId"""
    # Get the script directory and navigate to the backend root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, "Models", "AnswerSubmission.cs")
    content = read_file(file_path)
    if not content:
        return False
    
    # Replace int QuestionId with string QuestionId
    content = content.replace(
        'public int QuestionId { get; set; }',
        'public string QuestionId { get; set; }'
    )
    
    return write_file(file_path, content)

def fix_controller_methods():
    """Fix all controller methods to use string parameters"""
    # Get the script directory and navigate to the backend root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    controller_files = [
        os.path.join(script_dir, "Controllers", "InterviewQuestionsController.cs"),
        os.path.join(script_dir, "Controllers", "NextJsInterviewQuestionsController.cs"),
        os.path.join(script_dir, "Controllers", "ReactInterviewQuestionsController.cs"),
        os.path.join(script_dir, "Controllers", "NodeInterviewQuestionsController.cs"),
        os.path.join(script_dir, "Controllers", "TypescriptInterviewQuestionsController.cs"),
        os.path.join(script_dir, "Controllers", "DatabaseInterviewQuestionsController.cs"),
        os.path.join(script_dir, "Controllers", "WebInterviewQuestionsController.cs"),
        os.path.join(script_dir, "Controllers", "TestingInterviewQuestionsController.cs"),
        os.path.join(script_dir, "Controllers", "SecurityInterviewQuestionsController.cs"),
        os.path.join(script_dir, "Controllers", "DotNetInterviewQuestionsController.cs")
    ]
    
    success_count = 0
    
    for file_path in controller_files:
        if not os.path.exists(file_path):
            continue
            
        content = read_file(file_path)
        if not content:
            continue
        
        original_content = content
        
        # Fix Get method parameter from int to string
        content = content.replace('Get(int id)', 'Get(string id)')
        
        # Remove .ToString() from Id comparisons
        content = content.replace('q.Id.ToString() == id', 'q.Id == id')
        
        # Fix hardcoded integer Id assignments in static data
        # Convert Id = 1, to Id = "1",
        for i in range(1, 100):  # Handle up to 99 questions
            content = content.replace(f'Id = {i},', f'Id = "{i}",')
        
        if content != original_content:
            if write_file(file_path, content):
                success_count += 1
    
    print(f"✓ Fixed {success_count} controller files")
    return success_count > 0

def fix_program_cs():
    """Fix Program.cs GraphQL methods to use string parameters"""
    file_path = "/Users/veland/GlassCodeAcademy/glasscode/backend/Program.cs"
    content = read_file(file_path)
    if not content:
        return False
    
    original_content = content
    
    # Fix all Submit*Answer methods to use string questionId
    submit_methods = [
        'SubmitReactAnswer',
        'SubmitNodeAnswer', 
        'SubmitWebAnswer',
        'SubmitTypescriptAnswer',
        'SubmitDatabaseAnswer',
        'SubmitTestingAnswer',
        'SubmitSecurityAnswer',
        'SubmitDotNetAnswer'
    ]
    
    for method in submit_methods:
        # Fix method signature
        content = content.replace(
            f'public AnswerResult {method}(int questionId, int answerIndex)',
            f'public AnswerResult {method}(string questionId, int answerIndex)'
        )
    
    # Fix GraphQL field argument types
    content = content.replace('.Argument<IntType>("questionId")', '.Argument<StringType>("questionId")')
    
    if content != original_content:
        return write_file(file_path, content)
    
    return True

def fix_data_service():
    """Fix DataService validation methods to use string parameters"""
    file_path = "/Users/veland/GlassCodeAcademy/glasscode/backend/Services/DataService.cs"
    content = read_file(file_path)
    if not content:
        return False
    
    original_content = content
    
    # Fix all Validate*Answer methods to use string questionId
    validate_methods = [
        'ValidateReactAnswer',
        'ValidateNodeAnswer',
        'ValidateWebAnswer', 
        'ValidateTypescriptAnswer',
        'ValidateDatabaseAnswer',
        'ValidateTestingAnswer',
        'ValidateSecurityAnswer',
        'ValidateDotNetAnswer'
    ]
    
    for method in validate_methods:
        # Fix method signature
        content = content.replace(
            f'public AnswerResult {method}(int questionId, int answerIndex)',
            f'public AnswerResult {method}(string questionId, int answerIndex)'
        )
        
        # Remove .ToString() from comparisons
        content = content.replace('q.Id.ToString() == questionId.ToString()', 'q.Id == questionId')
        content = content.replace('q.Id.ToString() == questionId', 'q.Id == questionId')
    
    if content != original_content:
        return write_file(file_path, content)
    
    return True

def main():
    """Main function to run all fixes"""
    print("🔧 Starting comprehensive ID type consistency fixes...")
    print("=" * 60)
    
    fixes = [
        ("AnswerSubmission model", fix_answer_submission),
        ("Controller methods", fix_controller_methods), 
        ("Program.cs GraphQL methods", fix_program_cs),
        ("DataService validation methods", fix_data_service)
    ]
    
    success_count = 0
    total_count = len(fixes)
    
    for description, fix_function in fixes:
        print(f"\n📝 Fixing {description}...")
        try:
            if fix_function():
                print(f"✅ {description} - SUCCESS")
                success_count += 1
            else:
                print(f"⚠️  {description} - NO CHANGES NEEDED")
                success_count += 1
        except Exception as e:
            print(f"❌ {description} - FAILED: {e}")
    
    print("\n" + "=" * 60)
    print(f"🎯 Completed: {success_count}/{total_count} fixes successful")
    
    if success_count == total_count:
        print("🎉 All ID type inconsistencies have been fixed!")
        print("\nNext steps:")
        print("1. Build the backend to verify no compilation errors")
        print("2. Test the endpoints to ensure functionality works")
    else:
        print("⚠️  Some fixes may need manual attention")
    
    return success_count == total_count

if __name__ == "__main__":
    main()